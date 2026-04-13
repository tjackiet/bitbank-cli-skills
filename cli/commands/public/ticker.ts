import type { z } from "zod";
import { type HttpOptions, publicGet } from "../../http.js";
import type { Result } from "../../types.js";
import { TickerSchema } from "../shared-schemas.js";

export type Ticker = z.infer<typeof TickerSchema>;

export async function ticker(
  args: { pair: string | undefined },
  opts?: HttpOptions,
): Promise<Result<Ticker>> {
  const { pair } = args;
  if (!pair) {
    return { success: false, error: "pair is required. Example: npx bitbank ticker btc_jpy" };
  }
  const result = await publicGet<unknown>(`/${pair}/ticker`, opts);
  if (!result.success) return result;

  const parsed = TickerSchema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  return { success: true, data: parsed.data };
}

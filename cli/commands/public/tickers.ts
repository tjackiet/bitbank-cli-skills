import { z } from "zod";
import { type HttpOptions, publicGet } from "../../http.js";
import type { Result } from "../../types.js";
import { TickerWithPairSchema } from "../shared-schemas.js";

const TickersSchema = z.array(TickerWithPairSchema);
export type TickerItem = z.infer<typeof TickerWithPairSchema>;

export async function tickers(opts?: HttpOptions): Promise<Result<TickerItem[]>> {
  const result = await publicGet<unknown>("/tickers", opts);
  if (!result.success) return result;

  const parsed = TickersSchema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  return { success: true, data: parsed.data };
}

export async function tickersJpy(opts?: HttpOptions): Promise<Result<TickerItem[]>> {
  const result = await publicGet<unknown>("/tickers_jpy", opts);
  if (!result.success) return result;

  const parsed = TickersSchema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  return { success: true, data: parsed.data };
}

import { z } from "zod";
import { publicGet, type HttpOptions } from "../../http.js";
import { type Result } from "../../types.js";

const TickerSchema = z.object({
  sell: z.string().transform(Number),
  buy: z.string().transform(Number),
  high: z.string().transform(Number),
  low: z.string().transform(Number),
  open: z.string().transform(Number),
  last: z.string().transform(Number),
  vol: z.string().transform(Number),
  timestamp: z.number(),
});

export type Ticker = z.infer<typeof TickerSchema>;

export async function ticker(
  pair: string | undefined,
  opts?: HttpOptions,
): Promise<Result<Ticker>> {
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

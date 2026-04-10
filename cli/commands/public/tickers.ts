import { z } from "zod";
import { type HttpOptions, publicGet } from "../../http.js";
import { nullableNumStr } from "../../schema-helpers.js";
import type { Result } from "../../types.js";

const TickerItemSchema = z.object({
  pair: z.string(),
  sell: nullableNumStr,
  buy: nullableNumStr,
  high: nullableNumStr,
  low: nullableNumStr,
  open: nullableNumStr,
  last: nullableNumStr,
  vol: nullableNumStr,
  timestamp: z.number(),
});

const TickersSchema = z.array(TickerItemSchema);
export type TickerItem = z.infer<typeof TickerItemSchema>;

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

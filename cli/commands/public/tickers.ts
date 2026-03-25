import { z } from "zod";
import { publicGet, type HttpOptions } from "../../http.js";
import { type Result } from "../../types.js";

const TickerItemSchema = z.object({
  pair: z.string(),
  sell: z.string().transform(Number),
  buy: z.string().transform(Number),
  high: z.string().transform(Number),
  low: z.string().transform(Number),
  open: z.string().transform(Number),
  last: z.string().transform(Number),
  vol: z.string().transform(Number),
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

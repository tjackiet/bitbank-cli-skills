import { z } from "zod";
import { isCompletePeriod, readCache, writeCache } from "../../cache.js";
import { type HttpOptions, publicGet } from "../../http.js";
import { numStr } from "../../schema-helpers.js";
import type { Result } from "../../types.js";

export const VALID_TYPES = [
  "1min",
  "5min",
  "15min",
  "30min",
  "1hour",
  "4hour",
  "8hour",
  "12hour",
  "1day",
  "1week",
  "1month",
] as const;

const CandleSchema = z.tuple([numStr, numStr, numStr, numStr, numStr, z.number()]);

const CandlestickSchema = z.object({
  candlestick: z.array(
    z.object({
      type: z.string(),
      ohlcv: z.array(CandleSchema),
    }),
  ),
});

export type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  vol: number;
  timestamp: number;
};

export async function fetchOne(
  pair: string,
  type: string,
  dateStr: string,
  opts?: HttpOptions,
  noCache?: boolean,
): Promise<Result<Candle[]>> {
  if (!noCache) {
    const cached = readCache<Candle[]>(pair, type, dateStr);
    if (cached) return { success: true, data: cached };
  }

  const result = await publicGet<unknown>(`/${pair}/candlestick/${type}/${dateStr}`, opts);
  if (!result.success) return result;

  const parsed = CandlestickSchema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  const ohlcv = parsed.data.candlestick[0]?.ohlcv ?? [];
  const rows: Candle[] = ohlcv.map(([open, high, low, close, vol, timestamp]) => ({
    open,
    high,
    low,
    close,
    vol,
    timestamp,
  }));
  if (!noCache && isCompletePeriod(dateStr)) writeCache(pair, type, dateStr, rows);
  return { success: true, data: rows };
}

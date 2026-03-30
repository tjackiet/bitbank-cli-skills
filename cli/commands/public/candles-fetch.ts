import { z } from "zod";
import { isCompletePeriod, readCache, writeCache } from "../../cache.js";
import { type HttpOptions, publicGet } from "../../http.js";
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

export const YEARLY_TYPES = new Set(["4hour", "8hour", "12hour", "1day", "1week", "1month"]);

const Num = z.string().transform(Number);
const CandleSchema = z.tuple([Num, Num, Num, Num, Num, z.number()]);

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

export function previousDate(dateStr: string, type: string): string {
  if (YEARLY_TYPES.has(type)) return String(Number(dateStr) - 1);
  const y = Number(dateStr.slice(0, 4));
  const m = Number(dateStr.slice(4, 6)) - 1;
  const d = Number(dateStr.slice(6, 8));
  const prev = new Date(y, m, d - 1);
  const py = prev.getFullYear();
  const pm = String(prev.getMonth() + 1).padStart(2, "0");
  const pd = String(prev.getDate()).padStart(2, "0");
  return `${py}${pm}${pd}`;
}

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

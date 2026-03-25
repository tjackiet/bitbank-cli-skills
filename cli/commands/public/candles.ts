import { z } from "zod";
import { publicGet, type HttpOptions } from "../../http.js";
import { type Result } from "../../types.js";

const VALID_TYPES = [
  "1min", "5min", "15min", "30min",
  "1hour", "4hour", "8hour", "12hour",
  "1day", "1week", "1month",
] as const;

const CandleSchema = z.tuple([
  z.string().transform(Number), // open
  z.string().transform(Number), // high
  z.string().transform(Number), // low
  z.string().transform(Number), // close
  z.string().transform(Number), // vol
  z.number(),                   // timestamp
]);

const CandlestickSchema = z.object({
  candlestick: z.array(z.object({
    type: z.string(),
    ohlcv: z.array(CandleSchema),
  })),
});

export type Candle = { open: number; high: number; low: number; close: number; vol: number; timestamp: number };

const YEARLY_TYPES = new Set(["4hour", "8hour", "12hour", "1day", "1week", "1month"]);

function todayDate(type: string): string {
  const now = new Date();
  if (YEARLY_TYPES.has(type)) {
    return String(now.getFullYear());
  }
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export async function candles(
  pair: string | undefined,
  type: string | undefined,
  date: string | undefined,
  limit: number,
  opts?: HttpOptions,
): Promise<Result<Candle[]>> {
  if (!pair) {
    return { success: false, error: "pair is required. Example: npx bitbank candles btc_jpy --type=1hour" };
  }
  if (!type || !VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    return { success: false, error: `--type is required. Valid: ${VALID_TYPES.join(", ")}` };
  }
  const dateStr = date ?? todayDate(type);
  if (date && YEARLY_TYPES.has(type) && date.length !== 4) {
    return { success: false, error: `--type=${type} では年を指定してください（例: --date=2025）。日付単位のデータには 1hour 等を使ってください` };
  }
  if (date && !YEARLY_TYPES.has(type) && date.length !== 8) {
    return { success: false, error: `--type=${type} では日付を指定してください（例: --date=20250301）` };
  }
  const result = await publicGet<unknown>(`/${pair}/candlestick/${type}/${dateStr}`, opts);
  if (!result.success) return result;

  const parsed = CandlestickSchema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  const ohlcv = parsed.data.candlestick[0]?.ohlcv ?? [];
  const rows: Candle[] = ohlcv.map(([open, high, low, close, vol, timestamp]) => ({
    open, high, low, close, vol, timestamp,
  }));
  return { success: true, data: rows.slice(-limit) };
}

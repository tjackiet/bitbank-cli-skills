import { z } from "zod";
import { type HttpOptions, publicGet } from "../../http.js";
import type { Result } from "../../types.js";

const VALID_TYPES = [
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

const CandleSchema = z.tuple([
  z
    .string()
    .transform(Number), // open
  z
    .string()
    .transform(Number), // high
  z
    .string()
    .transform(Number), // low
  z
    .string()
    .transform(Number), // close
  z
    .string()
    .transform(Number), // vol
  z.number(), // timestamp
]);

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

export function previousDate(dateStr: string, type: string): string {
  if (YEARLY_TYPES.has(type)) {
    return String(Number(dateStr) - 1);
  }
  const y = Number(dateStr.slice(0, 4));
  const m = Number(dateStr.slice(4, 6)) - 1;
  const d = Number(dateStr.slice(6, 8));
  const prev = new Date(y, m, d - 1);
  const py = prev.getFullYear();
  const pm = String(prev.getMonth() + 1).padStart(2, "0");
  const pd = String(prev.getDate()).padStart(2, "0");
  return `${py}${pm}${pd}`;
}

const MAX_FETCHES = 3;

async function fetchOne(
  pair: string, type: string, dateStr: string, opts?: HttpOptions,
): Promise<Result<Candle[]>> {
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
  return { success: true, data: rows };
}

export async function candles(
  pair: string | undefined,
  type: string | undefined,
  date: string | undefined,
  limit: number,
  opts?: HttpOptions,
): Promise<Result<Candle[]>> {
  if (!pair) {
    return {
      success: false,
      error: "pair is required. Example: npx bitbank candles btc_jpy --type=1hour",
    };
  }
  if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return { success: false, error: `--type is required. Valid: ${VALID_TYPES.join(", ")}` };
  }

  const dateStr = date ?? todayDate(type);
  if (date && YEARLY_TYPES.has(type) && date.length !== 4) {
    return {
      success: false,
      error: `--type=${type} では年を指定してください（例: --date=2025）。日付単位のデータには 1hour 等を使ってください`,
    };
  }
  if (date && !YEARLY_TYPES.has(type) && date.length !== 8) {
    return {
      success: false,
      error: `--type=${type} では日付を指定してください（例: --date=20250301）`,
    };
  }

  const autoMerge = date === undefined;
  const first = await fetchOne(pair, type, dateStr, opts);
  if (!first.success) return first;

  let allRows = first.data;

  if (autoMerge) {
    let currentDate = dateStr;
    let fetches = 1;
    while (allRows.length < limit && fetches < MAX_FETCHES) {
      currentDate = previousDate(currentDate, type);
      const prev = await fetchOne(pair, type, currentDate, opts);
      if (!prev.success) break;
      allRows = [...prev.data, ...allRows];
      fetches++;
    }
  }
<<<<<<< HEAD
  const ohlcv = parsed.data.candlestick[0]?.ohlcv ?? [];
  const rows: Candle[] = ohlcv.map(([open, high, low, close, vol, timestamp]) => ({
    open,
    high,
    low,
    close,
    vol,
    timestamp,
  }));
  return { success: true, data: rows.slice(-limit) };
=======

  return { success: true, data: allRows.slice(-limit) };
>>>>>>> 9820689 (feat: candles コマンドの --limit で年跨ぎ自動結合)
}

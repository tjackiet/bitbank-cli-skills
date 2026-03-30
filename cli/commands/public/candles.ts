import type { HttpOptions } from "../../http.js";
import type { Result } from "../../types.js";
import { type Candle, VALID_TYPES, YEARLY_TYPES, fetchOne, previousDate } from "./candles-fetch.js";
import { candlesRange } from "./candles-range.js";

export type { Candle };
export { VALID_TYPES, previousDate } from "./candles-fetch.js";
export { nextDate } from "./candles-range.js";

function todayDate(type: string): string {
  const now = new Date();
  if (YEARLY_TYPES.has(type)) return String(now.getFullYear());
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

const MAX_FETCHES = 3;

function validateType(type: string | undefined): Result<string> {
  if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return { success: false, error: `--type is required. Valid: ${VALID_TYPES.join(", ")}` };
  }
  return { success: true, data: type };
}

function validateDateFormat(date: string, type: string, label: string): Result<string> {
  if (YEARLY_TYPES.has(type) && date.length !== 4) {
    return {
      success: false,
      error: `${label} は年を指定してください（例: 2025）。日付単位のデータには 1hour 等を使ってください`,
    };
  }
  if (!YEARLY_TYPES.has(type) && date.length !== 8) {
    return { success: false, error: `${label} は日付を指定してください（例: 20250301）` };
  }
  return { success: true, data: date };
}

export async function candles(
  pair: string | undefined,
  type: string | undefined,
  date: string | undefined,
  limit: number | undefined,
  from?: string,
  to?: string,
  opts?: HttpOptions,
): Promise<Result<Candle[]>> {
  if (!pair) {
    return {
      success: false,
      error: "pair is required. Example: npx bitbank candles btc_jpy --type=1hour",
    };
  }
  const tv = validateType(type);
  if (!tv.success) return tv;

  if ((from || to) && date) {
    return { success: false, error: "--date と --from/--to は同時に指定できません" };
  }
  if ((from && !to) || (!from && to)) {
    return { success: false, error: "--from と --to は両方指定してください" };
  }

  if (from && to) {
    const fv = validateDateFormat(from, type!, "--from");
    if (!fv.success) return fv;
    const tov = validateDateFormat(to, type!, "--to");
    if (!tov.success) return tov;
    if (from > to) return { success: false, error: "--from は --to 以前の日付にしてください" };
    return candlesRange(pair, type!, from, to, opts);
  }

  const effectiveLimit = limit ?? 100;
  const dateStr = date ?? todayDate(type!);
  if (date) {
    const dv = validateDateFormat(date, type!, "--date");
    if (!dv.success) return dv;
  }

  const autoMerge = date === undefined;
  const first = await fetchOne(pair, type!, dateStr, opts);
  if (!first.success) return first;

  let allRows = first.data;
  if (autoMerge) {
    let currentDate = dateStr;
    let fetches = 1;
    while (allRows.length < effectiveLimit && fetches < MAX_FETCHES) {
      currentDate = previousDate(currentDate, type!);
      const prev = await fetchOne(pair, type!, currentDate, opts);
      if (!prev.success) break;
      allRows = [...prev.data, ...allRows];
      fetches++;
    }
  }

  return { success: true, data: allRows.slice(-effectiveLimit) };
}

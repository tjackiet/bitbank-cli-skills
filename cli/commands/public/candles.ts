import { YEARLY_TYPES, shiftDate, todayDate } from "../../date-utils.js";
import type { HttpOptions } from "../../http.js";
import type { Result } from "../../types.js";
import { type Candle, VALID_TYPES, fetchOne } from "./candles-fetch.js";
import { candlesRange } from "./candles-range.js";

export type { Candle };
export { VALID_TYPES } from "./candles-fetch.js";
export { shiftDate, todayDate } from "../../date-utils.js";

// --date 未指定時に自動取得する過去日数の上限
const MAX_FETCHES = 3;
function validateType(type: string | undefined): string | null {
  if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) return null;
  return type;
}

function validateDateFormat(date: string, type: string, label: string): Result<string> {
  if (YEARLY_TYPES.has(type) && date.length !== 4) {
    return {
      success: false,
      error: `${label} must be a year (e.g. 2025). Use 1hour or shorter for daily data`,
    };
  }
  if (!YEARLY_TYPES.has(type) && date.length !== 8) {
    return { success: false, error: `${label} must be a date (e.g. 20250301)` };
  }
  return { success: true, data: date };
}

type CandlesArgs = {
  pair: string | undefined;
  type: string | undefined;
  date?: string;
  limit?: number;
  from?: string;
  to?: string;
  noCache?: boolean;
};

export async function candles(args: CandlesArgs, opts?: HttpOptions): Promise<Result<Candle[]>> {
  const { pair, type, date, limit, from, to, noCache } = args;
  if (!pair) return { success: false, error: "pair is required. Example: --pair=btc_jpy" };
  const validType = validateType(type);
  if (!validType) {
    return { success: false, error: `--type is required. Valid: ${VALID_TYPES.join(", ")}` };
  }

  if ((from || to) && date) {
    return { success: false, error: "--date and --from/--to cannot be used together" };
  }
  if ((from && !to) || (!from && to)) {
    return { success: false, error: "--from and --to must both be specified" };
  }

  if (from && to) {
    const fv = validateDateFormat(from, validType, "--from");
    if (!fv.success) return fv;
    const tov = validateDateFormat(to, validType, "--to");
    if (!tov.success) return tov;
    if (from > to) return { success: false, error: "--from must be before or equal to --to" };
    return candlesRange(pair, validType, from, to, opts, noCache);
  }

  const effectiveLimit = limit ?? 100;
  const dateStr = date ?? todayDate(validType);
  if (date) {
    const dv = validateDateFormat(date, validType, "--date");
    if (!dv.success) return dv;
  }

  const autoMerge = date === undefined;
  const first = await fetchOne(pair, validType, dateStr, opts, noCache);
  if (!first.success) return first;

  const chunks: Candle[][] = [first.data];
  if (autoMerge) {
    let currentDate = dateStr;
    let fetches = 1;
    let total = first.data.length;
    while (total < effectiveLimit && fetches < MAX_FETCHES) {
      currentDate = shiftDate(currentDate, -1, validType);
      const prev = await fetchOne(pair, validType, currentDate, opts, noCache);
      if (!prev.success) break;
      chunks.unshift(prev.data);
      total += prev.data.length;
      fetches++;
    }
  }

  const allRows = chunks.length === 1 ? chunks[0] : ([] as Candle[]).concat(...chunks);
  return { success: true, data: allRows.slice(-effectiveLimit) };
}

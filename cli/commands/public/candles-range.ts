import type { HttpOptions } from "../../http.js";
import type { Result } from "../../types.js";
import { type Candle, YEARLY_TYPES, fetchOne } from "./candles-fetch.js";

const MAX_RANGE_FETCHES = 366;

export function nextDate(dateStr: string, type: string): string {
  if (YEARLY_TYPES.has(type)) {
    return String(Number(dateStr) + 1);
  }
  const y = Number(dateStr.slice(0, 4));
  const m = Number(dateStr.slice(4, 6)) - 1;
  const d = Number(dateStr.slice(6, 8));
  const next = new Date(y, m, d + 1);
  const ny = next.getFullYear();
  const nm = String(next.getMonth() + 1).padStart(2, "0");
  const nd = String(next.getDate()).padStart(2, "0");
  return `${ny}${nm}${nd}`;
}

export async function candlesRange(
  pair: string,
  type: string,
  from: string,
  to: string,
  opts?: HttpOptions,
): Promise<Result<Candle[]>> {
  const allRows: Candle[] = [];
  let current = from;
  let fetches = 0;

  while (current <= to && fetches < MAX_RANGE_FETCHES) {
    const result = await fetchOne(pair, type, current, opts);
    if (!result.success) {
      if (fetches === 0) return result;
      break;
    }
    allRows.push(...result.data);
    current = nextDate(current, type);
    fetches++;
  }

  return { success: true, data: allRows };
}

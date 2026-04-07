import type { HttpOptions } from "../../http.js";
import type { Result } from "../../types.js";
import { type Candle, YEARLY_TYPES, fetchOne } from "./candles-fetch.js";

const MAX_RANGE_FETCHES = 366;
const BATCH_SIZE = 10;

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

function buildDateList(from: string, to: string, type: string): string[] {
  const dates: string[] = [];
  let current = from;
  while (current <= to && dates.length < MAX_RANGE_FETCHES) {
    dates.push(current);
    current = nextDate(current, type);
  }
  return dates;
}

export async function candlesRange(
  pair: string,
  type: string,
  from: string,
  to: string,
  opts?: HttpOptions,
  noCache?: boolean,
): Promise<Result<Candle[]>> {
  const dates = buildDateList(from, to, type);
  const allRows: Candle[] = [];

  for (let i = 0; i < dates.length; i += BATCH_SIZE) {
    const batch = dates.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((d) => fetchOne(pair, type, d, opts, noCache)));
    for (const result of results) {
      if (!result.success) {
        if (allRows.length === 0) return result;
        return { success: true, data: allRows };
      }
      allRows.push(...result.data);
    }
  }

  return { success: true, data: allRows };
}

import { appendFileSync } from "node:fs";
import type { TradeLogRecord } from "./trade-log-schema.js";
import type { Result } from "./types.js";

/** NDJSON 形式でログレコードをファイルに追記 */
export function writeTradeLog(logFile: string, record: TradeLogRecord): Result<{ written: true }> {
  try {
    appendFileSync(logFile, `${JSON.stringify(record)}\n`, "utf8");
    return { success: true, data: { written: true } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: `Failed to write trade log: ${msg}` };
  }
}

/** API 実行結果からログレコードを組み立てる */
export function buildLogRecord(
  command: string,
  params: Record<string, unknown>,
  result: { success: boolean; data?: unknown; error?: string },
): TradeLogRecord {
  return {
    timestamp: new Date().toISOString(),
    command,
    params,
    success: result.success,
    ...(result.success ? { data: result.data } : { error: String(result.error) }),
  };
}

import { appendFile } from "node:fs/promises";
import type { TradeLogRecord } from "./trade-log-schema.js";
import type { Result } from "./types.js";

/** NDJSON 形式でログレコードをファイルに非同期追記 */
export async function writeTradeLog(
  logFile: string,
  record: TradeLogRecord,
): Promise<Result<{ written: true }>> {
  try {
    await appendFile(logFile, `${JSON.stringify(record)}\n`, "utf8");
    return { success: true, data: { written: true } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: `Failed to write trade log: ${msg}` };
  }
}

const SENSITIVE_KEYS = new Set(["token", "otp_token"]);
const SENSITIVE_PATTERN = /secret|password|credential|auth_token/i;

function maskSensitive(params: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...params };
  for (const key of Object.keys(masked)) {
    if (SENSITIVE_KEYS.has(key) || SENSITIVE_PATTERN.test(key)) {
      masked[key] = "***";
    }
  }
  return masked;
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
    params: maskSensitive(params),
    success: result.success,
    ...(result.success ? { data: result.data } : { error: String(result.error) }),
  };
}

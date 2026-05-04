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

function maskSensitiveDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskSensitiveDeep);
  if (value !== null && typeof value === "object") {
    const masked: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k) || SENSITIVE_PATTERN.test(k)) {
        masked[k] = "***";
      } else {
        masked[k] = maskSensitiveDeep(v);
      }
    }
    return masked;
  }
  return value;
}

function maskSensitive(params: Record<string, unknown>): Record<string, unknown> {
  return maskSensitiveDeep(params) as Record<string, unknown>;
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
    ...(result.success
      ? { data: maskSensitiveDeep(result.data) }
      : { error: String(result.error) }),
  };
}

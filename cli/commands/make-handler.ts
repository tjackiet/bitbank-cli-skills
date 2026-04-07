import { output } from "../output.js";
import { buildLogRecord, writeTradeLog } from "../trade-log.js";
import type { CommandHandler, ParsedValues } from "./handler-types.js";

/** Public/Private 用: module を動的 import して fn(...extractedArgs) → output */
export function handler(
  modulePath: string,
  fnName: string,
  extract: (args: string[], values: ParsedValues) => unknown[],
): CommandHandler {
  return async (args, values, fmt) => {
    const mod = await import(modulePath);
    output(
      await mod[fnName](...extract(args, values)),
      fmt,
      values.raw === true,
      values.machine === true,
    );
  };
}

function isDryRun(r: { success: boolean; data?: unknown }): boolean {
  return r.success && typeof r.data === "object" && r.data !== null && "dryRun" in r.data;
}

/** Trade 用: module を動的 import して fn(params) → isDryRun check → output + log */
export function tradeHandler(
  modulePath: string,
  fnName: string,
  extract: (values: ParsedValues) => Record<string, unknown>,
): CommandHandler {
  return async (_a, values, fmt) => {
    const mod = await import(modulePath);
    const params = extract(values);
    const r = await mod[fnName](params);
    if (isDryRun(r)) return;
    output(r, fmt, values.raw === true, values.machine === true);
    const logFile = values["log-file"] as string | undefined;
    if (logFile) await writeTradeLog(logFile, buildLogRecord(fnName, params, r));
  };
}

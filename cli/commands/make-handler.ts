import { output } from "../output.js";
import type { CommandHandler, ParsedValues } from "./handler-types.js";

/** Public/Private 用: module を動的 import して fn(...extractedArgs) → output */
export function handler(
  modulePath: string,
  fnName: string,
  extract: (args: string[], values: ParsedValues) => unknown[],
): CommandHandler {
  return async (args, values, fmt) => {
    const mod = await import(modulePath);
    output(await mod[fnName](...extract(args, values)), fmt);
  };
}

function isDryRun(r: { success: boolean; data?: unknown }): boolean {
  return r.success && typeof r.data === "object" && r.data !== null && "dryRun" in r.data;
}

/** Trade 用: module を動的 import して fn(params) → isDryRun check → output */
export function tradeHandler(
  modulePath: string,
  fnName: string,
  extract: (values: ParsedValues) => Record<string, unknown>,
): CommandHandler {
  return async (_a, values, fmt) => {
    const mod = await import(modulePath);
    const r = await mod[fnName](extract(values));
    if (!isDryRun(r)) output(r, fmt);
  };
}

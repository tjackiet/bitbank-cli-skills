import type { Result } from "./types.js";

function msg(field: string, example: string): string {
  return `${field} is required. Example: ${example}`;
}

// Option-style (--flag=value)
export const MSG_PAIR = msg("pair", "--pair=btc_jpy");
export const MSG_ASSET = msg("asset", "--asset=btc");
export const MSG_ORDER_ID = msg("order-id", "--order-id=12345");
export const MSG_ORDER_IDS = msg("order-ids", "--order-ids=1,2,3");
export const MSG_ORDER_IDS_INFO = msg("order-ids", "--order-ids=123,456");
export const MSG_UUID = msg("uuid", "--uuid=xxx-yyy");
export const MSG_AMOUNT = msg("amount", "--amount=0.5");
export const MSG_ID = msg("id", "--id=12345");

// Positional-style (npx bitbank <cmd> <pair>)
export const MSG_PAIR_TICKER = msg("pair", "npx bitbank ticker btc_jpy");
export const MSG_PAIR_DEPTH = msg("pair", "npx bitbank depth btc_jpy");
export const MSG_PAIR_TRANSACTIONS = msg("pair", "npx bitbank transactions btc_jpy");
export const MSG_PAIR_CIRCUIT_BREAK = msg("pair", "npx bitbank circuit-break btc_jpy");

export function requireField<T>(value: T | undefined | null, message: string): Result<T> {
  if (!value) return { success: false, error: message };
  return { success: true, data: value };
}

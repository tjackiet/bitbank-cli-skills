import { type FetchCandles, runTick } from "../../paper-fill.js";
import { type OpenOrder, defaultStatePath, loadState } from "../../paper-state.js";
import type { Result } from "../../types.js";

export type PaperActiveOrdersArgs = {
  statePath?: string;
  fetchCandles?: FetchCandles;
  nowMs?: number;
  feeRate?: number;
};

export async function paperActiveOrders(
  args: PaperActiveOrdersArgs = {},
): Promise<Result<OpenOrder[]>> {
  const path = args.statePath ?? defaultStatePath();
  await runTick({
    statePath: path,
    fetchCandles: args.fetchCandles,
    nowMs: args.nowMs,
    feeRate: args.feeRate,
  });
  const r = await loadState(path);
  if (!r.success) return r;
  if (!r.data) {
    return {
      success: false,
      error: "paper state not initialized. Run 'bitbank paper init --jpy=<amount>' first.",
    };
  }
  return { success: true, data: r.data.openOrders };
}

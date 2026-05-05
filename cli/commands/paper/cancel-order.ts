import { z } from "zod";
import {
  type OpenOrder,
  type PaperState,
  defaultStatePath,
  loadState,
  nowIso,
  saveState,
} from "../../paper-state.js";
import type { Result } from "../../types.js";

const InputSchema = z.object({ id: z.string().trim().min(1, "--id is required") });

export type PaperCancelOrderArgs = {
  id?: string;
  statePath?: string;
};

export async function paperCancelOrder(
  args: PaperCancelOrderArgs,
): Promise<Result<{ canceled: OpenOrder }>> {
  const parsed = InputSchema.safeParse({ id: args.id });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const path = args.statePath ?? defaultStatePath();
  const r = await loadState(path);
  if (!r.success) return r;
  if (!r.data) {
    return {
      success: false,
      error: "paper state not initialized. Run 'bitbank paper init --jpy=<amount>' first.",
    };
  }
  const target = r.data.openOrders.find((o) => o.id === parsed.data.id);
  if (!target) {
    return { success: false, error: `open order not found: ${parsed.data.id}` };
  }
  const updatedAt = nowIso();
  const newState: PaperState = {
    ...r.data,
    updatedAt,
    openOrders: r.data.openOrders.filter((o) => o.id !== parsed.data.id),
  };
  const w = await saveState(newState, path);
  if (!w.success) return w;
  return { success: true, data: { canceled: target } };
}

// trade-history.ts を自動ページングで全件取得するラッパー
// CLI では `trade-history --all` で呼び出される
import type { PrivateHttpOptions } from "../../http-private.js";
import type { Result } from "../../types.js";
import { MSG_PAIR } from "../../validators.js";
import { type Trade, tradeHistory } from "./trade-history.js";

// bitbank API の1リクエストあたり最大取得件数
const PAGE_SIZE = 1000;

type TradeHistoryAllArgs = {
  pair: string | undefined;
  since?: string;
  end?: string;
};

export async function tradeHistoryAll(
  args: TradeHistoryAllArgs,
  opts?: PrivateHttpOptions,
): Promise<Result<Trade[]>> {
  if (!args.pair) {
    return { success: false, error: MSG_PAIR };
  }

  const allTrades: Trade[] = [];
  const seen = new Set<number>();
  let since = args.since;

  for (;;) {
    const result = await tradeHistory(
      {
        pair: args.pair,
        count: String(PAGE_SIZE),
        order: "asc",
        since,
        end: args.end,
      },
      opts,
    );
    if (!result.success) return result;

    const trades = result.data;
    let added = 0;
    for (const t of trades) {
      if (!seen.has(t.trade_id)) {
        seen.add(t.trade_id);
        allTrades.push(t);
        added++;
      }
    }

    if (trades.length < PAGE_SIZE) break;
    if (added === 0) break;

    const last = trades[trades.length - 1];
    since = String(last.executed_at);
  }

  return { success: true, data: allTrades };
}

// 単一ページの約定履歴取得 (GET /user/spot/trade_history)
// 全件取得が必要な場合は trade-history-all.ts を使う（自動ページング）
import { z } from "zod";
import { type PrivateHttpOptions, privateGet } from "../../http-private.js";
import { compactParams } from "../../params.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { MSG_PAIR } from "../../validators.js";

const TradeSchema = z.object({
  trade_id: z.number(),
  pair: z.string(),
  order_id: z.number(),
  side: z.string(),
  type: z.string(),
  amount: z.string(),
  price: z.string(),
  maker_taker: z.string(),
  fee_amount_base: z.string(),
  fee_amount_quote: z.string(),
  executed_at: z.number(),
});

const TradeHistoryResponseSchema = z.object({
  trades: z.array(TradeSchema),
});

export type Trade = z.infer<typeof TradeSchema>;

type TradeHistoryArgs = {
  pair: string | undefined;
  count?: string;
  orderId?: string;
  since?: string;
  end?: string;
  order?: string;
};

export async function tradeHistory(
  args: TradeHistoryArgs,
  opts?: PrivateHttpOptions,
): Promise<Result<Trade[]>> {
  if (!args.pair) {
    return { success: false, error: MSG_PAIR };
  }
  const params = compactParams({
    pair: args.pair,
    count: args.count,
    order_id: args.orderId,
    since: args.since,
    end: args.end,
    order: args.order,
  });

  const result = await privateGet<unknown>("/user/spot/trade_history", params, opts);
  return parseResponse(result, TradeHistoryResponseSchema, "trades");
}

/** --all 分岐を吸収するディスパッチ関数 */
export async function tradeHistoryDispatch(args: {
  pair: string | undefined;
  count?: string;
  orderId?: string;
  since?: string;
  end?: string;
  order?: string;
  all: boolean;
}): Promise<Result<Trade[]>> {
  if (args.all) {
    const { tradeHistoryAll } = await import("./trade-history-all.js");
    return tradeHistoryAll({ pair: args.pair, since: args.since, end: args.end });
  }
  return tradeHistory(args);
}

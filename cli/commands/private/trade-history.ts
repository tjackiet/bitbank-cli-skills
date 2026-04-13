// 単一ページの約定履歴取得 (GET /user/spot/trade_history)
// 全件取得が必要な場合は trade-history-all.ts を使う（自動ページング）
import { z } from "zod";
import { type PrivateHttpOptions, privateGet } from "../../http-private.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";

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
    return { success: false, error: "pair is required. Example: --pair=btc_jpy" };
  }
  const params: Record<string, string> = { pair: args.pair };
  if (args.count) params.count = args.count;
  if (args.orderId) params.order_id = args.orderId;
  if (args.since) params.since = args.since;
  if (args.end) params.end = args.end;
  if (args.order) params.order = args.order;

  const result = await privateGet<unknown>("/user/spot/trade_history", params, opts);
  return parseResponse(result, TradeHistoryResponseSchema, "trades");
}

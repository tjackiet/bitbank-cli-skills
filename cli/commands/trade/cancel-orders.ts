import { z } from "zod";
import { type PrivatePostOptions, privatePost } from "../../http-private-post.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { printDryRun } from "./dry-run.js";

const CancelOrderItemSchema = z.object({
  order_id: z.number(),
  pair: z.string(),
  side: z.string(),
  type: z.string(),
  price: z.string().nullable(),
  status: z.string(),
});

const CancelOrdersResponseSchema = z.object({
  orders: z.array(CancelOrderItemSchema),
});

export type CancelOrdersResponse = z.infer<typeof CancelOrdersResponseSchema>;

const MAX_ORDER_IDS = 30;

export type CancelOrdersArgs = {
  pair?: string;
  orderIds?: string;
  execute?: boolean;
};

export async function cancelOrders(
  args: CancelOrdersArgs,
  opts?: PrivatePostOptions,
): Promise<Result<CancelOrdersResponse | { dryRun: true }>> {
  if (!args.pair) return { success: false, error: "pair is required. Example: --pair=btc_jpy" };
  if (!args.orderIds)
    return { success: false, error: "order-ids is required. Example: --order-ids=1,2,3" };

  const ids = args.orderIds.split(",").map((s) => Number(s.trim()));
  if (ids.some(Number.isNaN))
    return { success: false, error: "order-ids must be comma-separated numbers" };
  if (ids.length > MAX_ORDER_IDS) {
    return {
      success: false,
      error: `order-ids must be at most ${MAX_ORDER_IDS} items (got ${ids.length})`,
    };
  }

  const body = { pair: args.pair, order_ids: ids };

  if (!args.execute) {
    printDryRun({
      endpoint: "/v1/user/spot/cancel_orders",
      body,
      executeHint: `npx bitbank cancel-orders --pair=${args.pair} --order-ids=${args.orderIds} --execute`,
    });
    return { success: true, data: { dryRun: true } };
  }

  const result = await privatePost<unknown>("/user/spot/cancel_orders", body, opts);
  return parseResponse(result, CancelOrdersResponseSchema);
}

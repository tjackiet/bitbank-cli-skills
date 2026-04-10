import { z } from "zod";
import { type PrivatePostOptions, privatePost } from "../../http-private-post.js";
import type { Result } from "../../types.js";

const OrderSchema = z.object({
  order_id: z.number(),
  pair: z.string(),
  side: z.string(),
  type: z.string(),
  start_amount: z.string().nullable(),
  remaining_amount: z.string().nullable(),
  executed_amount: z.string(),
  price: z.string().nullable(),
  post_only: z.boolean().optional(),
  average_price: z.string(),
  ordered_at: z.number(),
  expire_at: z.number().nullable(),
  status: z.string(),
});

const OrdersInfoResponseSchema = z.object({
  orders: z.array(OrderSchema),
});

export type OrderInfo = z.infer<typeof OrderSchema>;

export async function ordersInfo(
  args: { pair: string | undefined; orderIds: string | undefined },
  opts?: PrivatePostOptions,
): Promise<Result<OrderInfo[]>> {
  const { pair, orderIds } = args;
  if (!pair) {
    return { success: false, error: "pair is required. Example: --pair=btc_jpy" };
  }
  if (!orderIds) {
    return { success: false, error: "order-ids is required. Example: --order-ids=123,456" };
  }
  const ids = orderIds.split(",").map(Number);
  const body = { pair, order_ids: ids };
  const result = await privatePost<unknown>("/user/spot/orders_info", body, opts);
  if (!result.success) return result;

  const parsed = OrdersInfoResponseSchema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  return { success: true, data: parsed.data.orders };
}

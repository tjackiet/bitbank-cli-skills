import { z } from "zod";
import { type PrivatePostOptions, privatePost } from "../../http-private-post.js";
import type { Result } from "../../types.js";
import { OrderSchema } from "../shared-schemas.js";

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

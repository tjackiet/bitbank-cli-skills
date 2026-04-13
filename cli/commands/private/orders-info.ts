import { z } from "zod";
import { type PrivatePostOptions, privatePost } from "../../http-private-post.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { MSG_ORDER_IDS_INFO, MSG_PAIR } from "../../validators.js";
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
    return { success: false, error: MSG_PAIR };
  }
  if (!orderIds) {
    return { success: false, error: MSG_ORDER_IDS_INFO };
  }
  const ids = orderIds.split(",").map(Number);
  const body = { pair, order_ids: ids };
  const result = await privatePost<unknown>("/user/spot/orders_info", body, opts);
  return parseResponse(result, OrdersInfoResponseSchema, "orders");
}

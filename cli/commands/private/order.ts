import type { z } from "zod";
import { type PrivateHttpOptions, privateGet } from "../../http-private.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { MSG_ORDER_ID, MSG_PAIR } from "../../validators.js";
import { OrderSchema } from "../shared-schemas.js";

export type Order = z.infer<typeof OrderSchema>;

export async function order(
  args: { pair: string | undefined; orderId: string | undefined },
  opts?: PrivateHttpOptions,
): Promise<Result<Order>> {
  const { pair, orderId } = args;
  if (!pair) {
    return { success: false, error: MSG_PAIR };
  }
  if (!orderId) {
    return { success: false, error: MSG_ORDER_ID };
  }
  const params: Record<string, string> = { pair, order_id: orderId };
  const result = await privateGet<unknown>("/user/spot/order", params, opts);
  return parseResponse(result, OrderSchema);
}

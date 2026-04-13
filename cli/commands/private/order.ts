import type { z } from "zod";
import { type PrivateHttpOptions, privateGet } from "../../http-private.js";
import type { Result } from "../../types.js";
import { OrderSchema } from "../shared-schemas.js";

export type Order = z.infer<typeof OrderSchema>;

export async function order(
  args: { pair: string | undefined; orderId: string | undefined },
  opts?: PrivateHttpOptions,
): Promise<Result<Order>> {
  const { pair, orderId } = args;
  if (!pair) {
    return { success: false, error: "pair is required. Example: --pair=btc_jpy" };
  }
  if (!orderId) {
    return { success: false, error: "order-id is required. Example: --order-id=12345" };
  }
  const params: Record<string, string> = { pair, order_id: orderId };
  const result = await privateGet<unknown>("/user/spot/order", params, opts);
  if (!result.success) return result;

  const parsed = OrderSchema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  return { success: true, data: parsed.data };
}

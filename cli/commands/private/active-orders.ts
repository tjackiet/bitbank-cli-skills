import { z } from "zod";
import { type PrivateHttpOptions, privateGet } from "../../http-private.js";
import type { Result } from "../../types.js";
import { OrderSchema } from "../shared-schemas.js";

const ActiveOrdersResponseSchema = z.object({
  orders: z.array(OrderSchema),
});

export type ActiveOrder = z.infer<typeof OrderSchema>;

export async function activeOrders(
  args: { pair?: string; count?: string; since?: string; end?: string },
  opts?: PrivateHttpOptions,
): Promise<Result<ActiveOrder[]>> {
  const { pair, count, since, end } = args;
  const params: Record<string, string> = {};
  if (pair) params.pair = pair;
  if (count) params.count = count;
  if (since) params.since = since;
  if (end) params.end = end;

  const result = await privateGet<unknown>("/user/spot/active_orders", params, opts);
  if (!result.success) return result;

  const parsed = ActiveOrdersResponseSchema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  return { success: true, data: parsed.data.orders };
}

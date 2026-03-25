import { z } from "zod";
import { type PrivateHttpOptions, privateGet } from "../../http-private.js";
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

const ActiveOrdersResponseSchema = z.object({
  orders: z.array(OrderSchema),
});

export type ActiveOrder = z.infer<typeof OrderSchema>;

export async function activeOrders(
  pair: string | undefined,
  count: string | undefined,
  since: string | undefined,
  end: string | undefined,
  opts?: PrivateHttpOptions,
): Promise<Result<ActiveOrder[]>> {
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

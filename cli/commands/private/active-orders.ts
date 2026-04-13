import { z } from "zod";
import { type PrivateHttpOptions, privateGet } from "../../http-private.js";
import { compactParams } from "../../params.js";
import { parseResponse } from "../../parse-response.js";
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
  const params = compactParams({ pair, count, since, end });

  const result = await privateGet<unknown>("/user/spot/active_orders", params, opts);
  return parseResponse(result, ActiveOrdersResponseSchema, "orders");
}

import type { z } from "zod";
import { type PrivatePostOptions, privatePost } from "../../http-private-post.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { CancelOrderSchema } from "../shared-schemas.js";
import { printDryRun } from "./dry-run.js";

export type CancelOrderResponse = z.infer<typeof CancelOrderSchema>;

export type CancelOrderArgs = {
  pair?: string;
  orderId?: string;
  execute?: boolean;
};

export async function cancelOrder(
  args: CancelOrderArgs,
  opts?: PrivatePostOptions,
): Promise<Result<CancelOrderResponse | { dryRun: true }>> {
  if (!args.pair) return { success: false, error: "pair is required. Example: --pair=btc_jpy" };
  if (!args.orderId)
    return { success: false, error: "order-id is required. Example: --order-id=12345" };

  const body = { pair: args.pair, order_id: Number(args.orderId) };

  if (!args.execute) {
    printDryRun({
      endpoint: "/v1/user/spot/cancel_order",
      body,
      executeHint: `npx bitbank cancel-order --pair=${args.pair} --order-id=${args.orderId} --execute`,
    });
    return { success: true, data: { dryRun: true } };
  }

  const result = await privatePost<unknown>("/user/spot/cancel_order", body, opts);
  return parseResponse(result, CancelOrderSchema);
}

import { z } from "zod";
import { type PrivatePostOptions, privatePost } from "../../http-private-post.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { IntegerStringSchema, PairSchema } from "../../validators.js";
import { CancelOrderSchema } from "../shared-schemas.js";
import { dryRunResult } from "./dry-run.js";

const CancelOrderInputSchema = z.object({
  pair: PairSchema,
  orderId: IntegerStringSchema,
});

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
  const parsed = CancelOrderInputSchema.safeParse({ pair: args.pair, orderId: args.orderId });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: msg };
  }

  const body = { pair: parsed.data.pair, order_id: Number(parsed.data.orderId) };

  if (!args.execute) {
    return dryRunResult({
      command: "cancel-order",
      endpoint: "/v1/user/spot/cancel_order",
      body,
      args: { pair: parsed.data.pair, orderId: parsed.data.orderId },
    });
  }

  const result = await privatePost<unknown>("/user/spot/cancel_order", body, opts);
  return parseResponse(result, CancelOrderSchema);
}

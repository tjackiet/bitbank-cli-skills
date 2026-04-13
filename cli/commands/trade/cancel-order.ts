import { z } from "zod";
import { type PrivatePostOptions, privatePost } from "../../http-private-post.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { CancelOrderSchema } from "../shared-schemas.js";
import { printDryRun } from "./dry-run.js";

const CancelOrderInputSchema = z.object({
  pair: z
    .string({ required_error: "pair is required. Example: --pair=btc_jpy" })
    .trim()
    .min(1, "pair is required. Example: --pair=btc_jpy"),
  orderId: z
    .string({ required_error: "order-id is required. Example: --order-id=12345" })
    .trim()
    .min(1, "order-id is required. Example: --order-id=12345")
    .regex(/^\d+$/, "order-id must be an integer"),
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
    printDryRun({
      endpoint: "/v1/user/spot/cancel_order",
      body,
      executeHint: `npx bitbank cancel-order --pair=${parsed.data.pair} --order-id=${parsed.data.orderId} --execute`,
    });
    return { success: true, data: { dryRun: true } };
  }

  const result = await privatePost<unknown>("/user/spot/cancel_order", body, opts);
  return parseResponse(result, CancelOrderSchema);
}

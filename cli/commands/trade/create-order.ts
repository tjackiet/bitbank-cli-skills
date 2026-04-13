import { z } from "zod";
import { type PrivatePostOptions, privatePost } from "../../http-private-post.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { OrderSchema } from "../shared-schemas.js";
import { printDryRun } from "./dry-run.js";

const SideEnum = z.enum(["buy", "sell"]);
const TypeEnum = z.enum(["limit", "market", "stop", "stop_limit"]);

const CreateOrderInputSchema = z
  .object({
    pair: z.string({ required_error: "pair is required" }).min(1, "pair is required"),
    side: SideEnum,
    type: TypeEnum,
    price: z.string().optional(),
    amount: z.string().refine((v) => Number(v) > 0, "amount must be > 0"),
    triggerPrice: z.string().optional(),
    postOnly: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if ((val.type === "limit" || val.type === "stop_limit") && !val.price) {
      ctx.addIssue({ code: "custom", message: `price is required for type=${val.type}` });
    }
    if ((val.type === "stop" || val.type === "stop_limit") && !val.triggerPrice) {
      ctx.addIssue({ code: "custom", message: `trigger-price is required for type=${val.type}` });
    }
  });

export type OrderResponse = z.infer<typeof OrderSchema>;

export type CreateOrderArgs = {
  pair?: string;
  side?: string;
  type?: string;
  price?: string;
  amount?: string;
  triggerPrice?: string;
  postOnly?: boolean;
  execute?: boolean;
};

export async function createOrder(
  args: CreateOrderArgs,
  opts?: PrivatePostOptions,
): Promise<Result<OrderResponse | { dryRun: true }>> {
  const parsed = CreateOrderInputSchema.safeParse({
    pair: args.pair,
    side: args.side,
    type: args.type,
    price: args.price,
    amount: args.amount,
    triggerPrice: args.triggerPrice,
    postOnly: args.postOnly,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: msg };
  }

  const body: Record<string, unknown> = {
    pair: parsed.data.pair,
    side: parsed.data.side,
    type: parsed.data.type,
    amount: parsed.data.amount,
  };
  if (parsed.data.price) body.price = parsed.data.price;
  if (parsed.data.triggerPrice) body.trigger_price = parsed.data.triggerPrice;
  if (parsed.data.postOnly) body.post_only = true;

  if (!args.execute) {
    const hint = `npx bitbank create-order --pair=${parsed.data.pair} --side=${parsed.data.side} --type=${parsed.data.type}${parsed.data.price ? ` --price=${parsed.data.price}` : ""} --amount=${parsed.data.amount}${parsed.data.triggerPrice ? ` --trigger-price=${parsed.data.triggerPrice}` : ""}${parsed.data.postOnly ? " --post-only" : ""} --execute`;
    printDryRun({ endpoint: "/v1/user/spot/order", body, executeHint: hint });
    return { success: true, data: { dryRun: true } };
  }

  const result = await privatePost<unknown>("/user/spot/order", body, opts);
  return parseResponse(result, OrderSchema);
}

import { z } from "zod";
import { type PrivatePostOptions, privatePost } from "../../http-private-post.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { IntegerStringSchema } from "../../validators.js";
import { dryRunResult } from "./dry-run.js";

const ConfirmDepositsResponseSchema = z.object({
  uuid: z.string(),
  status: z.string(),
});

export type ConfirmDepositsResponse = z.infer<typeof ConfirmDepositsResponseSchema>;

const ConfirmDepositsInputSchema = z.object({
  id: IntegerStringSchema,
});

export type ConfirmDepositsArgs = {
  id?: string;
  execute?: boolean;
};

export async function confirmDeposits(
  args: ConfirmDepositsArgs,
  opts?: PrivatePostOptions,
): Promise<Result<ConfirmDepositsResponse | { dryRun: true }>> {
  const parsed = ConfirmDepositsInputSchema.safeParse({ id: args.id });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: msg };
  }

  const body = { id: parsed.data.id };

  if (!args.execute) {
    return dryRunResult({
      command: "confirm-deposits",
      endpoint: "/v1/user/confirm_deposits",
      body,
      args: { id: args.id },
    });
  }

  const result = await privatePost<unknown>("/user/confirm_deposits", body, opts);
  return parseResponse(result, ConfirmDepositsResponseSchema);
}

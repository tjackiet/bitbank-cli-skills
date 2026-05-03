import { z } from "zod";
import { type PrivatePostOptions, privatePost } from "../../http-private-post.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { MSG_ID } from "../../validators.js";
import { dryRunResult } from "./dry-run.js";

const ConfirmDepositsResponseSchema = z.object({
  uuid: z.string(),
  status: z.string(),
});

export type ConfirmDepositsResponse = z.infer<typeof ConfirmDepositsResponseSchema>;

export type ConfirmDepositsArgs = {
  id?: string;
  execute?: boolean;
};

export async function confirmDeposits(
  args: ConfirmDepositsArgs,
  opts?: PrivatePostOptions,
): Promise<Result<ConfirmDepositsResponse | { dryRun: true }>> {
  if (!args.id) return { success: false, error: MSG_ID };

  const body = { id: args.id };

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

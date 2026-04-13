import { z } from "zod";
import { type PrivatePostOptions, privatePost } from "../../http-private-post.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { printDryRun } from "./dry-run.js";

const ConfirmDepositsAllResponseSchema = z.object({
  status: z.string(),
});

export type ConfirmDepositsAllResponse = z.infer<typeof ConfirmDepositsAllResponseSchema>;

export type ConfirmDepositsAllArgs = {
  execute?: boolean;
};

export async function confirmDepositsAll(
  args: ConfirmDepositsAllArgs,
  opts?: PrivatePostOptions,
): Promise<Result<ConfirmDepositsAllResponse | { dryRun: true }>> {
  if (!args.execute) {
    printDryRun({
      endpoint: "/v1/user/confirm_deposits_all",
      body: {},
      executeHint: "npx bitbank confirm-deposits-all --execute",
    });
    return { success: true, data: { dryRun: true } };
  }

  const result = await privatePost<unknown>("/user/confirm_deposits_all", undefined, opts);
  return parseResponse(result, ConfirmDepositsAllResponseSchema);
}

import { z } from "zod";
import { type PrivatePostOptions, privatePost } from "../../http-private-post.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { dryRunResult } from "./dry-run.js";

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
    return dryRunResult({
      command: "confirm-deposits-all",
      endpoint: "/v1/user/confirm_deposits_all",
      body: {},
      args: {},
    });
  }

  const result = await privatePost<unknown>("/user/confirm_deposits_all", undefined, opts);
  return parseResponse(result, ConfirmDepositsAllResponseSchema);
}

import { z } from "zod";
import { type PrivatePostOptions, privatePost } from "../../http-private-post.js";
import type { Result } from "../../types.js";
import { printDryRun } from "./dry-run.js";

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
  if (!args.id) return { success: false, error: "id is required. Example: --id=12345" };

  const body = { id: args.id };

  if (!args.execute) {
    printDryRun({
      endpoint: "/v1/user/confirm_deposits",
      body,
      executeHint: `npx bitbank confirm-deposits --id=${args.id} --execute`,
    });
    return { success: true, data: { dryRun: true } };
  }

  const result = await privatePost<unknown>("/user/confirm_deposits", body, opts);
  if (!result.success) return result;

  const r = ConfirmDepositsResponseSchema.safeParse(result.data);
  if (!r.success) return { success: false, error: `Invalid response: ${r.error.message}` };
  return { success: true, data: r.data };
}

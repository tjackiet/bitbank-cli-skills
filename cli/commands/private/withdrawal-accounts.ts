import { z } from "zod";
import { type PrivateHttpOptions, privateGet } from "../../http-private.js";
import type { Result } from "../../types.js";

const AccountSchema = z.object({
  uuid: z.string(),
  label: z.string(),
  address: z.string(),
});

const ResponseSchema = z.object({
  accounts: z.array(AccountSchema),
});

export type WithdrawalAccount = z.infer<typeof AccountSchema>;

export async function withdrawalAccounts(
  args: { asset: string | undefined },
  opts?: PrivateHttpOptions,
): Promise<Result<WithdrawalAccount[]>> {
  const { asset } = args;
  if (!asset) {
    return { success: false, error: "asset is required. Example: --asset=btc" };
  }
  const params: Record<string, string> = { asset };

  const result = await privateGet<unknown>("/user/withdrawal_account", params, opts);
  if (!result.success) return result;

  const parsed = ResponseSchema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  return { success: true, data: parsed.data.accounts };
}

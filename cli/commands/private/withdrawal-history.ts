import { z } from "zod";
import { type PrivateHttpOptions, privateGet } from "../../http-private.js";
import type { Result } from "../../types.js";

const WithdrawalSchema = z.object({
  uuid: z.string(),
  asset: z.string(),
  amount: z.string(),
  fee: z.string(),
  label: z.string().nullable(),
  address: z.string(),
  txid: z.string().nullable(),
  status: z.string(),
  requested_at: z.number(),
});

const ResponseSchema = z.object({
  withdrawals: z.array(WithdrawalSchema),
});

export type Withdrawal = z.infer<typeof WithdrawalSchema>;

export async function withdrawalHistory(
  args: { asset: string | undefined; count?: string; since?: string; end?: string },
  opts?: PrivateHttpOptions,
): Promise<Result<Withdrawal[]>> {
  const { asset, count, since, end } = args;
  if (!asset) {
    return { success: false, error: "asset is required. Example: --asset=btc" };
  }
  const params: Record<string, string> = { asset };
  if (count) params.count = count;
  if (since) params.since = since;
  if (end) params.end = end;

  const result = await privateGet<unknown>("/user/withdrawal_history", params, opts);
  if (!result.success) return result;

  const parsed = ResponseSchema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  return { success: true, data: parsed.data.withdrawals };
}

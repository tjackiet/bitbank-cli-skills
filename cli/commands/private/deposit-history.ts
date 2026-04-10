import { z } from "zod";
import { type PrivateHttpOptions, privateGet } from "../../http-private.js";
import type { Result } from "../../types.js";

const DepositSchema = z.object({
  uuid: z.string(),
  asset: z.string(),
  amount: z.string(),
  txid: z.string().nullable(),
  status: z.string(),
  found_at: z.number(),
  confirmed_at: z.number().nullable(),
});

const DepositHistoryResponseSchema = z.object({
  deposits: z.array(DepositSchema),
});

export type Deposit = z.infer<typeof DepositSchema>;

export async function depositHistory(
  args: { asset?: string; count?: string; since?: string; end?: string },
  opts?: PrivateHttpOptions,
): Promise<Result<Deposit[]>> {
  const { asset, count, since, end } = args;
  const params: Record<string, string> = {};
  if (asset) params.asset = asset;
  if (count) params.count = count;
  if (since) params.since = since;
  if (end) params.end = end;

  const result = await privateGet<unknown>("/user/deposit_history", params, opts);
  if (!result.success) return result;

  const parsed = DepositHistoryResponseSchema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  return { success: true, data: parsed.data.deposits };
}

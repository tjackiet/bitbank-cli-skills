import { z } from "zod";
import { type PrivateHttpOptions, privateGet } from "../../http-private.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";

const UnconfirmedDepositSchema = z.object({
  uuid: z.string(),
  asset: z.string(),
  amount: z.string(),
  txid: z.string().nullable(),
  found_at: z.number(),
});

const ResponseSchema = z.object({
  deposits: z.array(UnconfirmedDepositSchema),
});

export type UnconfirmedDeposit = z.infer<typeof UnconfirmedDepositSchema>;

export async function unconfirmedDeposits(
  args: { asset?: string },
  opts?: PrivateHttpOptions,
): Promise<Result<UnconfirmedDeposit[]>> {
  const { asset } = args;
  const params: Record<string, string> = {};
  if (asset) params.asset = asset;

  const result = await privateGet<unknown>("/user/unconfirmed_deposits", params, opts);
  return parseResponse(result, ResponseSchema, "deposits");
}

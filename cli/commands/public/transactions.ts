import { z } from "zod";
import { type HttpOptions, publicGet } from "../../http.js";
import { numStr } from "../../schema-helpers.js";
import type { Result } from "../../types.js";

const TransactionSchema = z.object({
  transaction_id: z.number(),
  side: z.string(),
  price: numStr,
  amount: numStr,
  executed_at: z.number(),
});

const TransactionsSchema = z.object({
  transactions: z.array(TransactionSchema),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export async function transactions(
  args: { pair: string | undefined; date?: string },
  opts?: HttpOptions,
): Promise<Result<Transaction[]>> {
  const { pair, date } = args;
  if (!pair) {
    return { success: false, error: "pair is required. Example: npx bitbank transactions btc_jpy" };
  }
  const datePath = date ? `/${date}` : "";
  const result = await publicGet<unknown>(`/${pair}/transactions${datePath}`, opts);
  if (!result.success) return result;

  const parsed = TransactionsSchema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  return { success: true, data: parsed.data.transactions };
}

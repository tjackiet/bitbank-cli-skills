import { z } from "zod";
import { publicGet, type HttpOptions } from "../../http.js";
import { type Result } from "../../types.js";

const TransactionSchema = z.object({
  transaction_id: z.number(),
  side: z.string(),
  price: z.string().transform(Number),
  amount: z.string().transform(Number),
  executed_at: z.number(),
});

const TransactionsSchema = z.object({
  transactions: z.array(TransactionSchema),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export async function transactions(
  pair: string | undefined,
  date?: string,
  opts?: HttpOptions,
): Promise<Result<Transaction[]>> {
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

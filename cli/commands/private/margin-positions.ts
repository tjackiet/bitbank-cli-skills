import { z } from "zod";
import { privateGet, type PrivateHttpOptions } from "../../http-private.js";
import { type Result } from "../../types.js";

const PositionSchema = z.object({
  position_id: z.number(),
  pair: z.string(),
  side: z.string(),
  amount: z.string(),
  price: z.string(),
  open_pnl: z.string(),
  close_pnl: z.string(),
  margin_used: z.string(),
  opened_at: z.number(),
});

const ResponseSchema = z.object({
  positions: z.array(PositionSchema),
});

export type MarginPosition = z.infer<typeof PositionSchema>;

export async function marginPositions(
  pair: string | undefined,
  opts?: PrivateHttpOptions,
): Promise<Result<MarginPosition[]>> {
  const params: Record<string, string> = {};
  if (pair) params.pair = pair;

  const result = await privateGet<unknown>("/user/margin/positions", params, opts);
  if (!result.success) return result;

  const parsed = ResponseSchema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  return { success: true, data: parsed.data.positions };
}

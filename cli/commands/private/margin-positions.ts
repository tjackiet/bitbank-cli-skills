import { z } from "zod";
import { type PrivateHttpOptions, privateGet } from "../../http-private.js";
import { compactParams } from "../../params.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";

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
  args: { pair?: string },
  opts?: PrivateHttpOptions,
): Promise<Result<MarginPosition[]>> {
  const { pair } = args;
  const params = compactParams({ pair });

  const result = await privateGet<unknown>("/user/margin/positions", params, opts);
  return parseResponse(result, ResponseSchema, "positions");
}

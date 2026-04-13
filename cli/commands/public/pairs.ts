import { z } from "zod";
import { type HttpOptions, publicGet } from "../../http.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";

const PairSchema = z.object({
  name: z.string(),
  base_asset: z.string(),
  quote_asset: z.string(),
  maker_fee_rate_base_quote: z.string(),
  taker_fee_rate_base_quote: z.string(),
  unit_amount: z.string(),
  limit_max_amount: z.string(),
  market_max_amount: z.string(),
  is_enabled: z.boolean(),
  stop_order: z.boolean(),
  stop_order_and_cancel: z.boolean(),
});

const PairsSchema = z.object({
  pairs: z.array(PairSchema),
});

export type Pair = z.infer<typeof PairSchema>;

export async function pairs(opts?: HttpOptions): Promise<Result<Pair[]>> {
  const result = await publicGet<unknown>("/v1/spot/pairs", opts);
  return parseResponse(result, PairsSchema, "pairs");
}

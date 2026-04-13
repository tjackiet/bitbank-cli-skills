import { z } from "zod";
import { type HttpOptions, publicGet } from "../../http.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";

const CircuitBreakSchema = z.object({
  mode: z.string(),
  estimated_itayose_price: z.string().nullable().optional(),
  estimated_itayose_amount: z.string().nullable().optional(),
  itayose_upper_price: z.string().nullable().optional(),
  itayose_lower_price: z.string().nullable().optional(),
  upper_trigger_price: z.string().nullable().optional(),
  lower_trigger_price: z.string().nullable().optional(),
  fee_type: z.string(),
  timestamp: z.number(),
});

export type CircuitBreak = z.infer<typeof CircuitBreakSchema>;

export async function circuitBreak(
  args: { pair: string | undefined },
  opts?: HttpOptions,
): Promise<Result<CircuitBreak>> {
  const { pair } = args;
  if (!pair) {
    return {
      success: false,
      error: "pair is required. Example: npx bitbank circuit-break btc_jpy",
    };
  }
  const result = await publicGet<unknown>(`/${pair}/circuit_break_info`, opts);
  return parseResponse(result, CircuitBreakSchema);
}

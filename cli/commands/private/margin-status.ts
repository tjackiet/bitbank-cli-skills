import { z } from "zod";
import { type PrivateHttpOptions, privateGet } from "../../http-private.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";

const MarginStatusSchema = z.object({
  margin_rate: z.string().nullable(),
  todays_pnl: z.string().nullable(),
  open_pnl: z.string().nullable(),
  force_close_rate: z.string().nullable(),
  total_assets_jpy: z.string().nullable(),
  margin_used: z.string().nullable(),
  margin_available: z.string().nullable(),
});

export type MarginStatus = z.infer<typeof MarginStatusSchema>;

export async function marginStatus(opts?: PrivateHttpOptions): Promise<Result<MarginStatus>> {
  const result = await privateGet<unknown>("/user/margin/status", undefined, opts);
  return parseResponse(result, MarginStatusSchema);
}

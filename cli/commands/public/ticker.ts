import type { z } from "zod";
import { type HttpOptions, publicGet } from "../../http.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { MSG_PAIR_TICKER, validatePair } from "../../validators.js";
import { TickerSchema } from "../shared-schemas.js";

export type Ticker = z.infer<typeof TickerSchema>;

export async function ticker(
  args: { pair: string | undefined },
  opts?: HttpOptions,
): Promise<Result<Ticker>> {
  const v = validatePair(args.pair, MSG_PAIR_TICKER);
  if (!v.success) return v;
  const result = await publicGet<unknown>(`/${v.data}/ticker`, opts);
  return parseResponse(result, TickerSchema);
}

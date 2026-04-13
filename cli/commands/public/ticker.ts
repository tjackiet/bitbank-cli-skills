import type { z } from "zod";
import { type HttpOptions, publicGet } from "../../http.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { MSG_PAIR_TICKER } from "../../validators.js";
import { TickerSchema } from "../shared-schemas.js";

export type Ticker = z.infer<typeof TickerSchema>;

export async function ticker(
  args: { pair: string | undefined },
  opts?: HttpOptions,
): Promise<Result<Ticker>> {
  const { pair } = args;
  if (!pair) {
    return { success: false, error: MSG_PAIR_TICKER };
  }
  const result = await publicGet<unknown>(`/${pair}/ticker`, opts);
  return parseResponse(result, TickerSchema);
}

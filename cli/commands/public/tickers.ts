import { z } from "zod";
import { type HttpOptions, publicGet } from "../../http.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { TickerWithPairSchema } from "../shared-schemas.js";

const TickersSchema = z.array(TickerWithPairSchema);
export type TickerItem = z.infer<typeof TickerWithPairSchema>;

export async function tickers(opts?: HttpOptions): Promise<Result<TickerItem[]>> {
  const result = await publicGet<unknown>("/tickers", opts);
  return parseResponse(result, TickersSchema);
}

export async function tickersJpy(opts?: HttpOptions): Promise<Result<TickerItem[]>> {
  const result = await publicGet<unknown>("/tickers_jpy", opts);
  return parseResponse(result, TickersSchema);
}

import { z } from "zod";
import { type HttpOptions, publicGet } from "../../http.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { MSG_PAIR_DEPTH } from "../../validators.js";

const DepthSchema = z.object({
  asks: z.array(z.tuple([z.string(), z.string()])),
  bids: z.array(z.tuple([z.string(), z.string()])),
  timestamp: z.number(),
});

export type Depth = z.infer<typeof DepthSchema>;

export async function depth(
  args: { pair: string | undefined },
  opts?: HttpOptions,
): Promise<Result<Depth>> {
  const { pair } = args;
  if (!pair) {
    return { success: false, error: MSG_PAIR_DEPTH };
  }
  const result = await publicGet<unknown>(`/${pair}/depth`, opts);
  return parseResponse(result, DepthSchema);
}

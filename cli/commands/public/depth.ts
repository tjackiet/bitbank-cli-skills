import { z } from "zod";
import { publicGet, type HttpOptions } from "../../http.js";
import { type Result } from "../../types.js";

const DepthSchema = z.object({
  asks: z.array(z.tuple([z.string(), z.string()])),
  bids: z.array(z.tuple([z.string(), z.string()])),
  timestamp: z.number(),
});

export type Depth = z.infer<typeof DepthSchema>;

export async function depth(
  pair: string | undefined,
  opts?: HttpOptions,
): Promise<Result<Depth>> {
  if (!pair) {
    return { success: false, error: "pair is required. Example: npx bitbank depth btc_jpy" };
  }
  const result = await publicGet<unknown>(`/${pair}/depth`, opts);
  if (!result.success) return result;

  const parsed = DepthSchema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  return { success: true, data: parsed.data };
}

import { z } from "zod";
import { publicGet, type HttpOptions } from "../../http.js";
import { type Result } from "../../types.js";

const StatusItemSchema = z.object({
  pair: z.string(),
  status: z.string(),
  min_amount: z.string().optional(),
});

const StatusSchema = z.object({
  statuses: z.array(StatusItemSchema),
});

export type StatusItem = z.infer<typeof StatusItemSchema>;

export async function status(opts?: HttpOptions): Promise<Result<StatusItem[]>> {
  const result = await publicGet<unknown>("/v1/spot/status", opts);
  if (!result.success) return result;

  const parsed = StatusSchema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  return { success: true, data: parsed.data.statuses };
}

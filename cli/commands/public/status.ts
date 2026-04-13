import { z } from "zod";
import { type HttpOptions, publicGet } from "../../http.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";

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
  return parseResponse(result, StatusSchema, "statuses");
}

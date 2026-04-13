import { z } from "zod";
import type { ExitCode } from "./exit-codes.js";

const RateLimitSchema = z.object({
  remaining: z.number(),
  limit: z.number(),
  reset: z.number(),
});

export type RateLimitInfo = z.infer<typeof RateLimitSchema>;

export type ResultMeta = { rateLimit?: RateLimitInfo };

export type Result<T> =
  | { success: true; data: T; partial?: boolean; meta?: ResultMeta }
  | { success: false; error: string; exitCode?: ExitCode };

export type Format = "json" | "table" | "csv";

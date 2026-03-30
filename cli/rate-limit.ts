import type { RateLimitInfo } from "./types.js";

/**
 * Extract rate limit info from response headers.
 * Returns undefined if headers are not present.
 */
export function extractRateLimit(headers: Headers): RateLimitInfo | undefined {
  const remaining = headers.get("X-RateLimit-Remaining");
  const limit = headers.get("X-RateLimit-Limit");
  const reset = headers.get("X-RateLimit-Reset");

  if (remaining === null && limit === null && reset === null) return undefined;

  return {
    remaining: remaining !== null ? Number(remaining) : -1,
    limit: limit !== null ? Number(limit) : -1,
    reset: reset !== null ? Number(reset) : 0,
  };
}

import { describe, expect, it } from "vitest";
import { publicGet } from "../http.js";

describe("rate limit meta in Result", () => {
  it("includes meta.rateLimit when headers are present", async () => {
    const fetch: typeof globalThis.fetch = async () =>
      new Response(JSON.stringify({ success: 1, data: { ok: true } }), {
        headers: {
          "X-RateLimit-Remaining": "42",
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Reset": "1700000000",
        },
      });
    const result = await publicGet("/test", { fetch, retries: 0 });
    expect(result).toEqual({
      success: true,
      data: { ok: true },
      meta: { rateLimit: { remaining: 42, limit: 100, reset: 1700000000 } },
    });
  });

  it("omits meta when no rate limit headers", async () => {
    const fetch: typeof globalThis.fetch = async () =>
      new Response(JSON.stringify({ success: 1, data: { ok: true } }));
    const result = await publicGet("/test", { fetch, retries: 0 });
    expect(result).toEqual({ success: true, data: { ok: true } });
    expect(result.success && "meta" in result).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { publicGet } from "../http.js";

function mockFetch(body: unknown, status = 200): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify(body), { status });
}

describe("publicGet", () => {
  it("returns data on success", async () => {
    const fetch = mockFetch({ success: 1, data: { sell: "100" } });
    const result = await publicGet("/btc_jpy/ticker", { fetch, retries: 0 });
    expect(result).toEqual({ success: true, data: { sell: "100" } });
  });

  it("returns error on API failure", async () => {
    const fetch = mockFetch({ success: 0, data: { code: 10000 } });
    const result = await publicGet("/bad", { fetch, retries: 0 });
    expect(result).toEqual({ success: false, error: "10000" });
  });

  it("returns error on HTTP failure after retries", async () => {
    const fetch = mockFetch({}, 500);
    const result = await publicGet("/bad", { fetch, retries: 0 });
    expect(result.success).toBe(false);
  });

  it("returns error on network failure", async () => {
    const fetch = async () => { throw new Error("network error"); };
    const result = await publicGet("/x", { fetch: fetch as typeof globalThis.fetch, retries: 0 });
    expect(result).toEqual({ success: false, error: "network error" });
  });
});

import { describe, expect, it } from "vitest";
import { publicGet } from "../http.js";
import { mockFetchRaw } from "./test-helpers.js";

describe("publicGet", () => {
  it("returns data on success", async () => {
    const fetch = mockFetchRaw({ success: 1, data: { sell: "100" } });
    const result = await publicGet("/btc_jpy/ticker", { fetch, retries: 0 });
    expect(result).toEqual({ success: true, data: { sell: "100" } });
  });

  it("returns error on API failure", async () => {
    const fetch = mockFetchRaw({ success: 0, data: { code: 10000 } });
    const result = await publicGet("/bad", { fetch, retries: 0 });
    expect(result).toEqual({ success: false, error: "10000" });
  });

  it("returns error on HTTP failure after retries", async () => {
    const fetch = mockFetchRaw({}, 500);
    const result = await publicGet("/bad", { fetch, retries: 0 });
    expect(result.success).toBe(false);
  });

  it("retries on API error code 60001", async () => {
    let calls = 0;
    const fetch = async () => {
      calls++;
      if (calls === 1) {
        return new Response(JSON.stringify({ success: 0, data: { code: 60001 } }));
      }
      return new Response(JSON.stringify({ success: 1, data: { ok: true } }));
    };
    const result = await publicGet("/test", {
      fetch: fetch as typeof globalThis.fetch,
      retries: 1,
    });
    expect(result).toEqual({ success: true, data: { ok: true } });
    expect(calls).toBe(2);
  });

  it("returns error on network failure", async () => {
    const fetch = async () => {
      throw new Error("network error");
    };
    const result = await publicGet("/x", { fetch: fetch as typeof globalThis.fetch, retries: 0 });
    expect(result).toEqual({ success: false, error: "network error" });
  });
});

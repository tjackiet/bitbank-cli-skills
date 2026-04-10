import { describe, expect, it } from "vitest";
import { ticker } from "../../../commands/public/ticker.js";
import { mockFetchRaw } from "../../test-helpers.js";

describe("Chaos P-05: API returns HTTP 503", () => {
  it("returns { success: false } with error message", async () => {
    const r = await ticker(
      { pair: "btc_jpy" },
      {
        fetch: mockFetchRaw({ success: 0, data: { code: 70001 } }, 503),
        retries: 0,
      },
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toBeTruthy();
  });

  it("HTTP 500 also returns error", async () => {
    const r = await ticker(
      { pair: "btc_jpy" },
      {
        fetch: mockFetchRaw({}, 500),
        retries: 0,
      },
    );
    expect(r.success).toBe(false);
  });
});

describe("Chaos P-06: API timeout", () => {
  it("returns error and does not hang", async () => {
    const slowFetch: typeof globalThis.fetch = async (_url, init) =>
      new Promise((_resolve, reject) => {
        const t = setTimeout(() => _resolve(new Response("{}")), 60_000);
        init?.signal?.addEventListener("abort", () => {
          clearTimeout(t);
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    const r = await ticker(
      { pair: "btc_jpy" },
      {
        fetch: slowFetch,
        retries: 0,
        timeoutMs: 100,
      },
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toBeTruthy();
  }, 5_000);
});

describe("Chaos P-07: API returns invalid JSON", () => {
  it("returns error for malformed JSON body", async () => {
    const badFetch: typeof globalThis.fetch = async () =>
      new Response("not-json{{{", { status: 200 });
    const r = await ticker(
      { pair: "btc_jpy" },
      {
        fetch: badFetch,
        retries: 0,
      },
    );
    expect(r.success).toBe(false);
  });

  it("returns error for valid JSON but wrong schema", async () => {
    const r = await ticker(
      { pair: "btc_jpy" },
      {
        fetch: async () => new Response(JSON.stringify({ success: 1, data: "string-not-object" })),
        retries: 0,
      },
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("Invalid response");
  });
});

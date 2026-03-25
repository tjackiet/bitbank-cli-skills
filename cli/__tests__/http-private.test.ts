import { describe, it, expect } from "vitest";
import { privateGet } from "../http-private.js";

const CREDS = { apiKey: "testkey", apiSecret: "testsecret" };

function mockFetch(body: unknown, status = 200): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify(body), { status });
}

describe("privateGet", () => {
  it("returns data on success", async () => {
    const fetch = mockFetch({ success: 1, data: { assets: [] } });
    const result = await privateGet("/user/assets", undefined, {
      fetch, retries: 0, credentials: CREDS, nonce: "123",
    });
    expect(result).toEqual({ success: true, data: { assets: [] } });
  });

  it("returns formatted error on API failure", async () => {
    const fetch = mockFetch({ success: 0, data: { code: 20001 } });
    const result = await privateGet("/user/assets", undefined, {
      fetch, retries: 0, credentials: CREDS, nonce: "123",
    });
    expect(result).toEqual({ success: false, error: "20001: API認証失敗" });
  });

  it("returns error on permission failure", async () => {
    const fetch = mockFetch({ success: 0, data: { code: 20003 } });
    const result = await privateGet("/user/assets", undefined, {
      fetch, retries: 0, credentials: CREDS, nonce: "123",
    });
    expect(result).toEqual({ success: false, error: "20003: APIキー権限不足" });
  });

  it("returns error on rate limit", async () => {
    const fetch = mockFetch({ success: 0, data: { code: 60001 } });
    const result = await privateGet("/user/assets", undefined, {
      fetch, retries: 0, credentials: CREDS, nonce: "123",
    });
    expect(result).toEqual({ success: false, error: "60001: レート制限" });
  });

  it("returns error on HTTP failure", async () => {
    const fetch = mockFetch({}, 500);
    const result = await privateGet("/user/assets", undefined, {
      fetch, retries: 0, credentials: CREDS, nonce: "123",
    });
    expect(result.success).toBe(false);
  });

  it("returns error on network failure", async () => {
    const fetch = async () => { throw new Error("network error"); };
    const result = await privateGet("/user/assets", undefined, {
      fetch: fetch as typeof globalThis.fetch, retries: 0, credentials: CREDS, nonce: "123",
    });
    expect(result).toEqual({ success: false, error: "network error" });
  });

  it("returns error when credentials are missing", async () => {
    const origKey = process.env.BITBANK_API_KEY;
    const origSecret = process.env.BITBANK_API_SECRET;
    delete process.env.BITBANK_API_KEY;
    delete process.env.BITBANK_API_SECRET;
    const fetch = mockFetch({ success: 1, data: {} });
    const result = await privateGet("/user/assets", undefined, { fetch, retries: 0 });
    expect(result.success).toBe(false);
    if (origKey) process.env.BITBANK_API_KEY = origKey;
    if (origSecret) process.env.BITBANK_API_SECRET = origSecret;
  });

  it("sends query params in URL", async () => {
    let capturedUrl = "";
    const fetch: typeof globalThis.fetch = async (input) => {
      capturedUrl = input.toString();
      return new Response(JSON.stringify({ success: 1, data: {} }));
    };
    await privateGet("/user/spot/order", { pair: "btc_jpy", order_id: "123" }, {
      fetch, retries: 0, credentials: CREDS, nonce: "123",
    });
    expect(capturedUrl).toContain("pair=btc_jpy");
    expect(capturedUrl).toContain("order_id=123");
  });
});

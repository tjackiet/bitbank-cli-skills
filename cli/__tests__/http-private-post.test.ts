import { describe, it, expect } from "vitest";
import { privatePost } from "../http-private-post.js";

const CREDS = { apiKey: "testkey", apiSecret: "testsecret" };

function mockFetch(body: unknown, status = 200): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify(body), { status });
}

describe("privatePost", () => {
  it("returns data on success", async () => {
    const fetch = mockFetch({ success: 1, data: { orders: [] } });
    const result = await privatePost("/user/spot/orders_info", { pair: "btc_jpy" }, {
      fetch, retries: 0, credentials: CREDS, nonce: "123",
    });
    expect(result).toEqual({ success: true, data: { orders: [] } });
  });

  it("sends POST method with JSON body", async () => {
    let capturedMethod = "";
    let capturedBody = "";
    const fetch: typeof globalThis.fetch = async (_input, init) => {
      capturedMethod = init?.method ?? "";
      capturedBody = init?.body as string ?? "";
      return new Response(JSON.stringify({ success: 1, data: {} }));
    };
    await privatePost("/user/spot/orders_info", { pair: "btc_jpy", order_ids: [1] }, {
      fetch, retries: 0, credentials: CREDS, nonce: "123",
    });
    expect(capturedMethod).toBe("POST");
    expect(JSON.parse(capturedBody)).toEqual({ pair: "btc_jpy", order_ids: [1] });
  });

  it("returns formatted error on API failure", async () => {
    const fetch = mockFetch({ success: 0, data: { code: 20001 } });
    const result = await privatePost("/test", {}, {
      fetch, retries: 0, credentials: CREDS, nonce: "123",
    });
    expect(result).toEqual({ success: false, error: "20001: API認証失敗" });
  });
});

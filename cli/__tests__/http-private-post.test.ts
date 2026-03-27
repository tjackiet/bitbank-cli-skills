import { describe, expect, it } from "vitest";
import { privatePost } from "../http-private-post.js";
import { TEST_CREDS, mockFetchRaw } from "./test-helpers.js";

describe("privatePost", () => {
  it("returns data on success", async () => {
    const fetch = mockFetchRaw({ success: 1, data: { orders: [] } });
    const result = await privatePost(
      "/user/spot/orders_info",
      { pair: "btc_jpy" },
      {
        fetch,
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "123",
      },
    );
    expect(result).toEqual({ success: true, data: { orders: [] } });
  });

  it("sends POST method with JSON body", async () => {
    let capturedMethod = "";
    let capturedBody = "";
    const fetch: typeof globalThis.fetch = async (_input, init) => {
      capturedMethod = init?.method ?? "";
      capturedBody = (init?.body as string) ?? "";
      return new Response(JSON.stringify({ success: 1, data: {} }));
    };
    await privatePost(
      "/user/spot/orders_info",
      { pair: "btc_jpy", order_ids: [1] },
      {
        fetch,
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "123",
      },
    );
    expect(capturedMethod).toBe("POST");
    expect(JSON.parse(capturedBody)).toEqual({ pair: "btc_jpy", order_ids: [1] });
  });

  it("returns formatted error on API failure", async () => {
    const fetch = mockFetchRaw({ success: 0, data: { code: 20001 } });
    const result = await privatePost(
      "/test",
      {},
      {
        fetch,
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "123",
      },
    );
    expect(result).toEqual({ success: false, error: "20001: API認証失敗" });
  });
});

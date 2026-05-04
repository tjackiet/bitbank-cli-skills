import { describe, expect, it } from "vitest";
import { order } from "../../commands/private/order.js";
import { TEST_CREDS, mockFetchData, mockFetchRaw } from "../test-helpers.js";

const MOCK_ORDER = {
  order_id: 12345,
  pair: "btc_jpy",
  side: "buy",
  type: "limit",
  start_amount: "0.001",
  remaining_amount: "0.001",
  executed_amount: "0",
  price: "15000000",
  average_price: "0",
  ordered_at: 1234567890123,
  expire_at: null,
  status: "UNFILLED",
};

describe("order", () => {
  it("returns error when pair is missing", async () => {
    const result = await order({ pair: undefined, orderId: "123" });
    expect(result.success).toBe(false);
  });

  it("returns error when order-id is missing", async () => {
    const result = await order({ pair: "btc_jpy", orderId: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects malformed pair before fetching", async () => {
    const failFetch = (() => {
      throw new Error("fetch should not be called");
    }) as unknown as typeof fetch;
    const result = await order(
      { pair: "BTC_JPY", orderId: "12345" },
      { fetch: failFetch, retries: 0, credentials: TEST_CREDS, nonce: "1" },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("pair must be like btc_jpy");
  });

  it("returns parsed order data", async () => {
    const result = await order(
      { pair: "btc_jpy", orderId: "12345" },
      {
        fetch: mockFetchData(MOCK_ORDER),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
      },
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order_id).toBe(12345);
      expect(result.data.pair).toBe("btc_jpy");
    }
  });

  it("propagates API error", async () => {
    const result = await order(
      { pair: "btc_jpy", orderId: "12345" },
      {
        fetch: mockFetchRaw({ success: 0, data: { code: 70001 } }),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
      },
    );
    expect(result.success).toBe(false);
  });

  it("returns error on invalid response shape", async () => {
    const result = await order(
      { pair: "btc_jpy", orderId: "12345" },
      {
        fetch: mockFetchData("invalid"),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
      },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Invalid response");
  });
});

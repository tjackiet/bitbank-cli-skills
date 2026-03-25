import { describe, expect, it } from "vitest";
import { order } from "../commands/private/order.js";

const CREDS = { apiKey: "testkey", apiSecret: "testsecret" };

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

function mockFetch(data: unknown = MOCK_ORDER): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify({ success: 1, data }));
}

describe("order", () => {
  it("returns error when pair is missing", async () => {
    const result = await order(undefined, "123");
    expect(result.success).toBe(false);
  });

  it("returns error when order-id is missing", async () => {
    const result = await order("btc_jpy", undefined);
    expect(result.success).toBe(false);
  });

  it("returns parsed order data", async () => {
    const result = await order("btc_jpy", "12345", {
      fetch: mockFetch(),
      retries: 0,
      credentials: CREDS,
      nonce: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order_id).toBe(12345);
      expect(result.data.pair).toBe("btc_jpy");
    }
  });
});

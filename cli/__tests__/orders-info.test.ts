import { describe, expect, it } from "vitest";
import { ordersInfo } from "../commands/private/orders-info.js";

const CREDS = { apiKey: "testkey", apiSecret: "testsecret" };

const MOCK_ORDERS = {
  orders: [
    {
      order_id: 1,
      pair: "btc_jpy",
      side: "buy",
      type: "limit",
      start_amount: "0.001",
      remaining_amount: "0",
      executed_amount: "0.001",
      price: "15000000",
      average_price: "15000000",
      ordered_at: 1234567890123,
      expire_at: null,
      status: "FULLY_FILLED",
    },
  ],
};

function mockFetch(data: unknown = MOCK_ORDERS): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify({ success: 1, data }));
}

describe("ordersInfo", () => {
  it("returns error when pair is missing", async () => {
    const result = await ordersInfo(undefined, "1,2");
    expect(result.success).toBe(false);
  });

  it("returns error when order-ids is missing", async () => {
    const result = await ordersInfo("btc_jpy", undefined);
    expect(result.success).toBe(false);
  });

  it("returns parsed orders", async () => {
    const result = await ordersInfo("btc_jpy", "1", {
      fetch: mockFetch(),
      retries: 0,
      credentials: CREDS,
      nonce: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
    }
  });
});

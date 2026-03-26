import { describe, expect, it } from "vitest";
import { activeOrders } from "../../commands/private/active-orders.js";

const CREDS = { apiKey: "testkey", apiSecret: "testsecret" };

const MOCK = {
  orders: [
    {
      order_id: 1,
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
    },
  ],
};

function mockFetch(data: unknown = MOCK): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify({ success: 1, data }));
}

describe("activeOrders", () => {
  it("returns active orders", async () => {
    const result = await activeOrders("btc_jpy", undefined, undefined, undefined, {
      fetch: mockFetch(),
      retries: 0,
      credentials: CREDS,
      nonce: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toHaveLength(1);
  });

  it("works without pair (all pairs)", async () => {
    const result = await activeOrders(undefined, undefined, undefined, undefined, {
      fetch: mockFetch(),
      retries: 0,
      credentials: CREDS,
      nonce: "1",
    });
    expect(result.success).toBe(true);
  });
});

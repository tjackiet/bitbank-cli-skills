import { describe, expect, it } from "vitest";
import { ordersInfo } from "../../commands/private/orders-info.js";
import { TEST_CREDS, mockFetchData, mockFetchRaw } from "../test-helpers.js";

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

describe("ordersInfo", () => {
  it("returns error when pair is missing", async () => {
    const result = await ordersInfo({ pair: undefined, orderIds: "1,2" });
    expect(result.success).toBe(false);
  });

  it("returns error when order-ids is missing", async () => {
    const result = await ordersInfo({ pair: "btc_jpy", orderIds: undefined });
    expect(result.success).toBe(false);
  });

  it("returns parsed orders", async () => {
    const result = await ordersInfo(
      { pair: "btc_jpy", orderIds: "1" },
      {
        fetch: mockFetchData(MOCK_ORDERS),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
      },
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
    }
  });

  it("propagates API error", async () => {
    const result = await ordersInfo(
      { pair: "btc_jpy", orderIds: "1" },
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
    const result = await ordersInfo(
      { pair: "btc_jpy", orderIds: "1" },
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

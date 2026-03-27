import { describe, expect, it } from "vitest";
import { tradeHistory } from "../../commands/private/trade-history.js";
import { TEST_CREDS, mockFetchData } from "../test-helpers.js";

const MOCK = {
  trades: [
    {
      trade_id: 1,
      pair: "btc_jpy",
      order_id: 100,
      side: "buy",
      type: "limit",
      amount: "0.001",
      price: "15000000",
      maker_taker: "maker",
      fee_amount_base: "0",
      fee_amount_quote: "0",
      executed_at: 1234567890123,
    },
  ],
};

describe("tradeHistory", () => {
  it("returns error when pair is missing", async () => {
    const result = await tradeHistory({ pair: undefined });
    expect(result.success).toBe(false);
  });

  it("returns trade history", async () => {
    const result = await tradeHistory(
      { pair: "btc_jpy" },
      {
        fetch: mockFetchData(MOCK),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
      },
    );
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toHaveLength(1);
  });
});

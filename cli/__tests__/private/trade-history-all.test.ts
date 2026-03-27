import { describe, expect, it } from "vitest";
import { tradeHistoryAll } from "../../commands/private/trade-history-all.js";
import { TEST_CREDS, mockFetchData } from "../test-helpers.js";

function makeTrade(id: number, executedAt: number) {
  return {
    trade_id: id,
    pair: "btc_jpy",
    order_id: id,
    side: "buy",
    type: "limit",
    amount: "0.001",
    price: "15000000",
    maker_taker: "maker",
    fee_amount_base: "0",
    fee_amount_quote: "0",
    executed_at: executedAt,
  };
}

describe("tradeHistoryAll", () => {
  it("returns error when pair is missing", async () => {
    const result = await tradeHistoryAll({ pair: undefined });
    expect(result.success).toBe(false);
  });

  it("fetches single page when fewer than 1000", async () => {
    const trades = Array.from({ length: 3 }, (_, i) => makeTrade(i + 1, 1000 + i));

    const result = await tradeHistoryAll(
      { pair: "btc_jpy" },
      { fetch: mockFetchData({ trades }), retries: 0, credentials: TEST_CREDS, nonce: "1" },
    );
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toHaveLength(3);
  });

  it("paginates across multiple pages", async () => {
    const page1 = Array.from({ length: 1000 }, (_, i) => makeTrade(i + 1, 1000 + i));
    const page2 = Array.from({ length: 500 }, (_, i) => makeTrade(1001 + i, 2000 + i));
    let call = 0;
    const fetch: typeof globalThis.fetch = async () => {
      const trades = call++ === 0 ? page1 : page2;
      return new Response(JSON.stringify({ success: 1, data: { trades } }));
    };

    const result = await tradeHistoryAll(
      { pair: "btc_jpy" },
      { fetch, retries: 0, credentials: TEST_CREDS, nonce: "1" },
    );
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toHaveLength(1500);
  });

  it("deduplicates trades at page boundaries", async () => {
    const page1 = Array.from({ length: 1000 }, (_, i) => makeTrade(i + 1, 1000 + i));
    // page2 starts with a duplicate of the last trade from page1
    const page2 = [page1[999], makeTrade(1001, 3000)];
    let call = 0;
    const fetch: typeof globalThis.fetch = async () => {
      const trades = call++ === 0 ? page1 : page2;
      return new Response(JSON.stringify({ success: 1, data: { trades } }));
    };

    const result = await tradeHistoryAll(
      { pair: "btc_jpy" },
      { fetch, retries: 0, credentials: TEST_CREDS, nonce: "1" },
    );
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toHaveLength(1001);
  });
});

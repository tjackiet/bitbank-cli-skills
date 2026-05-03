import { describe, expect, it, vi } from "vitest";
import { tradeHistoryAll } from "../../commands/private/trade-history-all.js";
import { tradeHistory, tradeHistoryDispatch } from "../../commands/private/trade-history.js";
import { TEST_CREDS, mockFetchData } from "../test-helpers.js";

vi.mock("../../commands/private/trade-history-all.js", () => ({
  tradeHistoryAll: vi.fn(async (args: { pair?: string }) => {
    if (!args.pair) return { success: false, error: "pair required" };
    return { success: true, data: [{ pair: args.pair, marker: "all" }] };
  }),
}));

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

describe("tradeHistoryDispatch", () => {
  it("delegates to tradeHistoryAll when --all is set", async () => {
    const result = await tradeHistoryDispatch({
      pair: "btc_jpy",
      all: true,
      since: "1000",
      end: "2000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([{ pair: "btc_jpy", marker: "all" }]);
    }
  });

  it("propagates errors from tradeHistoryAll", async () => {
    const result = await tradeHistoryDispatch({ pair: undefined, all: true });
    expect(result.success).toBe(false);
  });

  it("delegates to single-page tradeHistory when --all is not set", async () => {
    vi.mocked(tradeHistoryAll).mockClear();
    const result = await tradeHistoryDispatch({ pair: undefined, all: false });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeTruthy();
    expect(vi.mocked(tradeHistoryAll)).not.toHaveBeenCalled();
  });
});

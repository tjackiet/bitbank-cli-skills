import { describe, expect, it } from "vitest";
import { transactions } from "../../commands/public/transactions.js";
import { mockFetchData, mockFetchRaw } from "../test-helpers.js";

const MOCK_DATA = {
  transactions: [
    { transaction_id: 1, side: "buy", price: "100", amount: "0.5", executed_at: 1000 },
  ],
};

describe("transactions", () => {
  it("returns error when pair is missing", async () => {
    const result = await transactions({ pair: undefined });
    expect(result.success).toBe(false);
  });

  it("returns parsed transactions", async () => {
    const result = await transactions(
      { pair: "btc_jpy" },
      {
        fetch: mockFetchData(MOCK_DATA),
        retries: 0,
      },
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].price).toBe(100);
      expect(result.data[0].side).toBe("buy");
    }
  });

  it("propagates API error", async () => {
    const result = await transactions(
      { pair: "btc_jpy" },
      {
        fetch: mockFetchRaw({ success: 0, data: { code: 70001 } }),
        retries: 0,
      },
    );
    expect(result.success).toBe(false);
  });

  it("returns error on invalid response shape", async () => {
    const result = await transactions(
      { pair: "btc_jpy" },
      {
        fetch: mockFetchData("invalid"),
        retries: 0,
      },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Invalid response");
  });
});

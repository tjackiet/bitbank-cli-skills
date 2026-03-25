import { describe, expect, it } from "vitest";
import { transactions } from "../commands/public/transactions.js";

const MOCK_DATA = {
  transactions: [
    { transaction_id: 1, side: "buy", price: "100", amount: "0.5", executed_at: 1000 },
  ],
};

function mockFetch(): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify({ success: 1, data: MOCK_DATA }));
}

describe("transactions", () => {
  it("returns error when pair is missing", async () => {
    const result = await transactions(undefined);
    expect(result.success).toBe(false);
  });

  it("returns parsed transactions", async () => {
    const result = await transactions("btc_jpy", undefined, { fetch: mockFetch(), retries: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].price).toBe(100);
      expect(result.data[0].side).toBe("buy");
    }
  });
});

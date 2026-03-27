import { describe, expect, it } from "vitest";
import { marginPositions } from "../../commands/private/margin-positions.js";
import { TEST_CREDS, mockFetchData } from "../test-helpers.js";

const MOCK = {
  positions: [
    {
      position_id: 1,
      pair: "btc_jpy",
      side: "long",
      amount: "0.01",
      price: "15000000",
      open_pnl: "1000",
      close_pnl: "0",
      margin_used: "50000",
      opened_at: 1234567890123,
    },
  ],
};

describe("marginPositions", () => {
  it("returns margin positions", async () => {
    const result = await marginPositions("btc_jpy", {
      fetch: mockFetchData(MOCK),
      retries: 0,
      credentials: TEST_CREDS,
      nonce: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toHaveLength(1);
  });

  it("works without pair filter", async () => {
    const result = await marginPositions(undefined, {
      fetch: mockFetchData(MOCK),
      retries: 0,
      credentials: TEST_CREDS,
      nonce: "1",
    });
    expect(result.success).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { ticker } from "../../commands/public/ticker.js";
import { mockFetchData } from "../test-helpers.js";

const MOCK_TICKER = {
  sell: "15580000",
  buy: "15579999",
  high: "15810000",
  low: "15510000",
  open: "15690000",
  last: "15580000",
  vol: "1234.5678",
  timestamp: 1234567890123,
};

describe("ticker", () => {
  it("returns error when pair is missing", async () => {
    const result = await ticker(undefined);
    expect(result.success).toBe(false);
  });

  it("returns parsed ticker data", async () => {
    const result = await ticker("btc_jpy", { fetch: mockFetchData(MOCK_TICKER), retries: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sell).toBe(15580000);
      expect(result.data.vol).toBe(1234.5678);
      expect(result.data.timestamp).toBe(1234567890123);
    }
  });

  it("returns error on invalid response", async () => {
    const result = await ticker("btc_jpy", { fetch: mockFetchData({ bad: "data" }), retries: 0 });
    expect(result.success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { tickers, tickersJpy } from "../../commands/public/tickers.js";
import { mockFetchData, mockFetchRaw } from "../test-helpers.js";

const MOCK_DATA = [
  {
    pair: "btc_jpy",
    sell: "100",
    buy: "99",
    high: "110",
    low: "90",
    open: "95",
    last: "100",
    vol: "10",
    timestamp: 1000,
  },
];

describe("tickers", () => {
  it("returns parsed tickers", async () => {
    const result = await tickers({ fetch: mockFetchData(MOCK_DATA), retries: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].pair).toBe("btc_jpy");
      expect(result.data[0].sell).toBe(100);
    }
  });
});

describe("tickersJpy", () => {
  it("returns parsed tickers", async () => {
    const result = await tickersJpy({ fetch: mockFetchData(MOCK_DATA), retries: 0 });
    expect(result.success).toBe(true);
  });

  it("propagates API error", async () => {
    const result = await tickersJpy({
      fetch: mockFetchRaw({ success: 0, data: { code: 70001 } }),
      retries: 0,
    });
    expect(result.success).toBe(false);
  });

  it("returns error on invalid response shape", async () => {
    const result = await tickersJpy({ fetch: mockFetchData("invalid"), retries: 0 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Invalid response");
  });
});

describe("tickers error paths", () => {
  it("propagates API error", async () => {
    const result = await tickers({
      fetch: mockFetchRaw({ success: 0, data: { code: 70001 } }),
      retries: 0,
    });
    expect(result.success).toBe(false);
  });

  it("returns error on invalid response shape", async () => {
    const result = await tickers({ fetch: mockFetchData("invalid"), retries: 0 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Invalid response");
  });
});

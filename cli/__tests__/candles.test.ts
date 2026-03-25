import { describe, expect, it } from "vitest";
import { candles } from "../commands/public/candles.js";

const MOCK_DATA = {
  candlestick: [
    {
      type: "1hour",
      ohlcv: [
        ["100", "110", "90", "105", "50", 1000],
        ["105", "115", "95", "110", "60", 2000],
        ["110", "120", "100", "115", "70", 3000],
      ],
    },
  ],
};

function mockFetch(): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify({ success: 1, data: MOCK_DATA }));
}

describe("candles", () => {
  it("returns error when pair is missing", async () => {
    const result = await candles(undefined, "1hour", undefined, 100);
    expect(result.success).toBe(false);
  });

  it("returns error when type is missing", async () => {
    const result = await candles("btc_jpy", undefined, undefined, 100);
    expect(result.success).toBe(false);
  });

  it("returns parsed candles", async () => {
    const result = await candles("btc_jpy", "1hour", "20240101", 100, {
      fetch: mockFetch(),
      retries: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(3);
      expect(result.data[0].open).toBe(100);
      expect(result.data[0].close).toBe(105);
    }
  });

  it("returns error when yearly type gets daily date", async () => {
    const result = await candles("btc_jpy", "1day", "20250301", 100);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("年を指定");
  });

  it("returns error when daily type gets yearly date", async () => {
    const result = await candles("btc_jpy", "1hour", "2025", 100);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("日付を指定");
  });

  it("respects limit", async () => {
    const result = await candles("btc_jpy", "1hour", "20240101", 2, {
      fetch: mockFetch(),
      retries: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].timestamp).toBe(2000);
    }
  });
});

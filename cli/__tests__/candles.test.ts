import { describe, it, expect } from "vitest";
import { candles, previousDate } from "../commands/public/candles.js";

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

  it("does not auto-merge when --date is explicit", async () => {
    let callCount = 0;
    const countingFetch: typeof globalThis.fetch = async () => {
      callCount++;
      return new Response(JSON.stringify({ success: 1, data: MOCK_DATA }));
    };
    const result = await candles("btc_jpy", "1day", "2026", 10, { fetch: countingFetch, retries: 0 });
    expect(result.success).toBe(true);
    expect(callCount).toBe(1);
  });
});

describe("previousDate", () => {
  it("decrements year for yearly types", () => {
    expect(previousDate("2026", "1day")).toBe("2025");
    expect(previousDate("2025", "4hour")).toBe("2024");
    expect(previousDate("2025", "1month")).toBe("2024");
  });

  it("decrements day for daily types", () => {
    expect(previousDate("20260325", "1hour")).toBe("20260324");
    expect(previousDate("20260301", "5min")).toBe("20260228");
    expect(previousDate("20260101", "1min")).toBe("20251231");
  });
});

describe("candles auto-merge", () => {
  it("fetches previous period when limit exceeds single response", async () => {
    const year2026 = {
      candlestick: [{
        type: "1day", ohlcv: [
          ["100", "110", "90", "105", "50", 4000],
          ["105", "115", "95", "110", "60", 5000],
        ]
      }],
    };
    const year2025 = {
      candlestick: [{
        type: "1day", ohlcv: [
          ["80", "90", "70", "85", "40", 1000],
          ["85", "95", "75", "90", "45", 2000],
          ["90", "100", "80", "95", "50", 3000],
        ]
      }],
    };

    let callCount = 0;
    const mergeFetch: typeof globalThis.fetch = async (input) => {
      callCount++;
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
      const data = url.includes("/2025") ? year2025 : year2026;
      return new Response(JSON.stringify({ success: 1, data }));
    };

    // date=undefined triggers auto-merge; mock todayDate by not passing date
    // We can't easily mock todayDate, so we test via fetchOne directly
    // Instead, pass date=undefined and override fetch
    const result = await candles("btc_jpy", "1day", undefined, 5, { fetch: mergeFetch, retries: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(5);
      expect(result.data[0].timestamp).toBe(1000);
      expect(result.data[4].timestamp).toBe(5000);
      expect(callCount).toBe(2);
    }
  });

  it("stops on fetch error for previous period", async () => {
    const currentData = {
      candlestick: [{
        type: "1day", ohlcv: [
          ["100", "110", "90", "105", "50", 1000],
          ["105", "115", "95", "110", "60", 2000],
        ]
      }],
    };

    let callCount = 0;
    const errorFetch: typeof globalThis.fetch = async () => {
      callCount++;
      if (callCount === 1) {
        return new Response(JSON.stringify({ success: 1, data: currentData }));
      }
      return new Response(JSON.stringify({ success: 0, data: { code: 10000 } }), { status: 404 });
    };

    const result = await candles("btc_jpy", "1day", undefined, 10, { fetch: errorFetch, retries: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(callCount).toBe(2);
    }
  });

  it("respects MAX_FETCHES limit", async () => {
    const smallData = {
      candlestick: [{
        type: "1day", ohlcv: [
          ["100", "110", "90", "105", "50", 1000],
        ]
      }],
    };

    let callCount = 0;
    const manyFetch: typeof globalThis.fetch = async () => {
      callCount++;
      return new Response(JSON.stringify({ success: 1, data: smallData }));
    };

    const result = await candles("btc_jpy", "1day", undefined, 100, { fetch: manyFetch, retries: 0 });
    expect(result.success).toBe(true);
    expect(callCount).toBe(3); // MAX_FETCHES = 3
  });
});

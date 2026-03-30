import { describe, expect, it } from "vitest";
import { nextDate } from "../../commands/public/candles-range.js";
import { candles } from "../../commands/public/candles.js";

const makeData = (type: string, ohlcv: unknown[][]) => ({
  candlestick: [{ type, ohlcv }],
});

describe("nextDate", () => {
  it("increments year for yearly types", () => {
    expect(nextDate("2024", "1day")).toBe("2025");
    expect(nextDate("2025", "1month")).toBe("2026");
  });

  it("increments day for daily types", () => {
    expect(nextDate("20260329", "1hour")).toBe("20260330");
    expect(nextDate("20260331", "1hour")).toBe("20260401");
    expect(nextDate("20261231", "1min")).toBe("20270101");
  });
});

describe("candles --from/--to", () => {
  it("returns error when only --from is given", async () => {
    const result = await candles("btc_jpy", "1day", undefined, undefined, "2024");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("両方指定");
  });

  it("returns error when only --to is given", async () => {
    const result = await candles("btc_jpy", "1day", undefined, undefined, undefined, "2026");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("両方指定");
  });

  it("returns error when --date and --from/--to are combined", async () => {
    const result = await candles("btc_jpy", "1day", "2025", undefined, "2024", "2026");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("同時に指定");
  });

  it("returns error when --from > --to", async () => {
    const result = await candles("btc_jpy", "1day", undefined, undefined, "2026", "2024");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("以前の日付");
  });

  it("returns error when format is wrong for yearly type", async () => {
    const result = await candles("btc_jpy", "1day", undefined, undefined, "20240101", "20260101");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("年を指定");
  });

  it("returns error when format is wrong for daily type", async () => {
    const result = await candles("btc_jpy", "1hour", undefined, undefined, "2024", "2026");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("日付を指定");
  });

  it("fetches multiple years for yearly types", async () => {
    const year2024 = makeData("1day", [["80", "90", "70", "85", "40", 1000]]);
    const year2025 = makeData("1day", [["90", "100", "80", "95", "50", 2000]]);
    const year2026 = makeData("1day", [["100", "110", "90", "105", "60", 3000]]);

    const urls: string[] = [];
    const rangeFetch: typeof globalThis.fetch = async (input) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;
      urls.push(url);
      const data = url.includes("/2024") ? year2024 : url.includes("/2025") ? year2025 : year2026;
      return new Response(JSON.stringify({ success: 1, data }));
    };

    const result = await candles("btc_jpy", "1day", undefined, undefined, "2024", "2026", {
      fetch: rangeFetch,
      retries: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(3);
      expect(result.data[0].timestamp).toBe(1000);
      expect(result.data[2].timestamp).toBe(3000);
    }
    expect(urls).toHaveLength(3);
  });

  it("fetches multiple days for daily types", async () => {
    const day1 = makeData("1hour", [["100", "110", "90", "105", "50", 1000]]);
    const day2 = makeData("1hour", [["105", "115", "95", "110", "60", 2000]]);

    let callCount = 0;
    const rangeFetch: typeof globalThis.fetch = async () => {
      callCount++;
      const data = callCount === 1 ? day1 : day2;
      return new Response(JSON.stringify({ success: 1, data }));
    };

    const result = await candles("btc_jpy", "1hour", undefined, undefined, "20260329", "20260330", {
      fetch: rangeFetch,
      retries: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
    }
    expect(callCount).toBe(2);
  });

  it("stops on first fetch error in range", async () => {
    const errorFetch: typeof globalThis.fetch = async () =>
      new Response(JSON.stringify({ success: 0, data: { code: 10000 } }), { status: 404 });

    const result = await candles("btc_jpy", "1day", undefined, undefined, "2024", "2026", {
      fetch: errorFetch,
      retries: 0,
    });
    expect(result.success).toBe(false);
  });
});

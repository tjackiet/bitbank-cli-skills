import { describe, expect, it, vi } from "vitest";
import { VALID_TYPES, candles } from "../../../commands/public/candles.js";
import { mockFetchData } from "../../test-helpers.js";

const MOCK_CANDLE = [
  { 0: "5000000", 1: "5100000", 2: "4900000", 3: "5050000", 4: "100", 5: 1700000000000 },
];

describe("Chaos P-03: candles with invalid --type", () => {
  it("rejects invalid type with list of valid types", async () => {
    const r = await candles({ pair: "btc_jpy", type: "invalid" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error).toContain("--type is required");
      expect(r.error).toContain("1min");
      expect(r.error).toContain("1month");
    }
  });

  it("rejects undefined type", async () => {
    const r = await candles({ pair: "btc_jpy", type: undefined });
    expect(r.success).toBe(false);
  });

  it("rejects missing pair", async () => {
    const r = await candles({ pair: undefined, type: "1hour" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("pair is required");
  });
});

describe("Chaos P-04: candles date format mismatch", () => {
  it("monthly type rejects YYYYMMDD date (expects YYYY)", async () => {
    const r = await candles({ pair: "btc_jpy", type: "1month", date: "20240101" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("年");
  });

  it("hourly type rejects YYYY date (expects YYYYMMDD)", async () => {
    const r = await candles({ pair: "btc_jpy", type: "1hour", date: "2024" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("日付");
  });

  it("--date and --from/--to are mutually exclusive", async () => {
    const r = await candles({
      pair: "btc_jpy",
      type: "1hour",
      date: "20240101",
      from: "20240101",
      to: "20240102",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("同時に指定できません");
  });

  it("--from without --to is rejected", async () => {
    const r = await candles({ pair: "btc_jpy", type: "1hour", from: "20240101" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("両方指定");
  });

  it("--from after --to is rejected", async () => {
    const r = await candles({ pair: "btc_jpy", type: "1hour", from: "20240201", to: "20240101" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("以前");
  });
});

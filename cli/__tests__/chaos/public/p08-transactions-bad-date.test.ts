import { describe, expect, it } from "vitest";
import { transactions } from "../../../commands/public/transactions.js";
import { mockFetchData, mockFetchRaw } from "../../test-helpers.js";

describe("Chaos P-08: transactions with invalid date", () => {
  it("missing pair returns error", async () => {
    const r = await transactions(undefined);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("pair is required");
  });

  it("invalid date propagates API error or empty result", async () => {
    // API would return error for bad date; we mock that
    const r = await transactions("btc_jpy", "99999999", {
      fetch: mockFetchRaw({ success: 0, data: { code: 40001 } }),
      retries: 0,
    });
    expect(r.success).toBe(false);
  });

  it("valid date with empty transactions returns empty array", async () => {
    const r = await transactions("btc_jpy", "20200101", {
      fetch: mockFetchData({ transactions: [] }),
      retries: 0,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toEqual([]);
  });

  it("schema mismatch returns Invalid response", async () => {
    const r = await transactions("btc_jpy", undefined, {
      fetch: mockFetchData({ wrong: "shape" }),
      retries: 0,
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("Invalid response");
  });
});

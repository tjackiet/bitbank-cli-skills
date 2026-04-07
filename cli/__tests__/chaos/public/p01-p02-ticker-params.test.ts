import { describe, expect, it } from "vitest";
import { ticker } from "../../../commands/public/ticker.js";
import { mockFetchData, mockFetchRaw } from "../../test-helpers.js";

describe("Chaos P-01: ticker without pair", () => {
  it("returns error with guidance message", async () => {
    const r = await ticker(undefined);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error).toContain("pair is required");
      expect(r.error).toContain("btc_jpy");
    }
  });

  it("returns error for empty string pair", async () => {
    const r = await ticker("");
    expect(r.success).toBe(false);
  });
});

describe("Chaos P-02: ticker with invalid pair", () => {
  it("propagates API error as Result for unknown pair", async () => {
    const r = await ticker("invalid_pair", {
      fetch: mockFetchRaw({ success: 0, data: { code: 40001 } }),
      retries: 0,
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toBeTruthy();
  });

  it("returns schema error for completely wrong response shape", async () => {
    const r = await ticker("btc_jpy", {
      fetch: mockFetchData({ unexpected: "data" }),
      retries: 0,
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("Invalid response");
  });
});

import { describe, expect, it } from "vitest";
import { circuitBreak } from "../../commands/public/circuit-break.js";
import { mockFetchData } from "../test-helpers.js";

const MOCK_DATA = {
  mode: "NORMAL",
  fee_type: "MAKER_TAKER",
  timestamp: 1000,
};

describe("circuitBreak", () => {
  it("returns error when pair is missing", async () => {
    const result = await circuitBreak(undefined);
    expect(result.success).toBe(false);
  });

  it("returns parsed circuit break info", async () => {
    const result = await circuitBreak("btc_jpy", { fetch: mockFetchData(MOCK_DATA), retries: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mode).toBe("NORMAL");
    }
  });
});

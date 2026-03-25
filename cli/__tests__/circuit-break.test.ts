import { describe, it, expect } from "vitest";
import { circuitBreak } from "../commands/public/circuit-break.js";

const MOCK_DATA = {
  mode: "NORMAL",
  fee_type: "MAKER_TAKER",
  timestamp: 1000,
};

function mockFetch(): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify({ success: 1, data: MOCK_DATA }));
}

describe("circuitBreak", () => {
  it("returns error when pair is missing", async () => {
    const result = await circuitBreak(undefined);
    expect(result.success).toBe(false);
  });

  it("returns parsed circuit break info", async () => {
    const result = await circuitBreak("btc_jpy", { fetch: mockFetch(), retries: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mode).toBe("NORMAL");
    }
  });
});

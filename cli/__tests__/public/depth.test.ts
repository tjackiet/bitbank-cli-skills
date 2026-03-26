import { describe, expect, it } from "vitest";
import { depth } from "../../commands/public/depth.js";

const MOCK_DEPTH = {
  asks: [
    ["100", "1.0"],
    ["101", "2.0"],
  ],
  bids: [["99", "1.5"]],
  timestamp: 1000,
};

function mockFetch(): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify({ success: 1, data: MOCK_DEPTH }));
}

describe("depth", () => {
  it("returns error when pair is missing", async () => {
    const result = await depth(undefined);
    expect(result.success).toBe(false);
  });

  it("returns parsed depth", async () => {
    const result = await depth("btc_jpy", { fetch: mockFetch(), retries: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.asks).toHaveLength(2);
      expect(result.data.bids).toHaveLength(1);
    }
  });
});

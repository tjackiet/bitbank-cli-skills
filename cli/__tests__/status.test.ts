import { describe, it, expect } from "vitest";
import { status } from "../commands/public/status.js";

const MOCK_DATA = {
  statuses: [
    { pair: "btc_jpy", status: "NORMAL", min_amount: "0.0001" },
  ],
};

function mockFetch(): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify({ success: 1, data: MOCK_DATA }));
}

describe("status", () => {
  it("returns parsed statuses", async () => {
    const result = await status({ fetch: mockFetch(), retries: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].pair).toBe("btc_jpy");
      expect(result.data[0].status).toBe("NORMAL");
    }
  });
});

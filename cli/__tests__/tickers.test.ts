import { describe, it, expect } from "vitest";
import { tickers, tickersJpy } from "../commands/public/tickers.js";

const MOCK_DATA = [
  { pair: "btc_jpy", sell: "100", buy: "99", high: "110", low: "90", open: "95", last: "100", vol: "10", timestamp: 1000 },
];

function mockFetch(data: unknown = MOCK_DATA): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify({ success: 1, data }));
}

describe("tickers", () => {
  it("returns parsed tickers", async () => {
    const result = await tickers({ fetch: mockFetch(), retries: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].pair).toBe("btc_jpy");
      expect(result.data[0].sell).toBe(100);
    }
  });
});

describe("tickersJpy", () => {
  it("returns parsed tickers", async () => {
    const result = await tickersJpy({ fetch: mockFetch(), retries: 0 });
    expect(result.success).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { pairs } from "../../commands/public/pairs.js";

const MOCK_DATA = {
  pairs: [
    {
      name: "btc_jpy",
      base_asset: "btc",
      quote_asset: "jpy",
      maker_fee_rate_base_quote: "-0.02",
      taker_fee_rate_base_quote: "0.12",
      unit_amount: "0.0001",
      limit_max_amount: "1000",
      market_max_amount: "100",
      is_enabled: true,
      stop_order: true,
      stop_order_and_cancel: true,
    },
  ],
};

function mockFetch(): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify({ success: 1, data: MOCK_DATA }));
}

describe("pairs", () => {
  it("returns parsed pairs", async () => {
    const result = await pairs({ fetch: mockFetch(), retries: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].name).toBe("btc_jpy");
      expect(result.data[0].is_enabled).toBe(true);
    }
  });
});

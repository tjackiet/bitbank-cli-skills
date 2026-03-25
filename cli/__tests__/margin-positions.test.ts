import { describe, expect, it } from "vitest";
import { marginPositions } from "../commands/private/margin-positions.js";

const CREDS = { apiKey: "testkey", apiSecret: "testsecret" };

const MOCK = {
  positions: [
    {
      position_id: 1,
      pair: "btc_jpy",
      side: "long",
      amount: "0.01",
      price: "15000000",
      open_pnl: "1000",
      close_pnl: "0",
      margin_used: "50000",
      opened_at: 1234567890123,
    },
  ],
};

function mockFetch(data: unknown = MOCK): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify({ success: 1, data }));
}

describe("marginPositions", () => {
  it("returns margin positions", async () => {
    const result = await marginPositions("btc_jpy", {
      fetch: mockFetch(),
      retries: 0,
      credentials: CREDS,
      nonce: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toHaveLength(1);
  });

  it("works without pair filter", async () => {
    const result = await marginPositions(undefined, {
      fetch: mockFetch(),
      retries: 0,
      credentials: CREDS,
      nonce: "1",
    });
    expect(result.success).toBe(true);
  });
});

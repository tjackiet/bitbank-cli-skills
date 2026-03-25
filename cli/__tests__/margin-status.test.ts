import { describe, expect, it } from "vitest";
import { marginStatus } from "../commands/private/margin-status.js";

const CREDS = { apiKey: "testkey", apiSecret: "testsecret" };

const MOCK = {
  margin_rate: "300.00",
  todays_pnl: "1000",
  open_pnl: "500",
  force_close_rate: "50.00",
  total_assets_jpy: "1000000",
  margin_used: "100000",
  margin_available: "900000",
};

function mockFetch(data: unknown = MOCK): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify({ success: 1, data }));
}

describe("marginStatus", () => {
  it("returns margin status", async () => {
    const result = await marginStatus({
      fetch: mockFetch(),
      retries: 0,
      credentials: CREDS,
      nonce: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.margin_rate).toBe("300.00");
  });
});

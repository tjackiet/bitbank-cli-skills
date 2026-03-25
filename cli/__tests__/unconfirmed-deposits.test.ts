import { describe, it, expect } from "vitest";
import { unconfirmedDeposits } from "../commands/private/unconfirmed-deposits.js";

const CREDS = { apiKey: "testkey", apiSecret: "testsecret" };

const MOCK = {
  deposits: [
    { uuid: "abc", asset: "btc", amount: "0.1", txid: "tx123", found_at: 1234567890123 },
  ],
};

function mockFetch(data: unknown = MOCK): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify({ success: 1, data }));
}

describe("unconfirmedDeposits", () => {
  it("returns unconfirmed deposits", async () => {
    const result = await unconfirmedDeposits("btc", {
      fetch: mockFetch(), retries: 0, credentials: CREDS, nonce: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toHaveLength(1);
  });
});

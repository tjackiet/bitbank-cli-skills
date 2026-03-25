import { describe, it, expect } from "vitest";
import { depositOriginators } from "../commands/private/deposit-originators.js";

const CREDS = { apiKey: "testkey", apiSecret: "testsecret" };

const MOCK = {
  originators: [
    { uuid: "abc", label: "main", address: "1A1zP1...", asset: "btc" },
  ],
};

function mockFetch(data: unknown = MOCK): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify({ success: 1, data }));
}

describe("depositOriginators", () => {
  it("returns error when asset is missing", async () => {
    const result = await depositOriginators(undefined);
    expect(result.success).toBe(false);
  });

  it("returns originators", async () => {
    const result = await depositOriginators("btc", {
      fetch: mockFetch(), retries: 0, credentials: CREDS, nonce: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toHaveLength(1);
  });
});

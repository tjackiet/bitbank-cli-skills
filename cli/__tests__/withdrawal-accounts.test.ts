import { describe, expect, it } from "vitest";
import { withdrawalAccounts } from "../commands/private/withdrawal-accounts.js";

const CREDS = { apiKey: "testkey", apiSecret: "testsecret" };

const MOCK = {
  accounts: [{ uuid: "abc", label: "main wallet", address: "1A1zP1..." }],
};

function mockFetch(data: unknown = MOCK): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify({ success: 1, data }));
}

describe("withdrawalAccounts", () => {
  it("returns error when asset is missing", async () => {
    const result = await withdrawalAccounts(undefined);
    expect(result.success).toBe(false);
  });

  it("returns withdrawal accounts", async () => {
    const result = await withdrawalAccounts("btc", {
      fetch: mockFetch(),
      retries: 0,
      credentials: CREDS,
      nonce: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toHaveLength(1);
  });
});

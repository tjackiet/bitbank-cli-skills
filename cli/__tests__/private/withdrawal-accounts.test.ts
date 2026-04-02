import { describe, expect, it } from "vitest";
import { withdrawalAccounts } from "../../commands/private/withdrawal-accounts.js";
import { TEST_CREDS, mockFetchData, mockFetchRaw } from "../test-helpers.js";

const MOCK = {
  accounts: [{ uuid: "abc", label: "main wallet", address: "1A1zP1..." }],
};

describe("withdrawalAccounts", () => {
  it("returns error when asset is missing", async () => {
    const result = await withdrawalAccounts(undefined);
    expect(result.success).toBe(false);
  });

  it("returns withdrawal accounts", async () => {
    const result = await withdrawalAccounts("btc", {
      fetch: mockFetchData(MOCK),
      retries: 0,
      credentials: TEST_CREDS,
      nonce: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toHaveLength(1);
  });

  it("propagates API error", async () => {
    const result = await withdrawalAccounts("btc", {
      fetch: mockFetchRaw({ success: 0, data: { code: 70001 } }),
      retries: 0,
      credentials: TEST_CREDS,
      nonce: "1",
    });
    expect(result.success).toBe(false);
  });

  it("returns error on invalid response shape", async () => {
    const result = await withdrawalAccounts("btc", {
      fetch: mockFetchData("invalid"),
      retries: 0,
      credentials: TEST_CREDS,
      nonce: "1",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Invalid response");
  });
});

import { describe, expect, it } from "vitest";
import { unconfirmedDeposits } from "../../commands/private/unconfirmed-deposits.js";
import { TEST_CREDS, mockFetchData } from "../test-helpers.js";

const MOCK = {
  deposits: [{ uuid: "abc", asset: "btc", amount: "0.1", txid: "tx123", found_at: 1234567890123 }],
};

describe("unconfirmedDeposits", () => {
  it("returns unconfirmed deposits", async () => {
    const result = await unconfirmedDeposits("btc", {
      fetch: mockFetchData(MOCK),
      retries: 0,
      credentials: TEST_CREDS,
      nonce: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toHaveLength(1);
  });
});

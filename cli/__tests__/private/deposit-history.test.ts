import { describe, expect, it } from "vitest";
import { depositHistory } from "../../commands/private/deposit-history.js";
import { TEST_CREDS, mockFetchData } from "../test-helpers.js";

const MOCK = {
  deposits: [
    {
      uuid: "abc",
      asset: "btc",
      amount: "0.1",
      txid: "tx123",
      status: "DONE",
      found_at: 1234567890123,
      confirmed_at: 1234567890200,
    },
  ],
};

describe("depositHistory", () => {
  it("returns deposit history", async () => {
    const result = await depositHistory("btc", undefined, undefined, undefined, {
      fetch: mockFetchData(MOCK),
      retries: 0,
      credentials: TEST_CREDS,
      nonce: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toHaveLength(1);
  });
});

import { describe, expect, it } from "vitest";
import { withdrawalHistory } from "../../commands/private/withdrawal-history.js";
import { TEST_CREDS, mockFetchData, mockFetchRaw } from "../test-helpers.js";

const MOCK = {
  withdrawals: [
    {
      uuid: "abc",
      asset: "btc",
      amount: "0.1",
      fee: "0.0005",
      label: "main",
      address: "1A1zP1...",
      txid: "tx123",
      status: "DONE",
      requested_at: 1234567890123,
    },
  ],
};

describe("withdrawalHistory", () => {
  it("returns error when asset is missing", async () => {
    const result = await withdrawalHistory({ asset: undefined });
    expect(result.success).toBe(false);
  });

  it("returns withdrawal history", async () => {
    const result = await withdrawalHistory(
      { asset: "btc" },
      {
        fetch: mockFetchData(MOCK),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
      },
    );
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toHaveLength(1);
  });

  it("passes optional params (count, since, end)", async () => {
    const result = await withdrawalHistory(
      { asset: "btc", count: "10", since: "1000", end: "2000" },
      {
        fetch: mockFetchData(MOCK),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
      },
    );
    expect(result.success).toBe(true);
  });

  it("propagates API error", async () => {
    const result = await withdrawalHistory(
      { asset: "btc" },
      {
        fetch: mockFetchRaw({ success: 0, data: { code: 70001 } }),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
      },
    );
    expect(result.success).toBe(false);
  });

  it("returns error on invalid response shape", async () => {
    const result = await withdrawalHistory(
      { asset: "btc" },
      {
        fetch: mockFetchData("invalid"),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
      },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Invalid response");
  });
});

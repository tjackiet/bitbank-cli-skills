import { describe, expect, it } from "vitest";
import { depositOriginators } from "../../commands/private/deposit-originators.js";
import { TEST_CREDS, mockFetchData, mockFetchRaw } from "../test-helpers.js";

const MOCK = {
  originators: [{ uuid: "abc", label: "main", address: "1A1zP1...", asset: "btc" }],
};

describe("depositOriginators", () => {
  it("returns error when asset is missing", async () => {
    const result = await depositOriginators({ asset: undefined });
    expect(result.success).toBe(false);
  });

  it("returns originators", async () => {
    const result = await depositOriginators(
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

  it("propagates API error", async () => {
    const result = await depositOriginators(
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
    const result = await depositOriginators(
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

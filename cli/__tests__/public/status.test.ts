import { describe, expect, it } from "vitest";
import { status } from "../../commands/public/status.js";
import { mockFetchData } from "../test-helpers.js";

const MOCK_DATA = {
  statuses: [{ pair: "btc_jpy", status: "NORMAL", min_amount: "0.0001" }],
};

describe("status", () => {
  it("returns parsed statuses", async () => {
    const result = await status({ fetch: mockFetchData(MOCK_DATA), retries: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].pair).toBe("btc_jpy");
      expect(result.data[0].status).toBe("NORMAL");
    }
  });
});

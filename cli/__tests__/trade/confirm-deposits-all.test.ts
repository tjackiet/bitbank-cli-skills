import { describe, expect, it, vi } from "vitest";
import { confirmDepositsAll } from "../../commands/trade/confirm-deposits-all.js";
import { TEST_CREDS, mockFetchRaw } from "../test-helpers.js";

describe("confirm-deposits-all", () => {
  it("returns dryRun without --execute", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const result = await confirmDepositsAll({});
    expect(result).toEqual({ success: true, data: { dryRun: true } });
    writeSpy.mockRestore();
  });

  it("calls API with --execute", async () => {
    const result = await confirmDepositsAll(
      { execute: true },
      {
        fetch: mockFetchRaw({ success: 1, data: { status: "CONFIRMED" } }),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
      },
    );
    expect(result.success).toBe(true);
  });
});

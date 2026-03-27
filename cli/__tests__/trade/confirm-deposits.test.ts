import { describe, expect, it, vi } from "vitest";
import { confirmDeposits } from "../../commands/trade/confirm-deposits.js";
import { TEST_CREDS, mockFetchRaw } from "../test-helpers.js";

describe("confirm-deposits", () => {
  it("returns dryRun without --execute", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const result = await confirmDeposits({ id: "12345" });
    expect(result).toEqual({ success: true, data: { dryRun: true } });
    writeSpy.mockRestore();
  });

  it("calls API with --execute", async () => {
    const result = await confirmDeposits(
      { id: "12345", execute: true },
      {
        fetch: mockFetchRaw({ success: 1, data: { uuid: "abc", status: "CONFIRMED" } }),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
      },
    );
    expect(result.success).toBe(true);
  });

  it("requires id", async () => {
    const result = await confirmDeposits({});
    expect(result).toEqual({ success: false, error: "id is required. Example: --id=12345" });
  });
});

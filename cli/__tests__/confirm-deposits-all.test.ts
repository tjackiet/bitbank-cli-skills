import { describe, it, expect, vi } from "vitest";
import { confirmDepositsAll } from "../commands/trade/confirm-deposits-all.js";

const CREDS = { apiKey: "testkey", apiSecret: "testsecret" };

function mockFetch(body: unknown): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify(body));
}

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
        fetch: mockFetch({ success: 1, data: { status: "CONFIRMED" } }),
        retries: 0, credentials: CREDS, nonce: "1",
      },
    );
    expect(result.success).toBe(true);
  });
});

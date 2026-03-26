import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { withdraw } from "../../commands/trade/withdraw.js";

const CREDS = { apiKey: "testkey", apiSecret: "testsecret" };

function mockFetch(body: unknown): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify(body));
}

const VALID_RESPONSE = {
  success: 1,
  data: { uuid: "withdraw-uuid", asset: "btc", amount: "0.5", status: "UNDER_REVIEW" },
};

describe("withdraw", () => {
  it("returns dryRun without --execute", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const result = await withdraw({ asset: "btc", uuid: "uuid-1", amount: "0.5" });
    expect(result).toEqual({ success: true, data: { dryRun: true } });
    const output = writeSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).toContain("DRY RUN");
    expect(output).toContain("--confirm");
    writeSpy.mockRestore();
  });

  it("errors with --execute but no --confirm", async () => {
    const result = await withdraw({ asset: "btc", uuid: "uuid-1", amount: "0.5", execute: true });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("--confirm");
  });

  it("errors with --confirm but no --execute (dry-run)", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const result = await withdraw({ asset: "btc", uuid: "uuid-1", amount: "0.5", confirm: true });
    // Without --execute, it's just a dry-run
    expect(result).toEqual({ success: true, data: { dryRun: true } });
    writeSpy.mockRestore();
  });

  it("calls API with --execute and --confirm (skipping prompt)", async () => {
    const result = await withdraw(
      { asset: "btc", uuid: "uuid-1", amount: "0.5", execute: true, confirm: true },
      {
        fetch: mockFetch(VALID_RESPONSE),
        retries: 0,
        credentials: CREDS,
        nonce: "1",
        skipConfirmPrompt: true,
      },
    );
    expect(result.success).toBe(true);
    if (result.success) expect((result.data as Record<string, unknown>).uuid).toBe("withdraw-uuid");
  });

  it("requires asset", async () => {
    const result = await withdraw({ uuid: "u", amount: "1" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("asset is required");
  });

  it("requires uuid", async () => {
    const result = await withdraw({ asset: "btc", amount: "1" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("uuid is required");
  });

  it("requires amount", async () => {
    const result = await withdraw({ asset: "btc", uuid: "u" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("amount is required");
  });

  it("validates amount > 0", async () => {
    const result = await withdraw({ asset: "btc", uuid: "u", amount: "0" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("amount must be > 0");
  });

  it("cancels when user types 'no' in confirmation", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const input = Readable.from(["no\n"]);
    const result = await withdraw(
      { asset: "btc", uuid: "uuid-1", amount: "0.5", execute: true, confirm: true },
      {
        fetch: mockFetch(VALID_RESPONSE),
        retries: 0,
        credentials: CREDS,
        nonce: "1",
        input,
        output: process.stdout,
      },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("キャンセル");
    writeSpy.mockRestore();
  });
});

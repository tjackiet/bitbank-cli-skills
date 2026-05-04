import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { withdraw } from "../../commands/trade/withdraw.js";
import { TEST_CREDS, mockFetchRaw } from "../test-helpers.js";

const VALID_UUID = "11111111-1111-1111-1111-111111111111";
const VALID_RESPONSE = {
  success: 1,
  data: { uuid: "withdraw-uuid", asset: "btc", amount: "0.5", status: "UNDER_REVIEW" },
};

describe("withdraw", () => {
  it("returns dryRun without --execute", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const result = await withdraw({ asset: "btc", uuid: VALID_UUID, amount: "0.5" });
    expect(result).toEqual({ success: true, data: { dryRun: true } });
    const output = writeSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).toContain("DRY RUN");
    expect(output).toContain("--confirm");
    writeSpy.mockRestore();
  });

  it("errors with --execute but no --confirm", async () => {
    const result = await withdraw({
      asset: "btc",
      uuid: VALID_UUID,
      amount: "0.5",
      execute: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("--confirm");
  });

  it("errors with --confirm but no --execute (dry-run)", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const result = await withdraw({
      asset: "btc",
      uuid: VALID_UUID,
      amount: "0.5",
      confirm: true,
    });
    // Without --execute, it's just a dry-run
    expect(result).toEqual({ success: true, data: { dryRun: true } });
    writeSpy.mockRestore();
  });

  it("calls API with --execute and --confirm (skipping prompt)", async () => {
    const result = await withdraw(
      { asset: "btc", uuid: VALID_UUID, amount: "0.5", execute: true, confirm: true },
      {
        fetch: mockFetchRaw(VALID_RESPONSE),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
        skipConfirmPrompt: true,
      },
    );
    expect(result.success).toBe(true);
    if (result.success) expect((result.data as Record<string, unknown>).uuid).toBe("withdraw-uuid");
  });

  it("masks --token value in dry-run hint", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await withdraw({ asset: "btc", uuid: VALID_UUID, amount: "0.5", token: "secret123" });
    const output = writeSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).toContain("--token=***");
    expect(output).not.toContain("secret123");
    writeSpy.mockRestore();
  });

  it("masks token field in dry-run body", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await withdraw({ asset: "btc", uuid: VALID_UUID, amount: "0.5", token: "secret123" });
    const output = writeSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).toContain('token: "***"');
    expect(output).not.toContain("secret123");
    writeSpy.mockRestore();
  });

  it("requires asset", async () => {
    const result = await withdraw({ uuid: VALID_UUID, amount: "1" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("asset is required");
  });

  it("requires uuid", async () => {
    const result = await withdraw({ asset: "btc", amount: "1" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("uuid is required");
  });

  it("requires amount", async () => {
    const result = await withdraw({ asset: "btc", uuid: VALID_UUID });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("amount is required");
  });

  it("rejects amount=0", async () => {
    const result = await withdraw({ asset: "btc", uuid: VALID_UUID, amount: "0" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/amount must be > 0/);
  });

  it("rejects amount=-1", async () => {
    const result = await withdraw({ asset: "btc", uuid: VALID_UUID, amount: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejects amount=Infinity", async () => {
    const result = await withdraw({ asset: "btc", uuid: VALID_UUID, amount: "Infinity" });
    expect(result.success).toBe(false);
  });

  it("rejects amount=NaN", async () => {
    const result = await withdraw({ asset: "btc", uuid: VALID_UUID, amount: "NaN" });
    expect(result.success).toBe(false);
  });

  it("rejects amount=1e308 (exponent notation)", async () => {
    const result = await withdraw({ asset: "btc", uuid: VALID_UUID, amount: "1e308" });
    expect(result.success).toBe(false);
  });

  it("rejects uuid=foo", async () => {
    const result = await withdraw({ asset: "btc", uuid: "foo", amount: "0.5" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("uuid must be a valid UUID");
  });

  it("rejects uppercase asset (BTC)", async () => {
    const result = await withdraw({ asset: "BTC", uuid: VALID_UUID, amount: "0.5" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/asset/);
  });

  it("rejects asset=../btc", async () => {
    const result = await withdraw({ asset: "../btc", uuid: VALID_UUID, amount: "0.5" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/asset/);
  });

  it("accepts zero-uuid format", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const result = await withdraw({
      asset: "btc",
      uuid: "00000000-0000-0000-0000-000000000000",
      amount: "0.5",
    });
    expect(result).toEqual({ success: true, data: { dryRun: true } });
    writeSpy.mockRestore();
  });

  it("cancels when user types 'no' in confirmation", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const input = Readable.from(["no\n"]);
    const result = await withdraw(
      { asset: "btc", uuid: VALID_UUID, amount: "0.5", execute: true, confirm: true },
      {
        fetch: mockFetchRaw(VALID_RESPONSE),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
        input,
        output: process.stdout,
      },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("cancelled");
    writeSpy.mockRestore();
  });
});

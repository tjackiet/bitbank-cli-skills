// 100行超: withdraw のドライラン/allowlist チェック/ラベル解決/実行/2FA を網羅
import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { withdraw } from "../../commands/trade/withdraw.js";
import type { Result } from "../../types.js";
import type { WithdrawalAllowlist } from "../../withdrawal-allowlist.js";
import { TEST_CREDS } from "../test-helpers.js";

const POST_RESPONSE = {
  success: 1,
  data: { uuid: "withdraw-uuid", asset: "btc", amount: "0.5", status: "UNDER_REVIEW" },
};
const ACCOUNTS_RESPONSE = {
  success: 1,
  data: {
    accounts: [
      { uuid: "11111111-1111-1111-1111-111111111111", label: "cold-wallet", address: "bc1qcold" },
      { uuid: "22222222-2222-2222-2222-222222222222", label: "exchange-b", address: "bc1qexch" },
    ],
  },
};

function fakeAllowlist(labels: string[]): () => Result<WithdrawalAllowlist> {
  return () => ({ success: true, data: { version: 1, labels } });
}

/** GET (withdrawal_account) → POST (request_withdrawal) のシーケンスを返す fetch */
function sequenceFetch(...bodies: unknown[]): typeof globalThis.fetch {
  let i = 0;
  return (async () =>
    new Response(JSON.stringify(bodies[i++]), { status: 200 })) as typeof globalThis.fetch;
}

describe("withdraw", () => {
  it("returns dryRun without --execute (allowlist passes)", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const result = await withdraw(
      { asset: "btc", to: "cold-wallet", amount: "0.5" },
      { loadAllowlist: fakeAllowlist(["cold-wallet"]) },
    );
    expect(result).toEqual({ success: true, data: { dryRun: true } });
    const output = writeSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).toContain("DRY RUN");
    expect(output).toContain("--confirm");
    writeSpy.mockRestore();
  });

  it("errors with --execute but no --confirm (allowlist passes)", async () => {
    const result = await withdraw(
      { asset: "btc", to: "cold-wallet", amount: "0.5", execute: true },
      { loadAllowlist: fakeAllowlist(["cold-wallet"]) },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("--confirm");
  });

  it("errors with --confirm but no --execute (dry-run; allowlist enforced)", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const result = await withdraw(
      { asset: "btc", to: "cold-wallet", amount: "0.5", confirm: true },
      { loadAllowlist: fakeAllowlist(["cold-wallet"]) },
    );
    expect(result).toEqual({ success: true, data: { dryRun: true } });
    writeSpy.mockRestore();
  });

  it("calls API with --execute and --confirm (resolves label then posts)", async () => {
    const result = await withdraw(
      { asset: "btc", to: "cold-wallet", amount: "0.5", execute: true, confirm: true },
      {
        fetch: sequenceFetch(ACCOUNTS_RESPONSE, POST_RESPONSE),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
        skipConfirmPrompt: true,
        loadAllowlist: fakeAllowlist(["cold-wallet"]),
      },
    );
    expect(result.success).toBe(true);
    if (result.success) expect((result.data as Record<string, unknown>).uuid).toBe("withdraw-uuid");
  });

  it("rejects label not in allowlist (no fetch)", async () => {
    const fetchSpy = vi.fn();
    const result = await withdraw(
      { asset: "btc", to: "attacker", amount: "0.5", execute: true, confirm: true },
      {
        fetch: fetchSpy as unknown as typeof globalThis.fetch,
        retries: 0,
        loadAllowlist: fakeAllowlist(["cold-wallet"]),
      },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("not in withdrawal allowlist");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects when allowlist file is missing", async () => {
    const result = await withdraw(
      { asset: "btc", to: "cold-wallet", amount: "0.5" },
      {
        loadAllowlist: () => ({
          success: false,
          error: "Withdrawal allowlist not found at /x/y.json",
        }),
      },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("allowlist");
  });

  it("rejects when bitbank has no matching label", async () => {
    const result = await withdraw(
      { asset: "btc", to: "cold-wallet", amount: "0.5", execute: true, confirm: true },
      {
        fetch: sequenceFetch({ success: 1, data: { accounts: [] } }),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
        skipConfirmPrompt: true,
        loadAllowlist: fakeAllowlist(["cold-wallet"]),
      },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('Label "cold-wallet" not found');
  });

  it("rejects ambiguous label (multiple bitbank accounts share the same label)", async () => {
    const dup = {
      success: 1,
      data: {
        accounts: [
          { uuid: "aaa", label: "dup", address: "bc1a" },
          { uuid: "bbb", label: "dup", address: "bc1b" },
        ],
      },
    };
    const result = await withdraw(
      { asset: "btc", to: "dup", amount: "0.5", execute: true, confirm: true },
      {
        fetch: sequenceFetch(dup),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
        skipConfirmPrompt: true,
        loadAllowlist: fakeAllowlist(["dup"]),
      },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Ambiguous");
  });

  it("masks --token value in dry-run hint", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await withdraw(
      { asset: "btc", to: "cold-wallet", amount: "0.5", token: "secret123" },
      { loadAllowlist: fakeAllowlist(["cold-wallet"]) },
    );
    const output = writeSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).toContain("--token=***");
    expect(output).not.toContain("secret123");
    writeSpy.mockRestore();
  });

  it("masks token field in dry-run body", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await withdraw(
      { asset: "btc", to: "cold-wallet", amount: "0.5", token: "secret123" },
      { loadAllowlist: fakeAllowlist(["cold-wallet"]) },
    );
    const output = writeSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).toContain('token: "***"');
    expect(output).not.toContain("secret123");
    writeSpy.mockRestore();
  });

  it("requires asset", async () => {
    const result = await withdraw(
      { to: "cold-wallet", amount: "1" },
      { loadAllowlist: fakeAllowlist(["cold-wallet"]) },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("asset is required");
  });

  it("requires to (label)", async () => {
    const result = await withdraw(
      { asset: "btc", amount: "1" },
      { loadAllowlist: fakeAllowlist(["cold-wallet"]) },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/to/);
  });

  it("requires amount", async () => {
    const result = await withdraw(
      { asset: "btc", to: "cold-wallet" },
      { loadAllowlist: fakeAllowlist(["cold-wallet"]) },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("amount is required");
  });

  it("rejects amount=0", async () => {
    const result = await withdraw(
      { asset: "btc", to: "cold-wallet", amount: "0" },
      { loadAllowlist: fakeAllowlist(["cold-wallet"]) },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/amount must be > 0/);
  });

  it("rejects amount=-1", async () => {
    const result = await withdraw(
      { asset: "btc", to: "cold-wallet", amount: "-1" },
      { loadAllowlist: fakeAllowlist(["cold-wallet"]) },
    );
    expect(result.success).toBe(false);
  });

  it("rejects amount=Infinity", async () => {
    const result = await withdraw(
      { asset: "btc", to: "cold-wallet", amount: "Infinity" },
      { loadAllowlist: fakeAllowlist(["cold-wallet"]) },
    );
    expect(result.success).toBe(false);
  });

  it("rejects amount=NaN", async () => {
    const result = await withdraw(
      { asset: "btc", to: "cold-wallet", amount: "NaN" },
      { loadAllowlist: fakeAllowlist(["cold-wallet"]) },
    );
    expect(result.success).toBe(false);
  });

  it("rejects amount=1e308 (exponent notation)", async () => {
    const result = await withdraw(
      { asset: "btc", to: "cold-wallet", amount: "1e308" },
      { loadAllowlist: fakeAllowlist(["cold-wallet"]) },
    );
    expect(result.success).toBe(false);
  });

  it("rejects uppercase asset (BTC)", async () => {
    const result = await withdraw(
      { asset: "BTC", to: "cold-wallet", amount: "0.5" },
      { loadAllowlist: fakeAllowlist(["cold-wallet"]) },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/asset/);
  });

  it("rejects asset=../btc", async () => {
    const result = await withdraw(
      { asset: "../btc", to: "cold-wallet", amount: "0.5" },
      { loadAllowlist: fakeAllowlist(["cold-wallet"]) },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/asset/);
  });

  it("cancels when user types 'no' in confirmation", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const input = Readable.from(["no\n"]);
    const result = await withdraw(
      { asset: "btc", to: "cold-wallet", amount: "0.5", execute: true, confirm: true },
      {
        fetch: sequenceFetch(ACCOUNTS_RESPONSE, POST_RESPONSE),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
        input,
        output: process.stdout,
        loadAllowlist: fakeAllowlist(["cold-wallet"]),
      },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("cancelled");
    writeSpy.mockRestore();
  });
});

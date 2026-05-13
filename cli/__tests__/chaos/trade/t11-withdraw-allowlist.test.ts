import { describe, expect, it, vi } from "vitest";
import { withdraw } from "../../../commands/trade/withdraw.js";

describe("Chaos T-11: withdraw enforces local allowlist before any API call", () => {
  it("rejects label not in allowlist even with --execute --confirm (no fetch)", async () => {
    const fetchSpy = vi.fn();
    const r = await withdraw(
      { asset: "btc", to: "attacker-wallet", amount: "0.5", execute: true, confirm: true },
      {
        fetch: fetchSpy as unknown as typeof globalThis.fetch,
        retries: 0,
        loadAllowlist: () => ({ success: true, data: { version: 1, labels: ["cold-wallet"] } }),
      },
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("not in withdrawal allowlist");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects when allowlist load fails (no fetch)", async () => {
    const fetchSpy = vi.fn();
    const r = await withdraw(
      { asset: "btc", to: "cold-wallet", amount: "0.5", execute: true, confirm: true },
      {
        fetch: fetchSpy as unknown as typeof globalThis.fetch,
        retries: 0,
        loadAllowlist: () => ({
          success: false,
          error: "Withdrawal allowlist not found at /x.json",
        }),
      },
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("allowlist");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects empty allowlist (no fetch)", async () => {
    const fetchSpy = vi.fn();
    const r = await withdraw(
      { asset: "btc", to: "cold-wallet", amount: "0.5" },
      {
        fetch: fetchSpy as unknown as typeof globalThis.fetch,
        retries: 0,
        loadAllowlist: () => ({ success: true, data: { version: 1, labels: [] } }),
      },
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("not in withdrawal allowlist");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("allowlist check happens even in dry-run (no --execute)", async () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const r = await withdraw(
      { asset: "btc", to: "attacker-wallet", amount: "0.5" },
      { loadAllowlist: () => ({ success: true, data: { version: 1, labels: ["cold-wallet"] } }) },
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("not in withdrawal allowlist");
    spy.mockRestore();
  });
});

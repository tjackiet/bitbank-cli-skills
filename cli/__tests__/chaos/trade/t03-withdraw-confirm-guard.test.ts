import { describe, expect, it, vi } from "vitest";
import { withdraw } from "../../../commands/trade/withdraw.js";

describe("Chaos T-03: withdraw --execute without --confirm", () => {
  it("returns error mentioning --confirm", async () => {
    const r = await withdraw({
      asset: "btc",
      uuid: "uuid-1",
      amount: "0.5",
      execute: true,
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("--confirm");
  });

  it("--confirm alone (no --execute) is just dry-run, not execution", async () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const r = await withdraw({
      asset: "btc",
      uuid: "uuid-1",
      amount: "0.5",
      confirm: true,
    });
    expect(r).toEqual({ success: true, data: { dryRun: true } });
    spy.mockRestore();
  });

  it("neither --execute nor --confirm is dry-run", async () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const r = await withdraw({
      asset: "btc",
      uuid: "uuid-1",
      amount: "0.5",
    });
    expect(r).toEqual({ success: true, data: { dryRun: true } });
    spy.mockRestore();
  });
});

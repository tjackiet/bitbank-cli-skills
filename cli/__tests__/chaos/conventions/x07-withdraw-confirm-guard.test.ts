import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("Chaos X-07: withdraw enforces --confirm in addition to --execute", () => {
  it("cli/commands/trade/withdraw.ts references .confirm", () => {
    const hit = execSync('grep -E "\\.confirm\\b" cli/commands/trade/withdraw.ts || true', {
      encoding: "utf-8",
    }).trim();
    expect(
      hit,
      'withdraw.ts must guard on --confirm (see .claude/rules/trading-safety.md "withdraw の追加ガード")',
    ).not.toBe("");
  });
});

import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

function grepConfirm(file: string): string {
  return execSync(`grep -E "\\.confirm\\b" ${file} || true`, { encoding: "utf-8" }).trim();
}

describe("Chaos X-10: destructive non-trade commands enforce --confirm", () => {
  it("cli/commands/paper/reset.ts references .confirm", () => {
    const hit = grepConfirm("cli/commands/paper/reset.ts");
    expect(
      hit,
      'paper reset must require --confirm (see .claude/rules/commands.md: "paper の reset のみ --confirm を必須")',
    ).not.toBe("");
  });

  it("cli/commands/profile/remove.ts references .confirm", () => {
    const hit = grepConfirm("cli/commands/profile/remove.ts");
    expect(
      hit,
      'profile remove must require --confirm (see .claude/rules/commands.md: "profile の remove のみ --confirm を必須")',
    ).not.toBe("");
  });
});

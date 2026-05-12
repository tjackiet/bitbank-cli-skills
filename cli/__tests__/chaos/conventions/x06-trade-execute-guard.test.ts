import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/** dry-run helper / aggregator: not user-callable trade commands. */
const EXCLUDED = new Set(["dry-run.ts", "index.ts"]);

function tradeCommandFiles(): string[] {
  const out = execSync('find cli/commands/trade/ -maxdepth 1 -name "*.ts"', {
    encoding: "utf-8",
  }).trim();
  return out
    .split("\n")
    .filter(Boolean)
    .filter((f) => !EXCLUDED.has(f.split("/").pop() ?? ""));
}

describe("Chaos X-06: all trade commands gate API calls on .execute", () => {
  it("every cli/commands/trade/*.ts (except dry-run/index) references .execute", () => {
    const files = tradeCommandFiles();
    expect(files.length, "expected to discover trade command files").toBeGreaterThan(0);
    const missing = files.filter((f) => {
      const hit = execSync(`grep -E "\\.execute\\b" ${f} || true`, { encoding: "utf-8" }).trim();
      return hit === "";
    });
    expect(
      missing,
      `Trade commands missing --execute guard (see .claude/rules/trading-safety.md "ドライラン (デフォルト)"):\n${missing.join("\n")}`,
    ).toEqual([]);
  });
});

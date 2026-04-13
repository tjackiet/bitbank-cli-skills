import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("Chaos X-05: new Date() usage audit", () => {
  it("cli/commands/ does not use new Date()", () => {
    const result = execSync('grep -rn "new Date()" cli/commands/ --include="*.ts" || true', {
      encoding: "utf-8",
    });
    const lines = result.trim().split("\n").filter(Boolean);
    expect(lines).toHaveLength(0);
  });

  it("core modules: new Date() only in cache.ts, trade-log.ts, and date-utils.ts", () => {
    const result = execSync(
      'grep -rn "new Date()" cli/cache.ts cli/trade-log.ts cli/date-utils.ts || true',
      { encoding: "utf-8" },
    );
    const hits = result.trim().split("\n").filter(Boolean);
    const files = new Set(hits.map((line) => line.split(":")[0]));
    expect(files).toEqual(new Set(["cli/cache.ts", "cli/trade-log.ts", "cli/date-utils.ts"]));
  });

  it("auth.ts does not use new Date() (uses Date.now())", () => {
    const result = execSync('grep -n "new Date()" cli/auth.ts || true', { encoding: "utf-8" });
    expect(result.trim()).toBe("");
  });
});

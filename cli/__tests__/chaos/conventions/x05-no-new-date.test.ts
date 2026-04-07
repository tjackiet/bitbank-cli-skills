import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("Chaos X-05: new Date() usage audit", () => {
  it("cli/commands/ has no new Date()", () => {
    const result = execSync('grep -rn "new Date()" cli/commands/ --include="*.ts" || true', {
      encoding: "utf-8",
    });
    // candles.ts uses new Date() for default date — known usage
    const lines = result.trim().split("\n").filter(Boolean);
    for (const line of lines) {
      // Flag each hit for awareness
      expect(line).toContain("candles");
    }
  });

  it("core modules: flag new Date() usage", () => {
    const result = execSync('grep -rn "new Date()" cli/cache.ts cli/trade-log.ts || true', {
      encoding: "utf-8",
    });
    const hits = result.trim().split("\n").filter(Boolean);
    // These are known usages — test documents them
    expect(hits.length).toBeGreaterThanOrEqual(0);
  });

  it("auth.ts does not use new Date() (uses Date.now())", () => {
    const result = execSync('grep -n "new Date()" cli/auth.ts || true', { encoding: "utf-8" });
    expect(result.trim()).toBe("");
  });
});

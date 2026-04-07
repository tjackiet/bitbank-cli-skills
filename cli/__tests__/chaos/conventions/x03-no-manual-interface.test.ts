import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("Chaos X-03: no manual interface in cli/commands/", () => {
  it("grep finds zero interface declarations", () => {
    const result = execSync(
      'grep -rn "^export interface " cli/commands/ --include="*.ts" || true',
      { encoding: "utf-8" },
    );
    expect(result.trim()).toBe("");
  });

  it("grep finds zero non-exported interface declarations", () => {
    const result = execSync('grep -rn "^interface " cli/commands/ --include="*.ts" || true', {
      encoding: "utf-8",
    });
    expect(result.trim()).toBe("");
  });
});

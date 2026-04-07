import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("Chaos X-01: no throw in cli/commands/", () => {
  it("grep finds zero throw statements in command files", () => {
    const result = execSync('grep -rnw "throw" cli/commands/ --include="*.ts" || true', {
      encoding: "utf-8",
    });
    expect(result.trim()).toBe("");
  });

  it("grep finds zero throw in core modules (http, auth, output)", () => {
    const result = execSync(
      'grep -rnw "throw" cli/http.ts cli/http-core.ts cli/http-private.ts cli/http-private-post.ts cli/auth.ts cli/output.ts || true',
      { encoding: "utf-8" },
    );
    expect(result.trim()).toBe("");
  });
});

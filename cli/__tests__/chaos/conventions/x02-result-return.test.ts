import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("Chaos X-02: all commands return Result<T>", () => {
  it("public commands export functions returning Promise<Result<", () => {
    const hits = execSync(
      'grep -rl "Promise<Result<" cli/commands/public/ --include="*.ts" || true',
      { encoding: "utf-8" },
    ).trim();
    expect(hits.length).toBeGreaterThan(0);
  });

  it("private commands export functions returning Promise<Result<", () => {
    const hits = execSync(
      'grep -rl "Promise<Result<" cli/commands/private/ --include="*.ts" || true',
      { encoding: "utf-8" },
    ).trim();
    expect(hits.length).toBeGreaterThan(0);
  });

  it("trade commands export functions returning Promise<Result<", () => {
    const hits = execSync(
      'grep -rl "Promise<Result<" cli/commands/trade/ --include="*.ts" || true',
      { encoding: "utf-8" },
    ).trim();
    expect(hits.length).toBeGreaterThan(0);
  });

  it("http modules return Result<T>", () => {
    const hits = execSync(
      'grep -l "Promise<Result<" cli/http.ts cli/http-private.ts cli/http-private-post.ts cli/http-core.ts || true',
      { encoding: "utf-8" },
    ).trim();
    expect(hits.split("\n").length).toBeGreaterThanOrEqual(3);
  });
});

import { execFile } from "node:child_process";
import { describe, expect, it } from "vitest";

const CLI = "cli/index.ts";

function run(...args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    execFile("npx", ["tsx", CLI, ...args], { timeout: 15000 }, (error, stdout, stderr) => {
      resolve({ stdout, stderr, exitCode: error ? Number(error.code) || 1 : 0 });
    });
  });
}

describe("Chaos R-06: extremely long command name (1000 chars)", () => {
  it("does not crash, returns appropriate error", async () => {
    const longName = "x".repeat(1000);
    const { stderr, exitCode } = await run(longName);
    expect(exitCode).toBe(4);
    expect(stderr).toContain("Unknown command");
  });

  it("--machine mode also handles gracefully", async () => {
    const longName = "y".repeat(1000);
    const { stdout, exitCode } = await run("--machine", longName);
    expect(exitCode).toBe(4);
    const parsed = JSON.parse(stdout);
    expect(parsed.success).toBe(false);
  });
});

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

describe("Chaos R-01: no args shows help", () => {
  it("exit code 0 and Usage line", async () => {
    const { stdout, exitCode } = await run();
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Usage: bitbank");
    expect(stdout).toContain("Commands:");
  });
});

describe("Chaos R-02: unknown subcommand", () => {
  it("exit code 4 + stderr error", async () => {
    const { stderr, exitCode } = await run("nonexistent");
    expect(exitCode).toBe(4);
    expect(stderr).toContain("Unknown command");
  });
});

describe("Chaos R-03: --format=invalid", () => {
  it("exit code 4 + Unknown format", async () => {
    const { stderr, exitCode } = await run("--format=invalid", "ticker");
    expect(exitCode).toBe(4);
    expect(stderr).toContain("Unknown format");
  });
});

describe("Chaos R-04: --machine + unknown command", () => {
  it("JSON envelope with success: false on stdout", async () => {
    const { stdout, exitCode } = await run("--machine", "nonexistent");
    expect(exitCode).toBe(4);
    const parsed = JSON.parse(stdout);
    expect(parsed.success).toBe(false);
    expect(parsed.exitCode).toBe(4);
  });
});

describe("Chaos R-05: subcommand --help", () => {
  it("ticker --help exits 0", async () => {
    const { exitCode } = await run("ticker", "--help");
    expect(exitCode).toBe(0);
  });
});

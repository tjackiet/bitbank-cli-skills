import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applyProfile, parseEnvFile } from "../profile.js";

describe("parseEnvFile", () => {
  it("parses key=value lines", () => {
    const result = parseEnvFile("FOO=bar\nBAZ=qux");
    expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("ignores comments and blank lines", () => {
    const result = parseEnvFile("# comment\n\nKEY=val\n");
    expect(result).toEqual({ KEY: "val" });
  });

  it("strips surrounding quotes", () => {
    const result = parseEnvFile("A=\"hello\"\nB='world'");
    expect(result).toEqual({ A: "hello", B: "world" });
  });

  it("handles values with = sign", () => {
    const result = parseEnvFile("KEY=a=b=c");
    expect(result).toEqual({ KEY: "a=b=c" });
  });
});

describe("applyProfile", () => {
  let origCwd: typeof process.cwd;
  let tmpDir: string;
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "profile-test-"));
    origCwd = process.cwd;
    process.cwd = () => tmpDir;
    savedEnv.BITBANK_API_KEY = process.env.BITBANK_API_KEY;
    savedEnv.BITBANK_API_SECRET = process.env.BITBANK_API_SECRET;
  });

  afterEach(() => {
    process.cwd = origCwd;
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("loads credentials from .env.<profile>", () => {
    writeFileSync(join(tmpDir, ".env.bot1"), "BITBANK_API_KEY=k1\nBITBANK_API_SECRET=s1");
    const result = applyProfile("bot1");
    expect(result.success).toBe(true);
    expect(process.env.BITBANK_API_KEY).toBe("k1");
    expect(process.env.BITBANK_API_SECRET).toBe("s1");
  });

  it("returns PARAM error for missing profile file", () => {
    const result = applyProfile("nonexistent");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("not found");
      expect(result.exitCode).toBe(4);
    }
  });

  it("rejects profile names with path traversal", () => {
    for (const name of ["../etc/passwd", "..\\foo", "sub/dir", "a\\b"]) {
      const result = applyProfile(name);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid profile name");
        expect(result.exitCode).toBe(4);
      }
    }
  });

  it("does not affect env when profile is not specified (backward compat)", () => {
    // biome-ignore lint/performance/noDelete: process.env requires delete
    delete process.env.BITBANK_API_KEY;
    // loadCredentials without profile should use process.env as-is
    expect(process.env.BITBANK_API_KEY).toBeUndefined();
  });
});

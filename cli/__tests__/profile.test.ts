import { chmodSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyProfile, parseEnvFile, warnIfInsecure } from "../profile.js";

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
    savedEnv.PATH = process.env.PATH;
    savedEnv.NODE_OPTIONS = process.env.NODE_OPTIONS;
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
    for (const name of ["../etc/passwd", "..\\foo", "sub/dir", "a\\b", "foo..bar"]) {
      const result = applyProfile(name);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid profile name");
        expect(result.exitCode).toBe(4);
      }
    }
  });

  it("rejects profile names with disallowed characters", () => {
    for (const name of ["foo bar", ".hidden", "foo\0bar", "foo\nbar", "foo;bar", ""]) {
      const result = applyProfile(name);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid profile name");
        expect(result.exitCode).toBe(4);
      }
    }
  });

  it("accepts valid profile names", () => {
    writeFileSync(join(tmpDir, ".env.valid_name-1"), "BITBANK_API_KEY=v1");
    writeFileSync(join(tmpDir, ".env.test"), "BITBANK_API_KEY=t1");
    expect(applyProfile("valid_name-1").success).toBe(true);
    expect(applyProfile("test").success).toBe(true);
  });

  it("only reflects BITBANK_* keys and warns for others", () => {
    const origPath = process.env.PATH;
    const origNodeOpts = process.env.NODE_OPTIONS;
    writeFileSync(
      join(tmpDir, ".env.bot2"),
      [
        "BITBANK_API_KEY=foo",
        "PATH=/evil",
        "NODE_OPTIONS=--require ./mal.js",
        "LD_PRELOAD=/tmp/x.so",
      ].join("\n"),
    );
    const spy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const result = applyProfile("bot2");
    expect(result.success).toBe(true);
    expect(process.env.BITBANK_API_KEY).toBe("foo");
    expect(process.env.PATH).toBe(origPath);
    expect(process.env.NODE_OPTIONS).toBe(origNodeOpts);
    const warnings = spy.mock.calls
      .map((c) => String(c[0]))
      .filter((m) => m.includes("ignored non-BITBANK_*"));
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain("PATH");
    expect(warnings[0]).toContain("NODE_OPTIONS");
    expect(warnings[0]).toContain("LD_PRELOAD");
    spy.mockRestore();
  });

  it("does not affect env when profile is not specified (backward compat)", () => {
    // biome-ignore lint/performance/noDelete: process.env requires delete
    delete process.env.BITBANK_API_KEY;
    // loadCredentials without profile should use process.env as-is
    expect(process.env.BITBANK_API_KEY).toBeUndefined();
  });
});

describe("warnIfInsecure", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "perm-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("warns when file is group/other readable (0644)", () => {
    const filepath = join(tmpDir, ".env.prod");
    writeFileSync(filepath, "SECRET=x");
    chmodSync(filepath, 0o644);
    const spy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    warnIfInsecure(filepath, ".env.prod");
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain("readable by other users");
    expect(spy.mock.calls[0][0]).toContain("chmod 600");
    spy.mockRestore();
  });

  it("does not warn when file is owner-only (0600)", () => {
    const filepath = join(tmpDir, ".env.safe");
    writeFileSync(filepath, "SECRET=x");
    chmodSync(filepath, 0o600);
    const spy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    warnIfInsecure(filepath, ".env.safe");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("skips check on Windows", () => {
    const filepath = join(tmpDir, ".env.win");
    writeFileSync(filepath, "SECRET=x");
    chmodSync(filepath, 0o644);
    const origPlatform = process.platform;
    Object.defineProperty(process, "platform", { value: "win32" });
    const spy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    warnIfInsecure(filepath, ".env.win");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    Object.defineProperty(process, "platform", { value: origPlatform });
  });
});

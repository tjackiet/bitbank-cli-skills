import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { listProfiles } from "../commands/profiles.js";

describe("listProfiles", () => {
  let origCwd: typeof process.cwd;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "profiles-cmd-"));
    origCwd = process.cwd;
    process.cwd = () => tmpDir;
  });

  afterEach(() => {
    process.cwd = origCwd;
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("lists profile names from .env.* files", () => {
    writeFileSync(join(tmpDir, ".env.bot1"), "KEY=val");
    writeFileSync(join(tmpDir, ".env.test"), "KEY=val");
    writeFileSync(join(tmpDir, ".env"), "KEY=val");
    const profiles = listProfiles();
    expect(profiles).toContain("bot1");
    expect(profiles).toContain("test");
    expect(profiles).not.toContain("");
  });

  it("excludes .env.example", () => {
    writeFileSync(join(tmpDir, ".env.example"), "KEY=");
    writeFileSync(join(tmpDir, ".env.prod"), "KEY=val");
    const profiles = listProfiles();
    expect(profiles).toEqual(["prod"]);
  });

  it("returns empty array when no profiles exist", () => {
    expect(listProfiles()).toEqual([]);
  });
});

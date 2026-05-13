import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadAllowlist } from "../withdrawal-allowlist.js";

describe("withdrawal-allowlist: loadAllowlist", () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "withdrawal-allowlist-"));
    path = join(dir, "withdrawal-allowlist.json");
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("returns error when file does not exist (with helpful message)", () => {
    const r = loadAllowlist(path);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error).toContain("not found");
      expect(r.error).toContain("0600");
      expect(r.error).toContain("labels");
    }
  });

  it("loads valid allowlist", () => {
    writeFileSync(path, JSON.stringify({ version: 1, labels: ["cold-wallet", "exchange-b"] }));
    chmodSync(path, 0o600);
    const r = loadAllowlist(path);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.labels).toEqual(["cold-wallet", "exchange-b"]);
    }
  });

  it("rejects invalid JSON", () => {
    writeFileSync(path, "{not json");
    chmodSync(path, 0o600);
    const r = loadAllowlist(path);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("Invalid allowlist JSON");
  });

  it("rejects schema mismatch (wrong version)", () => {
    writeFileSync(path, JSON.stringify({ version: 2, labels: ["x"] }));
    chmodSync(path, 0o600);
    const r = loadAllowlist(path);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("schema mismatch");
  });

  it("rejects schema mismatch (labels is not array)", () => {
    writeFileSync(path, JSON.stringify({ version: 1, labels: "cold-wallet" }));
    chmodSync(path, 0o600);
    const r = loadAllowlist(path);
    expect(r.success).toBe(false);
  });

  it("rejects schema mismatch (label entry is empty string)", () => {
    writeFileSync(path, JSON.stringify({ version: 1, labels: [""] }));
    chmodSync(path, 0o600);
    const r = loadAllowlist(path);
    expect(r.success).toBe(false);
  });

  it.skipIf(process.platform === "win32")("warns when file is world-readable", () => {
    writeFileSync(path, JSON.stringify({ version: 1, labels: ["x"] }));
    chmodSync(path, 0o644);
    let warn = "";
    const orig = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: string | Uint8Array) => {
      warn += String(chunk);
      return true;
    }) as typeof process.stderr.write;
    try {
      loadAllowlist(path);
    } finally {
      process.stderr.write = orig;
    }
    expect(warn).toContain("readable by other users");
    expect(warn).toContain("chmod 600");
  });
});

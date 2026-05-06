// 隔離: BITBANK_PROFILES_PATH と profiles.json の per-test リセットは
// cli/__tests__/setup.ts のグローバル設定で行われている前提（resolver が
// default profile を返さないことに依存）。ここでは BITBANK_PROFILE を含む
// env 群を明示的にクリアする。
import { afterEach, describe, expect, it } from "vitest";
import { resolveCredentials } from "../../../profiles-resolver.js";

const hadOrigKey = "BITBANK_API_KEY" in process.env;
const hadOrigSecret = "BITBANK_API_SECRET" in process.env;
const hadOrigProfile = "BITBANK_PROFILE" in process.env;
const origKey = process.env.BITBANK_API_KEY;
const origSecret = process.env.BITBANK_API_SECRET;
const origProfile = process.env.BITBANK_PROFILE;

afterEach(() => {
  if (hadOrigKey) process.env.BITBANK_API_KEY = origKey ?? "";
  // biome-ignore lint/performance/noDelete: process.env requires delete
  else delete process.env.BITBANK_API_KEY;
  if (hadOrigSecret) process.env.BITBANK_API_SECRET = origSecret ?? "";
  // biome-ignore lint/performance/noDelete: process.env requires delete
  else delete process.env.BITBANK_API_SECRET;
  if (hadOrigProfile) process.env.BITBANK_PROFILE = origProfile ?? "";
  // biome-ignore lint/performance/noDelete: process.env requires delete
  else delete process.env.BITBANK_PROFILE;
});

describe("Chaos A-01: API_KEY only (no SECRET)", () => {
  it("returns error result", () => {
    process.env.BITBANK_API_KEY = "some-key";
    // biome-ignore lint/performance/noDelete: process.env requires delete
    delete process.env.BITBANK_API_SECRET;
    // biome-ignore lint/performance/noDelete: process.env requires delete
    delete process.env.BITBANK_PROFILE;
    const r = resolveCredentials();
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error).toContain("BITBANK_API_SECRET");
    }
  });

  it("SECRET only (no KEY) also returns error", () => {
    // biome-ignore lint/performance/noDelete: process.env requires delete
    delete process.env.BITBANK_API_KEY;
    process.env.BITBANK_API_SECRET = "some-secret";
    // biome-ignore lint/performance/noDelete: process.env requires delete
    delete process.env.BITBANK_PROFILE;
    const r = resolveCredentials();
    expect(r.success).toBe(false);
  });
});

describe("Chaos A-02: both env vars are empty strings", () => {
  it("returns error when both are empty", () => {
    process.env.BITBANK_API_KEY = "";
    process.env.BITBANK_API_SECRET = "";
    // biome-ignore lint/performance/noDelete: process.env requires delete
    delete process.env.BITBANK_PROFILE;
    const r = resolveCredentials();
    expect(r.success).toBe(false);
  });

  it("returns error when KEY is empty, SECRET is set", () => {
    process.env.BITBANK_API_KEY = "";
    process.env.BITBANK_API_SECRET = "valid-secret";
    // biome-ignore lint/performance/noDelete: process.env requires delete
    delete process.env.BITBANK_PROFILE;
    const r = resolveCredentials();
    expect(r.success).toBe(false);
  });
});

import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock homedir to use a temp directory for tests
const TEST_CACHE = join(import.meta.dirname, ".bitbank-cache");
vi.mock("node:os", () => ({ homedir: () => join(import.meta.dirname) }));

import { clearMemCache, isCompletePeriod, readCache, writeCache } from "../cache.js";

describe("cache", () => {
  beforeEach(() => {
    clearMemCache();
    if (existsSync(TEST_CACHE)) rmSync(TEST_CACHE, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_CACHE)) rmSync(TEST_CACHE, { recursive: true });
  });

  it("returns null when cache miss", () => {
    expect(readCache("btc_jpy", "1day", "2024")).toBeNull();
  });

  it("writes and reads cache", () => {
    const data = [{ open: 100, close: 105 }];
    writeCache("btc_jpy", "1day", "2024", data);
    expect(readCache("btc_jpy", "1day", "2024")).toEqual(data);
  });

  it("returns null on corrupted cache", () => {
    const dir = join(TEST_CACHE, "btc_jpy", "1day");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "2024.json"), "not json{{{");
    expect(readCache("btc_jpy", "1day", "2024")).toBeNull();
  });
});

describe("isCompletePeriod", () => {
  it("returns true for past year", () => {
    expect(isCompletePeriod("2020")).toBe(true);
  });

  it("returns false for current year", () => {
    const year = String(new Date().getFullYear());
    expect(isCompletePeriod(year)).toBe(false);
  });

  it("returns true for past date", () => {
    expect(isCompletePeriod("20200101")).toBe(true);
  });

  it("returns false for today", () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    expect(isCompletePeriod(`${y}${m}${d}`)).toBe(false);
  });
});

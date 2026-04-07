import { afterEach, describe, expect, it } from "vitest";
import { loadCredentials } from "../../../auth.js";

const hadOrigKey = "BITBANK_API_KEY" in process.env;
const hadOrigSecret = "BITBANK_API_SECRET" in process.env;
const origKey = process.env.BITBANK_API_KEY;
const origSecret = process.env.BITBANK_API_SECRET;

afterEach(() => {
  if (hadOrigKey) process.env.BITBANK_API_KEY = origKey ?? "";
  // biome-ignore lint/performance/noDelete: process.env requires delete
  else delete process.env.BITBANK_API_KEY;
  if (hadOrigSecret) process.env.BITBANK_API_SECRET = origSecret ?? "";
  // biome-ignore lint/performance/noDelete: process.env requires delete
  else delete process.env.BITBANK_API_SECRET;
});

describe("Chaos A-01: API_KEY only (no SECRET)", () => {
  it("returns error object", () => {
    process.env.BITBANK_API_KEY = "some-key";
    // biome-ignore lint/performance/noDelete: process.env requires delete
    delete process.env.BITBANK_API_SECRET;
    const r = loadCredentials();
    expect("error" in r).toBe(true);
    if ("error" in r) {
      expect(r.error).toContain("BITBANK_API_SECRET");
    }
  });

  it("SECRET only (no KEY) also returns error", () => {
    // biome-ignore lint/performance/noDelete: process.env requires delete
    delete process.env.BITBANK_API_KEY;
    process.env.BITBANK_API_SECRET = "some-secret";
    const r = loadCredentials();
    expect("error" in r).toBe(true);
  });
});

describe("Chaos A-02: both env vars are empty strings", () => {
  it("returns error when both are empty", () => {
    process.env.BITBANK_API_KEY = "";
    process.env.BITBANK_API_SECRET = "";
    const r = loadCredentials();
    expect("error" in r).toBe(true);
  });

  it("returns error when KEY is empty, SECRET is set", () => {
    process.env.BITBANK_API_KEY = "";
    process.env.BITBANK_API_SECRET = "valid-secret";
    const r = loadCredentials();
    expect("error" in r).toBe(true);
  });
});

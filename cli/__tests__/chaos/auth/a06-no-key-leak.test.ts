import { describe, expect, it } from "vitest";
import { privatePost } from "../../../http-private-post.js";
import { privateGet } from "../../../http-private.js";
import { mockFetchRaw } from "../../test-helpers.js";

const SECRET_KEY = "super_secret_api_key_12345";
const SECRET_SECRET = "ultra_secret_api_secret_67890";
const CREDS = { apiKey: SECRET_KEY, apiSecret: SECRET_SECRET };
const AUTH_ERROR = { success: 0, data: { code: 20001 } };

describe("Chaos A-06: API keys never leak in error messages", () => {
  it("privateGet error does not contain apiKey", async () => {
    const r = await privateGet("/user/assets", undefined, {
      fetch: mockFetchRaw(AUTH_ERROR),
      retries: 0,
      credentials: CREDS,
      nonce: "1",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error).not.toContain(SECRET_KEY);
      expect(r.error).not.toContain(SECRET_SECRET);
    }
  });

  it("privatePost error does not contain apiSecret", async () => {
    const r = await privatePost(
      "/user/spot/order",
      { pair: "btc_jpy" },
      {
        fetch: mockFetchRaw(AUTH_ERROR),
        retries: 0,
        credentials: CREDS,
        nonce: "1",
      },
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error).not.toContain(SECRET_KEY);
      expect(r.error).not.toContain(SECRET_SECRET);
    }
  });

  it("network error does not contain credentials", async () => {
    const failFetch: typeof globalThis.fetch = async () => {
      throw new Error("ECONNREFUSED");
    };
    const r = await privateGet("/user/assets", undefined, {
      fetch: failFetch,
      retries: 0,
      credentials: CREDS,
      nonce: "1",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error).not.toContain(SECRET_KEY);
      expect(r.error).not.toContain(SECRET_SECRET);
    }
  });

  it("loadCredentials error message mentions env var names, not values", async () => {
    const { loadCredentials } = await import("../../../auth.js");
    const origKey = process.env.BITBANK_API_KEY;
    // biome-ignore lint/performance/noDelete: process.env requires delete
    delete process.env.BITBANK_API_KEY;
    // biome-ignore lint/performance/noDelete: process.env requires delete
    delete process.env.BITBANK_API_SECRET;
    const r = loadCredentials();
    if (origKey) process.env.BITBANK_API_KEY = origKey;
    expect("error" in r).toBe(true);
    if ("error" in r) {
      expect(r.error).toContain("BITBANK_API_KEY");
      expect(r.error).toContain("BITBANK_API_SECRET");
    }
  });
});

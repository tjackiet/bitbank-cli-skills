import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { signGet, signPost, authHeadersGet, authHeadersPost, loadCredentials } from "../auth.js";
import { createHmac } from "node:crypto";

describe("signGet", () => {
  it("generates correct HMAC-SHA256 for GET requests", () => {
    const nonce = "1234567890";
    const path = "/user/assets";
    const qs = "";
    const secret = "test_secret";
    const expected = createHmac("sha256", secret)
      .update(nonce + "/v1" + path + qs)
      .digest("hex");
    expect(signGet(nonce, path, qs, secret)).toBe(expected);
  });

  it("includes query string in signature", () => {
    const nonce = "1234567890";
    const path = "/user/spot/order";
    const qs = "?pair=btc_jpy&order_id=123";
    const secret = "test_secret";
    const expected = createHmac("sha256", secret)
      .update(nonce + "/v1" + path + qs)
      .digest("hex");
    expect(signGet(nonce, path, qs, secret)).toBe(expected);
  });
});

describe("signPost", () => {
  it("generates correct HMAC-SHA256 for POST requests", () => {
    const nonce = "1234567890";
    const body = JSON.stringify({ pair: "btc_jpy", order_ids: [1, 2] });
    const secret = "test_secret";
    const expected = createHmac("sha256", secret)
      .update(nonce + body)
      .digest("hex");
    expect(signPost(nonce, body, secret)).toBe(expected);
  });
});

describe("authHeadersGet", () => {
  it("returns all required headers", () => {
    const creds = { apiKey: "key123", apiSecret: "secret456" };
    const headers = authHeadersGet(creds, "/user/assets", "", "9999");
    expect(headers["ACCESS-KEY"]).toBe("key123");
    expect(headers["ACCESS-NONCE"]).toBe("9999");
    expect(headers["ACCESS-TIME-WINDOW"]).toBe("5000");
    expect(headers["ACCESS-SIGNATURE"]).toBeTruthy();
  });
});

describe("authHeadersPost", () => {
  it("returns all required headers with Content-Type", () => {
    const creds = { apiKey: "key123", apiSecret: "secret456" };
    const headers = authHeadersPost(creds, '{"pair":"btc_jpy"}', "9999");
    expect(headers["ACCESS-KEY"]).toBe("key123");
    expect(headers["ACCESS-NONCE"]).toBe("9999");
    expect(headers["ACCESS-SIGNATURE"]).toBeTruthy();
    expect(headers["Content-Type"]).toBe("application/json");
  });
});

describe("loadCredentials", () => {
  const origKey = process.env.BITBANK_API_KEY;
  const origSecret = process.env.BITBANK_API_SECRET;

  afterEach(() => {
    if (origKey) process.env.BITBANK_API_KEY = origKey;
    else delete process.env.BITBANK_API_KEY;
    if (origSecret) process.env.BITBANK_API_SECRET = origSecret;
    else delete process.env.BITBANK_API_SECRET;
  });

  it("returns error when keys are missing", () => {
    delete process.env.BITBANK_API_KEY;
    delete process.env.BITBANK_API_SECRET;
    const result = loadCredentials();
    expect("error" in result).toBe(true);
  });

  it("returns credentials when keys are set", () => {
    process.env.BITBANK_API_KEY = "mykey";
    process.env.BITBANK_API_SECRET = "mysecret";
    const result = loadCredentials();
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.apiKey).toBe("mykey");
      expect(result.apiSecret).toBe("mysecret");
    }
  });
});

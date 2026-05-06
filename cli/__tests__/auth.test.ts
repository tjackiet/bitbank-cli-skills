import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { authHeadersGet, authHeadersPost, signGet, signPost } from "../auth.js";

describe("signGet", () => {
  it("generates correct HMAC-SHA256 for GET requests", () => {
    const nonce = "1234567890";
    const path = "/user/assets";
    const qs = "";
    const secret = "test_secret";
    const expected = createHmac("sha256", secret).update(`${nonce}/v1${path}${qs}`).digest("hex");
    expect(signGet(nonce, path, qs, secret)).toBe(expected);
  });

  it("includes query string in signature", () => {
    const nonce = "1234567890";
    const path = "/user/spot/order";
    const qs = "?pair=btc_jpy&order_id=123";
    const secret = "test_secret";
    const expected = createHmac("sha256", secret).update(`${nonce}/v1${path}${qs}`).digest("hex");
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

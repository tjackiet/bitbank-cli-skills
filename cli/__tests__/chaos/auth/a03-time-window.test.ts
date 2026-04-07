import { describe, expect, it } from "vitest";
import { authHeadersGet, authHeadersPost } from "../../../auth.js";

const CREDS = { apiKey: "key", apiSecret: "secret" };

describe("Chaos A-03: ACCESS-TIME-WINDOW is always 5000ms", () => {
  it("GET headers include TIME-WINDOW=5000", () => {
    const h = authHeadersGet(CREDS, "/user/assets", "", "12345");
    expect(h["ACCESS-TIME-WINDOW"]).toBe("5000");
  });

  it("POST headers include TIME-WINDOW=5000", () => {
    const h = authHeadersPost(CREDS, '{"pair":"btc_jpy"}', "12345");
    expect(h["ACCESS-TIME-WINDOW"]).toBe("5000");
  });

  it("nonce is passed through and not altered", () => {
    const nonce = "9999999999999";
    const h = authHeadersGet(CREDS, "/user/assets", "", nonce);
    expect(h["ACCESS-NONCE"]).toBe(nonce);
  });
});

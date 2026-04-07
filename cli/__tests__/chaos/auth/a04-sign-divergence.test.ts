import { describe, expect, it } from "vitest";
import { signGet, signPost } from "../../../auth.js";

const SECRET = "shared_secret";
const NONCE = "1234567890";

describe("Chaos A-04: signGet vs signPost produce different signatures", () => {
  it("same nonce, different signing input → different sigs", () => {
    const body = JSON.stringify({ pair: "btc_jpy", order_id: 1 });
    const sigGet = signGet(NONCE, "/user/spot/order", "?pair=btc_jpy", SECRET);
    const sigPost = signPost(NONCE, body, SECRET);
    expect(sigGet).not.toBe(sigPost);
  });

  it("GET: path change produces different signature", () => {
    const sig1 = signGet(NONCE, "/user/assets", "", SECRET);
    const sig2 = signGet(NONCE, "/user/spot/order", "", SECRET);
    expect(sig1).not.toBe(sig2);
  });

  it("GET: query string change produces different signature", () => {
    const sig1 = signGet(NONCE, "/user/assets", "", SECRET);
    const sig2 = signGet(NONCE, "/user/assets", "?pair=btc_jpy", SECRET);
    expect(sig1).not.toBe(sig2);
  });

  it("POST: body change produces different signature", () => {
    const sig1 = signPost(NONCE, '{"pair":"btc_jpy"}', SECRET);
    const sig2 = signPost(NONCE, '{"pair":"eth_jpy"}', SECRET);
    expect(sig1).not.toBe(sig2);
  });

  it("different nonce produces different signature", () => {
    const sig1 = signGet("1111", "/user/assets", "", SECRET);
    const sig2 = signGet("2222", "/user/assets", "", SECRET);
    expect(sig1).not.toBe(sig2);
  });

  it("signatures are 64-char hex strings", () => {
    const sig = signGet(NONCE, "/user/assets", "", SECRET);
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });
});

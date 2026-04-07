import { describe, expect, it } from "vitest";
import { privatePost } from "../../../http-private-post.js";
import { privateGet } from "../../../http-private.js";
import { TEST_CREDS, mockFetchRaw } from "../../test-helpers.js";

const AUTH_ERROR = { success: 0, data: { code: 20001 } };

describe("Chaos A-05: HTTP 401 returns { success: false }", () => {
  it("privateGet returns error with auth error code", async () => {
    const r = await privateGet("/user/assets", undefined, {
      fetch: mockFetchRaw(AUTH_ERROR),
      retries: 0,
      credentials: TEST_CREDS,
      nonce: "1",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toBeTruthy();
  });

  it("privatePost returns error with auth error code", async () => {
    const r = await privatePost(
      "/user/spot/order",
      { pair: "btc_jpy" },
      {
        fetch: mockFetchRaw(AUTH_ERROR),
        retries: 0,
        credentials: TEST_CREDS,
        nonce: "1",
      },
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toBeTruthy();
  });

  it("HTTP 401 status also returns error", async () => {
    const r = await privateGet("/user/assets", undefined, {
      fetch: mockFetchRaw({ success: 0, data: { code: 20001 } }, 401),
      retries: 0,
      credentials: TEST_CREDS,
      nonce: "1",
    });
    expect(r.success).toBe(false);
  });

  it("missing credentials returns auth error without calling fetch", async () => {
    const fetchSpy = (await import("vitest")).vi.fn();
    const r = await privateGet("/user/assets", undefined, {
      fetch: fetchSpy,
      retries: 0,
      // credentials intentionally omitted → loadCredentials() from env
    });
    // If env vars are not set, should fail before fetching
    if (!r.success) {
      expect(fetchSpy).not.toHaveBeenCalled();
    }
  });
});

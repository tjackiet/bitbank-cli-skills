import { describe, expect, it, vi } from "vitest";
import { EXIT } from "../exit-codes.js";
import {
  ERROR_CODES,
  apiErrorExitCode,
  fetchWithRetry,
  formatApiError,
  retryDelay,
  shouldRetry,
} from "../http-core.js";

describe("ERROR_CODES", () => {
  it("maps known codes", () => {
    expect(ERROR_CODES[20001]).toBe("API認証失敗");
    expect(ERROR_CODES[60001]).toBe("レート制限");
  });
});

describe("apiErrorExitCode", () => {
  it("returns AUTH for 20001-20003", () => {
    expect(apiErrorExitCode(20001)).toBe(EXIT.AUTH);
    expect(apiErrorExitCode(20002)).toBe(EXIT.AUTH);
    expect(apiErrorExitCode(20003)).toBe(EXIT.AUTH);
  });

  it("returns RATE_LIMIT for 60001", () => {
    expect(apiErrorExitCode(60001)).toBe(EXIT.RATE_LIMIT);
  });

  it("returns PARAM for 30001-40001", () => {
    expect(apiErrorExitCode(30001)).toBe(EXIT.PARAM);
    expect(apiErrorExitCode(40001)).toBe(EXIT.PARAM);
  });

  it("returns GENERAL for unknown codes", () => {
    expect(apiErrorExitCode(99999)).toBe(EXIT.GENERAL);
  });
});

describe("formatApiError", () => {
  it("formats known error code with message", () => {
    expect(formatApiError(20001)).toBe("20001: API認証失敗");
  });

  it("formats unknown error code", () => {
    expect(formatApiError(12345)).toBe("API error: 12345");
  });
});

describe("shouldRetry", () => {
  it("retries on 429", () => expect(shouldRetry(429)).toBe(true));
  it("retries on 500", () => expect(shouldRetry(500)).toBe(true));
  it("retries on 503", () => expect(shouldRetry(503)).toBe(true));
  it("does not retry on 400", () => expect(shouldRetry(400)).toBe(false));
  it("does not retry on 200", () => expect(shouldRetry(200)).toBe(false));
});

describe("retryDelay", () => {
  it("uses Retry-After header on 429", async () => {
    vi.useFakeTimers();
    const headers = new Headers({ "Retry-After": "1" });
    const res = new Response("", { status: 429, headers });
    let done = false;
    const p = retryDelay(res, 1).then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await p;
    expect(done).toBe(true);
    vi.useRealTimers();
  });

  it("uses exponential backoff when no Retry-After", async () => {
    vi.useFakeTimers();
    let done = false;
    const p = retryDelay(null, 2).then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(1999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await p;
    expect(done).toBe(true);
    vi.useRealTimers();
  });

  it("uses Retry-After HTTP-date header on 429", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
    const headers = new Headers({ "Retry-After": "Wed, 01 Jan 2025 00:00:03 GMT" });
    const res = new Response("", { status: 429, headers });
    let done = false;
    const p = retryDelay(res, 1).then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(2999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await p;
    expect(done).toBe(true);
    vi.useRealTimers();
  });

  it("falls back to exponential backoff on invalid Retry-After", async () => {
    vi.useFakeTimers();
    const headers = new Headers({ "Retry-After": "garbage" });
    const res = new Response("", { status: 429, headers });
    let done = false;
    const p = retryDelay(res, 2).then(() => {
      done = true;
    }); // 2^2 * 500 = 2000ms
    await vi.advanceTimersByTimeAsync(1999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await p;
    expect(done).toBe(true);
    vi.useRealTimers();
  });

  it("falls back on negative Retry-After", async () => {
    vi.useFakeTimers();
    const headers = new Headers({ "Retry-After": "-1" });
    const res = new Response("", { status: 429, headers });
    let done = false;
    const p = retryDelay(res, 1).then(() => {
      done = true;
    }); // fallback: 2^1 * 500 = 1000ms
    await vi.advanceTimersByTimeAsync(999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await p;
    expect(done).toBe(true);
    vi.useRealTimers();
  });

  it("clamps to 0 when Retry-After HTTP-date is in the past", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
    const headers = new Headers({ "Retry-After": "Wed, 31 Dec 2024 23:59:57 GMT" });
    const res = new Response("", { status: 429, headers });
    const p = retryDelay(res, 1);
    await vi.advanceTimersByTimeAsync(0);
    await p;
    vi.useRealTimers();
  });
});

describe("fetchWithRetry", () => {
  const parseError = (body: { data?: { code?: number } }) => String(body.data?.code ?? "unknown");

  it("returns data on success", async () => {
    const fetch = async () => new Response(JSON.stringify({ success: 1, data: { ok: true } }));
    const result = await fetchWithRetry<{ ok: boolean }>(
      "http://test",
      {},
      { fetch: fetch as typeof globalThis.fetch, retries: 0 },
      parseError,
    );
    expect(result).toMatchObject({ success: true, data: { ok: true } });
  });

  it("returns error on API failure", async () => {
    const fetch = async () => new Response(JSON.stringify({ success: 0, data: { code: 20001 } }));
    const result = await fetchWithRetry(
      "http://test",
      {},
      { fetch: fetch as typeof globalThis.fetch, retries: 0 },
      parseError,
    );
    expect(result).toMatchObject({ success: false, exitCode: EXIT.AUTH });
  });

  it("returns error on HTTP failure", async () => {
    const fetch = async () => new Response("", { status: 400, statusText: "Bad Request" });
    const result = await fetchWithRetry(
      "http://test",
      {},
      { fetch: fetch as typeof globalThis.fetch, retries: 0 },
      parseError,
    );
    expect(result).toMatchObject({ success: false, error: "HTTP 400: Bad Request" });
  });

  it("returns NETWORK exit code on exception", async () => {
    const fetch = async () => {
      throw new Error("connection refused");
    };
    const result = await fetchWithRetry(
      "http://test",
      {},
      { fetch: fetch as typeof globalThis.fetch, retries: 0 },
      parseError,
    );
    expect(result).toMatchObject({ success: false, exitCode: EXIT.NETWORK });
  });

  it("retryOnNetworkError: false breaks loop on network exception", async () => {
    let calls = 0;
    const fetch: typeof globalThis.fetch = async () => {
      calls++;
      throw new Error("ECONNRESET");
    };
    const result = await fetchWithRetry(
      "http://test",
      {},
      { fetch, retries: 5, retryOnNetworkError: false },
      parseError,
    );
    expect(result).toMatchObject({ success: false, exitCode: EXIT.NETWORK });
    expect(calls).toBe(1);
  });
});

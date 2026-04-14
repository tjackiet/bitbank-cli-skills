import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectBucket, resetThrottle, updateRateLimit, waitForSlot } from "../throttle.js";

describe("detectBucket", () => {
  it("returns 'public' for public API URLs", () => {
    expect(detectBucket("https://public.bitbank.cc/btc_jpy/ticker")).toBe("public");
  });

  it("returns 'private' for private API URLs", () => {
    expect(detectBucket("https://api.bitbank.cc/v1/user/assets")).toBe("private");
  });
});

describe("waitForSlot", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetThrottle();
  });
  afterEach(() => vi.useRealTimers());

  it("returns immediately on first call", async () => {
    await waitForSlot("public");
  });

  it("waits for minimum interval between public requests", async () => {
    vi.setSystemTime(1000);
    await waitForSlot("public");

    let resolved = false;
    const p = waitForSlot("public").then(() => {
      resolved = true;
    });
    await vi.advanceTimersByTimeAsync(99);
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await p;
    expect(resolved).toBe(true);
  });

  it("skips throttle for private bucket by default", async () => {
    vi.setSystemTime(1000);
    await waitForSlot("private");
    await waitForSlot("private"); // should not block
  });

  it("respects custom throttleMs override", async () => {
    vi.setSystemTime(1000);
    await waitForSlot("public", 200);

    let resolved = false;
    const p = waitForSlot("public", 200).then(() => {
      resolved = true;
    });
    await vi.advanceTimersByTimeAsync(199);
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await p;
    expect(resolved).toBe(true);
  });

  it("throttleMs=0 disables time-based throttle", async () => {
    vi.setSystemTime(1000);
    await waitForSlot("public", 0);
    await waitForSlot("public", 0); // should not block
  });

  it("waits until reset when remaining is below low water mark", async () => {
    vi.setSystemTime(1000);
    updateRateLimit("public", { remaining: 2, limit: 100, reset: 2 });

    let resolved = false;
    const p = waitForSlot("public").then(() => {
      resolved = true;
    });
    await vi.advanceTimersByTimeAsync(999);
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await p;
    expect(resolved).toBe(true);
  });

  it("clears rateLimit state after waiting for reset", async () => {
    vi.setSystemTime(1000);
    updateRateLimit("public", { remaining: 1, limit: 100, reset: 2 });

    // First call waits until reset (1000ms), then clears rateLimit
    const p1 = waitForSlot("public", 0);
    await vi.advanceTimersByTimeAsync(1000);
    await p1;
    // Second call should not wait for reset again (state cleared)
    await waitForSlot("public", 0);
  });

  it("does not wait when remaining is above low water mark", async () => {
    vi.setSystemTime(1000);
    updateRateLimit("public", { remaining: 50, limit: 100, reset: 999 });
    await waitForSlot("public"); // should not block on remaining
  });

  it("buckets are independent", async () => {
    vi.setSystemTime(1000);
    await waitForSlot("public");
    // Private bucket is unaffected by public's lastRequestMs
    await waitForSlot("private");
  });
});

describe("resetThrottle", () => {
  it("clears all state", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    await waitForSlot("public");
    resetThrottle();
    // After reset, should not wait
    await waitForSlot("public");
    vi.useRealTimers();
  });
});

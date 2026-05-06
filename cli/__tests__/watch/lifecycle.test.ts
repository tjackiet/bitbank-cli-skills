import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type LifecycleReason, setupLifecycle } from "../../watch/lifecycle.js";

describe("setupLifecycle", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    process.removeAllListeners("SIGINT");
    process.removeAllListeners("SIGTERM");
  });

  it("fires duration timer", () => {
    const reasons: LifecycleReason[] = [];
    const h = setupLifecycle({ duration: 5, onStop: (r) => reasons.push(r) });
    vi.advanceTimersByTime(5000);
    expect(reasons).toEqual(["duration"]);
    h.teardown();
  });

  it("noteEvent triggers count stop and returns true at threshold", () => {
    const reasons: LifecycleReason[] = [];
    const h = setupLifecycle({ count: 3, onStop: (r) => reasons.push(r) });
    expect(h.noteEvent()).toBe(false);
    expect(h.noteEvent()).toBe(false);
    expect(h.noteEvent()).toBe(true);
    expect(reasons).toEqual(["count"]);
    h.teardown();
  });

  it("SIGINT triggers SIGINT reason", () => {
    const reasons: LifecycleReason[] = [];
    const h = setupLifecycle({ onStop: (r) => reasons.push(r) });
    process.emit("SIGINT");
    expect(reasons).toEqual(["SIGINT"]);
    h.teardown();
  });

  it("only stops once", () => {
    const reasons: LifecycleReason[] = [];
    const h = setupLifecycle({ count: 1, onStop: (r) => reasons.push(r) });
    h.noteEvent();
    h.fail("max-retries");
    process.emit("SIGINT");
    expect(reasons).toEqual(["count"]);
    h.teardown();
  });

  it("teardown removes signal listeners", () => {
    const before = process.listenerCount("SIGINT");
    const h = setupLifecycle({ onStop: () => {} });
    expect(process.listenerCount("SIGINT")).toBe(before + 1);
    h.teardown();
    expect(process.listenerCount("SIGINT")).toBe(before);
  });
});

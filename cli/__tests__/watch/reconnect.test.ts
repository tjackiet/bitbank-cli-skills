// 100行超: 指数バックオフ再接続の境界を網羅
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { backoffSeconds, createReconnect } from "../../watch/reconnect.js";

describe("backoffSeconds", () => {
  it("produces 1, 2, 4, 8, 16, 32, 32 capped at 32", () => {
    const seq = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => backoffSeconds(n, 32));
    expect(seq).toEqual([1, 2, 4, 8, 16, 32, 32, 32]);
  });

  it("respects custom cap", () => {
    expect(backoffSeconds(10, 4)).toBe(4);
  });

  it("returns 0 for retry < 1", () => {
    expect(backoffSeconds(0, 32)).toBe(0);
  });
});

describe("createReconnect", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function buildHarness(overrides: Partial<Parameters<typeof createReconnect>[0]> = {}) {
    const events: string[] = [];
    const stops: Array<() => void> = [];
    let connections = 0;
    const ctrl = createReconnect({
      maxRetries: 3,
      backoffCap: 32,
      idleTimeout: 30,
      startConnection: () => {
        connections++;
        const stop = vi.fn();
        stops.push(stop);
        return { stop };
      },
      onAttempt: (n, w) => events.push(`attempt:${n}:${w}`),
      onConnected: () => events.push("connected"),
      onLost: (r) => events.push(`lost:${r}`),
      onIdle: () => events.push("idle"),
      onMaxRetries: (n) => events.push(`max:${n}`),
      ...overrides,
    });
    return { ctrl, events, stops, getConnections: () => connections };
  }

  it("connects immediately on start", () => {
    const { ctrl, getConnections } = buildHarness();
    ctrl.start();
    expect(getConnections()).toBe(1);
  });

  it("schedules reconnect with exponential backoff", () => {
    const { ctrl, events } = buildHarness();
    ctrl.start();
    ctrl.noteDisconnect("test");
    expect(events).toContain("lost:test");
    expect(events).toContain("attempt:1:1");
    ctrl.noteDisconnect("test");
    expect(events).toContain("attempt:2:2");
  });

  it("reconnect actually fires after backoff time", () => {
    const { ctrl, getConnections } = buildHarness();
    ctrl.start();
    ctrl.noteDisconnect("dc");
    vi.advanceTimersByTime(1000);
    expect(getConnections()).toBe(2);
  });

  it("max-retries triggers onMaxRetries", () => {
    const { ctrl, events } = buildHarness({ maxRetries: 2 });
    ctrl.start();
    ctrl.noteDisconnect("dc");
    vi.advanceTimersByTime(1000);
    ctrl.noteDisconnect("dc");
    vi.advanceTimersByTime(2000);
    ctrl.noteDisconnect("dc");
    expect(events.filter((e) => e.startsWith("max:"))).toEqual(["max:2"]);
  });

  it("noteConnected resets retry counter", () => {
    const { ctrl, events } = buildHarness();
    ctrl.start();
    ctrl.noteDisconnect("dc");
    vi.advanceTimersByTime(1000);
    ctrl.noteConnected();
    ctrl.noteDisconnect("dc");
    expect(events.filter((e) => e.startsWith("attempt:")).at(-1)).toBe("attempt:1:1");
  });

  it("idle timeout fires after idleTimeout seconds and stops active connection", () => {
    const { ctrl, events, stops } = buildHarness({ idleTimeout: 5 });
    ctrl.start();
    ctrl.noteConnected();
    vi.advanceTimersByTime(5000);
    expect(events).toContain("idle");
    expect(stops[0]).toHaveBeenCalled();
  });

  it("noteEvent rearms idle timer", () => {
    const { ctrl, events } = buildHarness({ idleTimeout: 5 });
    ctrl.start();
    ctrl.noteConnected();
    vi.advanceTimersByTime(4000);
    ctrl.noteEvent();
    vi.advanceTimersByTime(4000);
    expect(events).not.toContain("idle");
    vi.advanceTimersByTime(2000);
    expect(events).toContain("idle");
  });

  it("stop() cancels scheduled reconnect", () => {
    const { ctrl, getConnections } = buildHarness();
    ctrl.start();
    ctrl.noteDisconnect("dc");
    ctrl.stop();
    vi.advanceTimersByTime(10000);
    expect(getConnections()).toBe(1);
  });
});

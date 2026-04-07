import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
};
vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket),
}));
vi.mock("../../../commands/stream/format.js", () => ({
  writeStreamMessage: vi.fn(),
}));

import { startPublicStream } from "../../../commands/stream/public.js";

beforeEach(() => vi.clearAllMocks());

describe("Chaos W-03: server disconnect handling", () => {
  it("disconnect event writes reason to stderr", () => {
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    startPublicStream({ pair: "btc_jpy", format: "json" });

    const disconnectCb = mockSocket.on.mock.calls.find((c) => c[0] === "disconnect")?.[1];
    expect(disconnectCb).toBeDefined();
    disconnectCb?.("transport close");

    const out = stderrSpy.mock.calls.map((c) => c[0]).join("");
    expect(out).toContain("Disconnected");
    expect(out).toContain("transport close");
    stderrSpy.mockRestore();
  });

  it("connect_error event writes error to stderr", () => {
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    startPublicStream({ pair: "btc_jpy", format: "json" });

    const errorCb = mockSocket.on.mock.calls.find((c) => c[0] === "connect_error")?.[1];
    expect(errorCb).toBeDefined();
    errorCb?.(new Error("ECONNREFUSED"));

    const out = stderrSpy.mock.calls.map((c) => c[0]).join("");
    expect(out).toContain("Connection error");
    expect(out).toContain("ECONNREFUSED");
    stderrSpy.mockRestore();
  });

  it("stop() calls disconnect after leaving rooms", () => {
    const r = startPublicStream({ pair: "btc_jpy", channels: ["ticker"], format: "json" });
    expect(r.success).toBe(true);
    if (r.success) {
      r.data.stop();
      expect(mockSocket.emit).toHaveBeenCalledWith("leave-room", "ticker_btc_jpy");
      expect(mockSocket.disconnect).toHaveBeenCalled();
    }
  });
});

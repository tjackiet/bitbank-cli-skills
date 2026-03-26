import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock socket.io-client before importing the module
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
};
vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket),
}));

// Mock stream-format
vi.mock("../../commands/stream/format.js", () => ({
  writeStreamMessage: vi.fn(),
}));

import { writeStreamMessage } from "../../commands/stream/format.js";
import { startPublicStream } from "../../commands/stream/public.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("startPublicStream", () => {
  it("returns error for invalid channel", () => {
    const result = startPublicStream({ pair: "btc_jpy", channels: ["bad"], format: "json" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Unknown channel");
  });

  it("subscribes to default channels", () => {
    const result = startPublicStream({ pair: "btc_jpy", format: "json" });
    expect(result.success).toBe(true);

    // Simulate connect
    const connectCb = mockSocket.on.mock.calls.find((c) => c[0] === "connect")?.[1];
    connectCb?.();
    expect(mockSocket.emit).toHaveBeenCalledWith("join-room", "ticker_btc_jpy");
    expect(mockSocket.emit).toHaveBeenCalledWith("join-room", "transactions_btc_jpy");
    expect(mockSocket.emit).toHaveBeenCalledWith("join-room", "depth_diff_btc_jpy");
  });

  it("subscribes to specified channels only", () => {
    startPublicStream({ pair: "eth_jpy", channels: ["ticker"], format: "table" });
    const connectCb = mockSocket.on.mock.calls.find((c) => c[0] === "connect")?.[1];
    connectCb?.();
    expect(mockSocket.emit).toHaveBeenCalledWith("join-room", "ticker_eth_jpy");
    expect(mockSocket.emit).toHaveBeenCalledTimes(1);
  });

  it("forwards messages to writeStreamMessage", () => {
    startPublicStream({ pair: "btc_jpy", format: "json" });
    const msgCb = mockSocket.on.mock.calls.find((c) => c[0] === "message")?.[1];
    msgCb?.({ room_name: "ticker_btc_jpy", message: { data: { last: "100" } } });
    expect(writeStreamMessage).toHaveBeenCalledWith(
      expect.objectContaining({ channel: "ticker_btc_jpy", data: { last: "100" } }),
      "json",
    );
  });

  it("stop() disconnects and leaves rooms", () => {
    const result = startPublicStream({ pair: "btc_jpy", channels: ["ticker"], format: "json" });
    if (result.success) {
      result.data.stop();
      expect(mockSocket.emit).toHaveBeenCalledWith("leave-room", "ticker_btc_jpy");
      expect(mockSocket.disconnect).toHaveBeenCalled();
    }
  });
});

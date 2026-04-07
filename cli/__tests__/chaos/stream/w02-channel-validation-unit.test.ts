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

describe("Chaos W-02 (unit): channel validation in startPublicStream", () => {
  it("rejects unknown channel with valid list", () => {
    const r = startPublicStream({ pair: "btc_jpy", channels: ["nonexistent"], format: "json" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error).toContain("nonexistent");
      expect(r.error).toContain("ticker");
      expect(r.error).toContain("depth_whole");
    }
  });

  it("rejects mix of valid and invalid channels", () => {
    const r = startPublicStream({
      pair: "btc_jpy",
      channels: ["ticker", "bad_channel"],
      format: "json",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("bad_channel");
  });

  it("accepts all valid channels", () => {
    const r = startPublicStream({
      pair: "btc_jpy",
      channels: ["ticker", "transactions", "depth_diff", "depth_whole", "circuit_break_info"],
      format: "json",
    });
    expect(r.success).toBe(true);
  });

  it("empty channels array uses defaults", () => {
    const r = startPublicStream({ pair: "btc_jpy", channels: [], format: "json" });
    // Empty array → no filter → defaults
    expect(r.success).toBe(true);
  });
});

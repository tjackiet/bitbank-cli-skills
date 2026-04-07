import { beforeEach, describe, expect, it, vi } from "vitest";

const mockStartPublic = vi.fn();
const mockStartPrivate = vi.fn();

vi.mock("../../../commands/stream/public.js", () => ({
  startPublicStream: (...args: unknown[]) => mockStartPublic(...args),
}));
vi.mock("../../../commands/stream/private.js", () => ({
  startPrivateStream: (...args: unknown[]) => mockStartPrivate(...args),
}));

import { streamCommand } from "../../../commands/stream/index.js";

beforeEach(() => {
  vi.clearAllMocks();
  mockStartPublic.mockReturnValue({ success: true, data: { stop: vi.fn() } });
  mockStartPrivate.mockResolvedValue({ success: true, data: { stop: vi.fn() } });
});

describe("Chaos W-01: stream with missing/invalid pair", () => {
  it("missing pair returns error for public stream", async () => {
    const r = await streamCommand({ isPrivate: false, format: "json" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("Pair is required");
  });

  it("empty pair returns error", async () => {
    const r = await streamCommand({ pair: "", isPrivate: false, format: "json" });
    expect(r.success).toBe(false);
  });

  it("private stream does not require pair", async () => {
    const r = await streamCommand({ isPrivate: true, format: "json" });
    expect(r.success).toBe(true);
  });
});

describe("Chaos W-02: stream with invalid channel", () => {
  it("invalid channel propagates error from startPublicStream", async () => {
    mockStartPublic.mockReturnValue({
      success: false,
      error:
        "Unknown channel(s): nonexistent. Valid: ticker, transactions, depth_diff, depth_whole, circuit_break_info",
    });
    const r = await streamCommand({
      pair: "btc_jpy",
      isPrivate: false,
      channel: "nonexistent",
      format: "json",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("Unknown channel");
  });

  it("channel string is CSV-parsed and trimmed", async () => {
    await streamCommand({
      pair: "btc_jpy",
      isPrivate: false,
      channel: " ticker , transactions ",
      format: "json",
    });
    expect(mockStartPublic).toHaveBeenCalledWith(
      expect.objectContaining({ channels: ["ticker", "transactions"] }),
    );
  });
});

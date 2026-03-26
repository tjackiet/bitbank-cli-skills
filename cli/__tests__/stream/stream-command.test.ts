import { beforeEach, describe, expect, it, vi } from "vitest";

const mockStartPublic = vi.fn();
const mockStartPrivate = vi.fn();

vi.mock("../../commands/stream/public.js", () => ({
  startPublicStream: (...args: unknown[]) => mockStartPublic(...args),
}));
vi.mock("../../commands/stream/private.js", () => ({
  startPrivateStream: (...args: unknown[]) => mockStartPrivate(...args),
}));

import { streamCommand } from "../../commands/stream/index.js";

beforeEach(() => {
  vi.clearAllMocks();
  mockStartPublic.mockReturnValue({ success: true, data: { stop: vi.fn() } });
  mockStartPrivate.mockResolvedValue({ success: true, data: { stop: vi.fn() } });
});

describe("streamCommand", () => {
  it("returns error when pair is missing for public stream", async () => {
    const result = await streamCommand({ isPrivate: false, format: "json" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Pair is required");
  });

  it("starts public stream with pair", async () => {
    const result = await streamCommand({ pair: "btc_jpy", isPrivate: false, format: "json" });
    expect(result.success).toBe(true);
    expect(mockStartPublic).toHaveBeenCalledWith(
      expect.objectContaining({ pair: "btc_jpy", format: "json" }),
    );
  });

  it("starts public stream with channel filter", async () => {
    await streamCommand({
      pair: "btc_jpy",
      isPrivate: false,
      channel: "ticker,transactions",
      format: "table",
    });
    expect(mockStartPublic).toHaveBeenCalledWith(
      expect.objectContaining({ channels: ["ticker", "transactions"] }),
    );
  });

  it("starts private stream", async () => {
    const result = await streamCommand({ isPrivate: true, format: "json" });
    expect(result.success).toBe(true);
    expect(mockStartPrivate).toHaveBeenCalledWith(expect.objectContaining({ format: "json" }));
  });

  it("passes filter to private stream", async () => {
    await streamCommand({ isPrivate: true, filter: "spot_trade,asset_update", format: "json" });
    expect(mockStartPrivate).toHaveBeenCalledWith(
      expect.objectContaining({ filter: ["spot_trade", "asset_update"] }),
    );
  });

  it("propagates error from public stream", async () => {
    mockStartPublic.mockReturnValue({ success: false, error: "bad channel" });
    const result = await streamCommand({ pair: "btc_jpy", isPrivate: false, format: "json" });
    expect(result.success).toBe(false);
  });

  it("propagates error from private stream", async () => {
    mockStartPrivate.mockResolvedValue({ success: false, error: "no creds" });
    const result = await streamCommand({ isPrivate: true, format: "json" });
    expect(result.success).toBe(false);
  });
});

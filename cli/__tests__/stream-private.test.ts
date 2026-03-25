import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock PubNub
const mockPubnub = {
  setToken: vi.fn(),
  addListener: vi.fn(),
  subscribe: vi.fn(),
  unsubscribeAll: vi.fn(),
};
vi.mock("pubnub", () => ({
  default: vi.fn(() => mockPubnub),
}));

vi.mock("../stream-format.js", () => ({
  writeStreamMessage: vi.fn(),
}));

// Mock privateGet
const mockPrivateGet = vi.fn();
vi.mock("../http-private.js", () => ({
  privateGet: (...args: unknown[]) => mockPrivateGet(...args),
}));

vi.mock("../auth.js", () => ({
  loadCredentials: () => ({ apiKey: "key", apiSecret: "secret" }),
}));

import { writeStreamMessage } from "../stream-format.js";
import { startPrivateStream } from "../stream-private.js";

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockPrivateGet.mockResolvedValue({
    success: true,
    data: { pubnub_channel: "ch_123", pubnub_token: "tok_abc" },
  });
});

describe("startPrivateStream", () => {
  it("returns error when subscribe API fails with auth error", async () => {
    mockPrivateGet.mockResolvedValueOnce({ success: false, error: "20001: API認証失敗" });
    const result = await startPrivateStream({
      format: "json",
      credentials: { apiKey: "k", apiSecret: "s" },
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("API認証失敗");
  });

  it("returns error when subscribe API fails", async () => {
    mockPrivateGet.mockResolvedValueOnce({ success: false, error: "auth failed" });
    const result = await startPrivateStream({
      format: "json",
      credentials: { apiKey: "k", apiSecret: "s" },
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("auth failed");
  });

  it("connects and subscribes to PubNub channel", async () => {
    const result = await startPrivateStream({
      format: "json",
      credentials: { apiKey: "k", apiSecret: "s" },
    });
    expect(result.success).toBe(true);
    expect(mockPubnub.setToken).toHaveBeenCalledWith("tok_abc");
    expect(mockPubnub.subscribe).toHaveBeenCalledWith({ channels: ["ch_123"] });
  });

  it("filters messages by event type", async () => {
    await startPrivateStream({
      format: "json",
      filter: ["spot_trade"],
      credentials: { apiKey: "k", apiSecret: "s" },
    });
    const listener = mockPubnub.addListener.mock.calls[0][0];

    // Matching event
    listener.message({ channel: "ch_123", message: { event_type: "spot_trade", price: "1" } });
    expect(writeStreamMessage).toHaveBeenCalledTimes(1);

    // Non-matching event
    listener.message({ channel: "ch_123", message: { event_type: "asset_update", free: "1" } });
    expect(writeStreamMessage).toHaveBeenCalledTimes(1);
  });

  it("stop() cleans up", async () => {
    const result = await startPrivateStream({
      format: "json",
      credentials: { apiKey: "k", apiSecret: "s" },
    });
    if (result.success) result.data.stop();
    expect(mockPubnub.unsubscribeAll).toHaveBeenCalled();
  });
});

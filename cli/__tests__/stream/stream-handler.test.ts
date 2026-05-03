import { beforeEach, describe, expect, it, vi } from "vitest";

const mockStreamCommand = vi.fn();
const mockOutput = vi.fn();

vi.mock("../../commands/stream/index.js", () => ({
  streamCommand: (...args: unknown[]) => mockStreamCommand(...args),
}));
vi.mock("../../output.js", () => ({
  output: (...args: unknown[]) => mockOutput(...args),
}));

import { streamCommands } from "../../commands/stream-handler.js";

const handler = streamCommands.stream.handler;

beforeEach(() => {
  vi.clearAllMocks();
  mockStreamCommand.mockResolvedValue({ success: true, data: undefined });
});

describe("stream-handler", () => {
  it("forwards pair, channel, filter to streamCommand", async () => {
    await handler(["btc_jpy"], { channel: "ticker", filter: "spot_trade", private: false }, "json");
    expect(mockStreamCommand).toHaveBeenCalledWith({
      pair: "btc_jpy",
      isPrivate: false,
      channel: "ticker",
      filter: "spot_trade",
      format: "json",
    });
    expect(mockOutput).not.toHaveBeenCalled();
  });

  it("downgrades csv format to json (stream is line-based)", async () => {
    await handler(["btc_jpy"], { private: false }, "csv");
    expect(mockStreamCommand).toHaveBeenCalledWith(expect.objectContaining({ format: "json" }));
  });

  it("preserves table format", async () => {
    await handler(["btc_jpy"], { private: false }, "table");
    expect(mockStreamCommand).toHaveBeenCalledWith(expect.objectContaining({ format: "table" }));
  });

  it("sets isPrivate when --private flag is true", async () => {
    await handler([], { private: true }, "json");
    expect(mockStreamCommand).toHaveBeenCalledWith(
      expect.objectContaining({ isPrivate: true, pair: undefined }),
    );
  });

  it("calls output() when streamCommand returns a failure", async () => {
    mockStreamCommand.mockResolvedValueOnce({ success: false, error: "no creds" });
    await handler([], { private: true }, "json");
    expect(mockOutput).toHaveBeenCalledWith({ success: false, error: "no creds" }, "json");
  });

  it("ignores non-string channel/filter values (boolean coerces to undefined)", async () => {
    await handler(["btc_jpy"], { private: false, channel: true, filter: undefined }, "json");
    expect(mockStreamCommand).toHaveBeenCalledWith(
      expect.objectContaining({ channel: undefined, filter: undefined }),
    );
  });
});

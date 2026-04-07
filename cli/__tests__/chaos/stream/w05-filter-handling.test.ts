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
  mockStartPrivate.mockResolvedValue({ success: true, data: { stop: vi.fn() } });
});

describe("Chaos W-05: filter handling for private streams", () => {
  it("filter string is CSV-parsed and trimmed", async () => {
    await streamCommand({
      isPrivate: true,
      filter: " spot_trade , asset_update ",
      format: "json",
    });
    expect(mockStartPrivate).toHaveBeenCalledWith(
      expect.objectContaining({ filter: ["spot_trade", "asset_update"] }),
    );
  });

  it("no filter passes undefined", async () => {
    await streamCommand({ isPrivate: true, format: "json" });
    expect(mockStartPrivate).toHaveBeenCalledWith(expect.objectContaining({ filter: undefined }));
  });

  it("csv format is coerced to json", async () => {
    await streamCommand({ isPrivate: true, format: "csv" as "json" });
    expect(mockStartPrivate).toHaveBeenCalledWith(expect.objectContaining({ format: "json" }));
  });
});

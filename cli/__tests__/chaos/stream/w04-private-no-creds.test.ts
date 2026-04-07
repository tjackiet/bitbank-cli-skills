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

beforeEach(() => vi.clearAllMocks());

describe("Chaos W-04: private stream without credentials", () => {
  it("propagates auth error from startPrivateStream", async () => {
    mockStartPrivate.mockResolvedValue({
      success: false,
      error: "BITBANK_API_KEY and BITBANK_API_SECRET must be set.",
    });
    const r = await streamCommand({ isPrivate: true, format: "json" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("BITBANK_API");
  });

  it("private stream error does not call startPublicStream", async () => {
    mockStartPrivate.mockResolvedValue({ success: false, error: "no creds" });
    await streamCommand({ isPrivate: true, format: "json" });
    expect(mockStartPublic).not.toHaveBeenCalled();
  });
});

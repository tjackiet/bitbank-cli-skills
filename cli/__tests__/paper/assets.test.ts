import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { paperAssets } from "../../commands/paper/assets.js";
import { paperInit } from "../../commands/paper/init.js";

let dir: string;
let statePath: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "paper-assets-"));
  statePath = join(dir, "paper-state.json");
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("paper assets", () => {
  it("returns balance rows after init", async () => {
    await paperInit({ jpy: "1000000", statePath });
    const r = await paperAssets({ statePath });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data).toEqual([{ asset: "jpy", total: 1000000, locked: 0, available: 1000000 }]);
  });

  it("returns Err when state is not initialized", async () => {
    const r = await paperAssets({ statePath });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("not initialized");
  });
});

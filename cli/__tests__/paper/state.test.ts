// 100行超: paper state 永続化の互換/移行を網羅
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type PaperState, loadState, saveState } from "../../paper-state.js";

const mockFlags = { renameThrows: false, writeThrows: false };

vi.mock("node:fs/promises", async () => {
  const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
  return {
    ...actual,
    rename: async (src: string, dst: string) => {
      if (mockFlags.renameThrows) throw new Error("simulated rename failure");
      return actual.rename(src, dst);
    },
    open: async (...args: Parameters<typeof actual.open>) => {
      const fh = await actual.open(...args);
      if (mockFlags.writeThrows) {
        fh.writeFile = async () => {
          throw new Error("simulated writeFile failure");
        };
      }
      return fh;
    },
  };
});

let dir: string;
let statePath: string;

function makeState(overrides: Partial<PaperState> = {}): PaperState {
  return {
    version: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    initialJpy: 1_000_000,
    balances: { jpy: 1_000_000 },
    history: [],
    lastTickAt: "2026-01-01T00:00:00.000Z",
    openOrders: [],
    ...overrides,
  };
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "paper-state-atomic-"));
  statePath = join(dir, "paper-state.json");
  mockFlags.renameThrows = false;
  mockFlags.writeThrows = false;
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("paper saveState atomic write", () => {
  it("round-trip: save → load returns the same state", async () => {
    const state = makeState({ initialJpy: 12345 });
    const w = await saveState(state, statePath);
    expect(w.success).toBe(true);
    const r = await loadState(statePath);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toEqual(state);
  });

  it("succeeds even when a stale .tmp file exists alongside target", async () => {
    writeFileSync(`${statePath}.99999.deadbeef.tmp`, "not valid json");
    const w = await saveState(makeState(), statePath);
    expect(w.success).toBe(true);
    const r = await loadState(statePath);
    expect(r.success).toBe(true);
    if (r.success && r.data) expect(r.data.version).toBe(2);
  });

  it("leaves target untouched when rename fails mid-write", async () => {
    const original = makeState({ initialJpy: 100 });
    await saveState(original, statePath);

    mockFlags.renameThrows = true;
    const w = await saveState(makeState({ initialJpy: 999 }), statePath);
    expect(w.success).toBe(false);

    const r = await loadState(statePath);
    expect(r.success).toBe(true);
    if (r.success && r.data) expect(r.data.initialJpy).toBe(100);

    const leftovers = readdirSync(dir).filter((f) => f.endsWith(".tmp"));
    expect(leftovers).toEqual([]);
  });

  it("leaves target untouched when writeFile fails mid-write", async () => {
    const original = makeState({ initialJpy: 200 });
    await saveState(original, statePath);

    mockFlags.writeThrows = true;
    const w = await saveState(makeState({ initialJpy: 888 }), statePath);
    expect(w.success).toBe(false);

    const raw = readFileSync(statePath, "utf-8");
    const parsed = JSON.parse(raw);
    expect(parsed.initialJpy).toBe(200);

    const leftovers = readdirSync(dir).filter((f) => f.endsWith(".tmp"));
    expect(leftovers).toEqual([]);
  });

  it("does not corrupt the target under concurrent saves", async () => {
    const a = makeState({ initialJpy: 111, updatedAt: "2026-02-01T00:00:00.000Z" });
    const b = makeState({ initialJpy: 222, updatedAt: "2026-02-02T00:00:00.000Z" });
    const results = await Promise.all([saveState(a, statePath), saveState(b, statePath)]);
    expect(results.every((r) => r.success)).toBe(true);

    const raw = readFileSync(statePath, "utf-8");
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe(2);
    expect([111, 222]).toContain(parsed.initialJpy);

    const r = await loadState(statePath);
    expect(r.success).toBe(true);
  });
});

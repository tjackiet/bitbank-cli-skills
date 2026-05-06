import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type TickerData,
  createJsonlWriter,
  createTableWriter,
  formatJsonl,
} from "../../watch/format.js";

const sample: TickerData = {
  ts: "2026-05-06T10:00:00.000Z",
  pair: "btc_jpy",
  last: "100",
  bid: "99",
  ask: "101",
  high: "110",
  low: "90",
  vol: "1.23",
};

describe("watch format", () => {
  let writes: string[] = [];
  let writeSpy: { mockRestore: () => void };

  beforeEach(() => {
    writes = [];
    writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(((chunk: unknown) => {
      writes.push(String(chunk));
      return true;
    }) as never);
  });

  afterEach(() => writeSpy.mockRestore());

  it("formatJsonl produces single-line JSON", () => {
    expect(formatJsonl(sample)).toBe(JSON.stringify(sample));
  });

  it("createJsonlWriter writes one line per ticker", () => {
    const w = createJsonlWriter();
    w(sample);
    expect(writes).toEqual([`${JSON.stringify(sample)}\n`]);
  });

  it("createTableWriter prints first row plain, then redraws with ANSI", () => {
    const w = createTableWriter();
    w(sample);
    w({ ...sample, last: "105" });
    expect(writes[0]).not.toContain("\x1b[");
    expect(writes[1]).toContain("\x1b[1A");
    expect(writes[1]).toContain("\x1b[2K\r");
    expect(writes[1]).toContain("last=105");
    expect(writes[1]).toContain("@10:00:00");
  });
});

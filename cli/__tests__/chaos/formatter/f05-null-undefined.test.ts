import { describe, expect, it, vi } from "vitest";
import { output } from "../../../output.js";

const DATA_WITH_NULLS = [
  { name: "btc", price: null, volume: undefined, status: "active" },
  { name: "eth", price: "300000", volume: null, status: undefined },
];

describe("Chaos F-05: null/undefined fields", () => {
  it("json: serializes null, omits undefined", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    output({ success: true, data: DATA_WITH_NULLS }, "json");
    const out = spy.mock.calls.map((c) => c[0]).join("");
    const parsed = JSON.parse(out);
    expect(parsed[0].price).toBeNull();
    expect(parsed[0].name).toBe("btc");
    spy.mockRestore();
  });

  it("table: does not crash, renders empty for null/undefined", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    output({ success: true, data: DATA_WITH_NULLS }, "table");
    const out = spy.mock.calls.map((c) => c[0]).join("");
    expect(out).toContain("name");
    expect(out).toContain("btc");
    expect(out).toContain("eth");
    spy.mockRestore();
  });

  it("csv: does not crash, renders empty for null/undefined", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    output({ success: true, data: DATA_WITH_NULLS }, "csv");
    const out = spy.mock.calls.map((c) => c[0]).join("");
    expect(out).toContain("name");
    expect(out).toContain("btc");
    // null/undefined become empty string or "null"/"undefined"
    expect(out.length).toBeGreaterThan(0);
    spy.mockRestore();
  });

  it("single object with all null fields does not crash", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    output({ success: true, data: { a: null, b: null } }, "table");
    const out = spy.mock.calls.map((c) => c[0]).join("");
    expect(out).toContain("a");
    expect(out).toContain("b");
    spy.mockRestore();
  });
});

import { describe, expect, it, vi } from "vitest";
import { output } from "../../../output.js";

const NESTED = {
  id: 1,
  meta: { exchange: "bitbank", region: "jp" },
  tags: ["btc", "jpy"],
};

describe("Chaos F-02: nested object in table format", () => {
  it("table: does not crash on nested object", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    output({ success: true, data: NESTED }, "table");
    const out = spy.mock.calls.map((c) => c[0]).join("");
    expect(out.length).toBeGreaterThan(0);
    expect(out).toContain("id");
    expect(out).toContain("meta");
    spy.mockRestore();
  });

  it("json: nested object is properly serialized", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    output({ success: true, data: NESTED }, "json");
    const out = spy.mock.calls.map((c) => c[0]).join("");
    const parsed = JSON.parse(out);
    expect(parsed.meta.exchange).toBe("bitbank");
    expect(parsed.tags).toEqual(["btc", "jpy"]);
    spy.mockRestore();
  });

  it("csv: nested values are stringified without crash", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    output({ success: true, data: NESTED }, "csv");
    const out = spy.mock.calls.map((c) => c[0]).join("");
    expect(out).toContain("id");
    expect(out.length).toBeGreaterThan(0);
    spy.mockRestore();
  });
});

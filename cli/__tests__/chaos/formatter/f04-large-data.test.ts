import { describe, expect, it, vi } from "vitest";
import { output } from "../../../output.js";

describe("Chaos F-04: large data (10000 rows)", () => {
  const bigData = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    price: String(5000000 + i),
    amount: "0.001",
  }));

  it("json: completes without memory error", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    output({ success: true, data: bigData }, "json");
    const out = spy.mock.calls.map((c) => c[0]).join("");
    const parsed = JSON.parse(out);
    expect(parsed.length).toBe(10000);
    spy.mockRestore();
  });

  it("table: completes without memory error", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    output({ success: true, data: bigData }, "table");
    const out = spy.mock.calls.map((c) => c[0]).join("");
    const lines = out.trim().split("\n");
    // header + separator + 10000 rows
    expect(lines.length).toBe(10002);
    spy.mockRestore();
  });

  it("csv: completes without memory error", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    output({ success: true, data: bigData }, "csv");
    const out = spy.mock.calls.map((c) => c[0]).join("");
    const lines = out.trim().split("\n");
    // header + 10000 rows
    expect(lines.length).toBe(10001);
    spy.mockRestore();
  });
});

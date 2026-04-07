import { describe, expect, it, vi } from "vitest";
import { output } from "../../../output.js";

describe("Chaos F-03: CSV special characters are escaped", () => {
  it("field with comma is quoted", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    output({ success: true, data: [{ name: "foo,bar", value: "1" }] }, "csv");
    const out = spy.mock.calls.map((c) => c[0]).join("");
    expect(out).toContain('"foo,bar"');
    spy.mockRestore();
  });

  it("field with double quote is escaped", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    output({ success: true, data: [{ name: 'say "hello"', value: "2" }] }, "csv");
    const out = spy.mock.calls.map((c) => c[0]).join("");
    expect(out).toContain('"say ""hello"""');
    spy.mockRestore();
  });

  it("field with newline is quoted", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    output({ success: true, data: [{ name: "line1\nline2", value: "3" }] }, "csv");
    const out = spy.mock.calls.map((c) => c[0]).join("");
    expect(out).toContain('"line1\nline2"');
    spy.mockRestore();
  });

  it("field without special chars is not quoted", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    output({ success: true, data: [{ name: "simple", value: "4" }] }, "csv");
    const out = spy.mock.calls.map((c) => c[0]).join("");
    const lines = out.trim().split("\n");
    expect(lines[1]).toBe("simple,4");
    spy.mockRestore();
  });
});

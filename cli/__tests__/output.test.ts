import { beforeEach, describe, expect, it, vi } from "vitest";
import { output } from "../output.js";

describe("output", () => {
  let stdout: string;
  let stderr: string;

  beforeEach(() => {
    stdout = "";
    stderr = "";
    vi.spyOn(process.stdout, "write").mockImplementation((s) => {
      stdout += s;
      return true;
    });
    vi.spyOn(process.stderr, "write").mockImplementation((s) => {
      stderr += s;
      return true;
    });
    process.exitCode = undefined;
  });

  it("outputs JSON format", () => {
    output({ success: true, data: { a: 1 } }, "json");
    expect(JSON.parse(stdout)).toEqual({ a: 1 });
  });

  it("outputs table format", () => {
    output({ success: true, data: { sell: 100, buy: 99 } }, "table");
    expect(stdout).toContain("sell");
    expect(stdout).toContain("100");
  });

  it("outputs CSV format", () => {
    output({ success: true, data: { sell: 100, buy: 99 } }, "csv");
    const lines = stdout.trim().split("\n");
    expect(lines[0]).toBe("sell,buy");
    expect(lines[1]).toBe("100,99");
  });

  it("outputs error to stderr", () => {
    output({ success: false, error: "fail" }, "json");
    expect(stderr).toContain("fail");
    expect(process.exitCode).toBe(1);
  });
});

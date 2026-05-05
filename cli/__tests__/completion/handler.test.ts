import { describe, expect, it, vi } from "vitest";
import { completionHandler } from "../../commands/completion/index.js";

describe("completionHandler", () => {
  it("prints bash script to stdout", async () => {
    const writes: string[] = [];
    const spy = vi.spyOn(process.stdout, "write").mockImplementation((c: unknown) => {
      writes.push(String(c));
      return true;
    });
    await completionHandler(["bash"], {}, "json");
    spy.mockRestore();
    expect(writes.join("")).toContain("complete -F _bitbank bitbank");
  });

  it("prints zsh script to stdout", async () => {
    const writes: string[] = [];
    const spy = vi.spyOn(process.stdout, "write").mockImplementation((c: unknown) => {
      writes.push(String(c));
      return true;
    });
    await completionHandler(["zsh"], {}, "json");
    spy.mockRestore();
    expect(writes.join("")).toContain("#compdef bitbank");
  });

  it("returns Err for unsupported shell (does not throw)", async () => {
    const writes: string[] = [];
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation((c: unknown) => {
      writes.push(String(c));
      return true;
    });
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation((c: unknown) => {
      writes.push(String(c));
      return true;
    });
    const original = process.exitCode;
    await expect(completionHandler(["fish"], {}, "json")).resolves.toBeUndefined();
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    process.exitCode = original;
    expect(writes.join("")).toMatch(/Unsupported shell/);
  });

  it("prints help when no shell is given", async () => {
    const writes: string[] = [];
    const spy = vi.spyOn(process.stdout, "write").mockImplementation((c: unknown) => {
      writes.push(String(c));
      return true;
    });
    await completionHandler([], {}, "json");
    spy.mockRestore();
    expect(writes.join("")).toContain("Usage: bitbank completion");
  });

  it("prints help with --help flag", async () => {
    const writes: string[] = [];
    const spy = vi.spyOn(process.stdout, "write").mockImplementation((c: unknown) => {
      writes.push(String(c));
      return true;
    });
    await completionHandler(["bash"], { help: true }, "json");
    spy.mockRestore();
    expect(writes.join("")).toContain("Usage: bitbank completion");
  });
});

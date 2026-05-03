import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const MAX_LINES = 100;

describe("Chaos X-04: all files ≤ 100 lines", () => {
  it("cli/commands/ files are within limit", () => {
    const output = execSync('find cli/commands/ -name "*.ts" | xargs wc -l | grep -v total', {
      encoding: "utf-8",
    });
    const overLimit = output
      .trim()
      .split("\n")
      .map((line) => {
        const m = line.trim().match(/^(\d+)\s+(.+)$/);
        return m ? { lines: Number(m[1]), file: m[2] } : null;
      })
      .filter((e): e is { lines: number; file: string } => e !== null && e.lines > MAX_LINES);

    if (overLimit.length > 0) {
      const msg = overLimit.map((e) => `${e.file}: ${e.lines} lines`).join("\n");
      expect.fail(`Files exceeding ${MAX_LINES} lines:\n${msg}`);
    }
  });

  it("core modules (http, auth, output) are within limit", () => {
    const output = execSync(
      "wc -l cli/http.ts cli/http-core.ts cli/http-private.ts cli/http-private-post.ts cli/auth.ts cli/output.ts | grep -v total",
      { encoding: "utf-8" },
    );
    const overLimit = output
      .trim()
      .split("\n")
      .map((line) => {
        const m = line.trim().match(/^(\d+)\s+(.+)$/);
        return m ? { lines: Number(m[1]), file: m[2] } : null;
      })
      .filter((e): e is { lines: number; file: string } => e !== null && e.lines > MAX_LINES);

    if (overLimit.length > 0) {
      const msg = overLimit.map((e) => `${e.file}: ${e.lines} lines`).join("\n");
      expect.fail(`Files exceeding ${MAX_LINES} lines:\n${msg}`);
    }
  });

  it("cli/index.ts is within limit", () => {
    const output = execSync("wc -l cli/index.ts", { encoding: "utf-8" });
    const lines = Number(output.trim().split(/\s+/)[0]);
    expect(lines).toBeLessThanOrEqual(MAX_LINES);
  });
});

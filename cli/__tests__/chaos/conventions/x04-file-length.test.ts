import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MAX_LINES = 100;
const HEADER_SCAN = 5;
const REASON_COMMENT_RE = /^\s*\/\/\s*(?:100行超|>100 lines)\s*:/;

function hasReasonComment(file: string): boolean {
  const lines = readFileSync(file, "utf-8").split("\n");
  let scanned = 0;
  for (const line of lines) {
    if (scanned >= HEADER_SCAN) break;
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#!")) continue;
    if (REASON_COMMENT_RE.test(line)) return true;
    scanned++;
  }
  return false;
}

function findOverLimit(wcOutput: string): { file: string; lines: number }[] {
  return wcOutput
    .trim()
    .split("\n")
    .map((line) => {
      const m = line.trim().match(/^(\d+)\s+(.+)$/);
      return m ? { lines: Number(m[1]), file: m[2] } : null;
    })
    .filter((e): e is { lines: number; file: string } => e !== null && e.lines > MAX_LINES)
    .filter((e) => !hasReasonComment(e.file));
}

function failIfOver(wcOutput: string): void {
  const overLimit = findOverLimit(wcOutput);
  if (overLimit.length > 0) {
    const msg = overLimit.map((e) => `${e.file}: ${e.lines} lines`).join("\n");
    expect.fail(
      `Files exceeding ${MAX_LINES} lines without reason comment:\n${msg}\n` +
        `Add a header comment like "// 100行超: <理由>" within the first ${HEADER_SCAN} non-blank lines.`,
    );
  }
}

describe("Chaos X-04: files ≤ 100 lines (or carry a reason comment)", () => {
  it("cli/commands/ files are within limit", () => {
    const output = execSync('find cli/commands/ -name "*.ts" | xargs wc -l | grep -v total', {
      encoding: "utf-8",
    });
    failIfOver(output);
  });

  it("core modules (http, auth, output) are within limit", () => {
    const output = execSync(
      "wc -l cli/http.ts cli/http-core.ts cli/http-private.ts cli/http-private-post.ts cli/auth.ts cli/output.ts | grep -v total",
      { encoding: "utf-8" },
    );
    failIfOver(output);
  });

  it("cli/index.ts is within limit", () => {
    const output = execSync("wc -l cli/index.ts", { encoding: "utf-8" });
    failIfOver(output);
  });
});

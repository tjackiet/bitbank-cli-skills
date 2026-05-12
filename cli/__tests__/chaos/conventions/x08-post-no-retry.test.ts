import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const TARGET = "cli/http-private-post.ts";

function grep(pattern: string): string {
  return execSync(`grep -nE ${JSON.stringify(pattern)} ${TARGET} || true`, {
    encoding: "utf-8",
  }).trim();
}

describe("Chaos X-08: POST helper disables retries (idempotency protection)", () => {
  it("cli/http-private-post.ts forces retries: 0", () => {
    const hit = grep("retries:\\s*0\\b");
    expect(
      hit,
      'http-private-post.ts must set retries: 0 (see .claude/rules/trading-safety.md "POST のリトライ無効化")',
    ).not.toBe("");
  });

  it("cli/http-private-post.ts forces retryOnNetworkError: false", () => {
    const hit = grep("retryOnNetworkError:\\s*false\\b");
    expect(
      hit,
      'http-private-post.ts must set retryOnNetworkError: false (see .claude/rules/trading-safety.md "POST のリトライ無効化")',
    ).not.toBe("");
  });
});

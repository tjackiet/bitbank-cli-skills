import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/** Forbid CLI flag-style intake of secrets in profile commands.
 *   - `--secret` literal: would appear in help text or flag parsing
 *   - `\bsecret:` standalone property key: would appear in an args type
 *     (e.g. `secret: string`). Word boundary avoids matching `secretMasked:`
 *     (legitimate response field in show.ts) or property shorthand
 *     `{ key, secret, ... }` (no colon).
 * Allowed routes: BITBANK_API_SECRET env var or prompts.readHidden() — both
 * keep the secret out of shell history.
 */
const FORBIDDEN_RE = "(--secret\\b|\\bsecret:)";

describe("Chaos X-12: profile commands never accept secrets via CLI flags", () => {
  it("cli/commands/profile/ has no --secret flag or secret: arg definition", () => {
    const out = execSync(
      `grep -rEn ${JSON.stringify(FORBIDDEN_RE)} cli/commands/profile/ --include="*.ts" || true`,
      { encoding: "utf-8" },
    ).trim();
    const hits = out ? out.split("\n") : [];
    expect(
      hits,
      `profile must take secrets only from env or hidden prompt (see .claude/rules/commands.md: "secret は flag 受け禁止"):\n${hits.join("\n")}`,
    ).toEqual([]);
  });
});

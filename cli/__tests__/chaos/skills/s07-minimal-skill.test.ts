import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const SKILLS_DIR = resolve(import.meta.dirname, "../../../../.claude/skills");
const TEST_SKILL = resolve(SKILLS_DIR, "_chaos-test-skill");
const SKILL_MD = resolve(TEST_SKILL, "SKILL.md");

describe("Chaos S-07: minimal Skill structure", () => {
  afterAll(() => {
    rmSync(TEST_SKILL, { recursive: true, force: true });
  });

  it("minimal SKILL.md with frontmatter passes structure checks", () => {
    mkdirSync(TEST_SKILL, { recursive: true });
    writeFileSync(
      SKILL_MD,
      [
        "---",
        "name: _chaos-test-skill",
        "description: |",
        "  Minimal chaos test skill.",
        "compatibility: |",
        "  Node.js 18+.",
        "metadata:",
        "  author: chaos-test",
        '  version: "1.0"',
        "---",
        "",
        "# Chaos Test Skill",
        "",
      ].join("\n"),
    );

    const { readFileSync } = require("node:fs");
    const content = readFileSync(SKILL_MD, "utf-8");

    // Frontmatter structure
    expect(content.startsWith("---\n")).toBe(true);
    const closing = content.indexOf("\n---\n", 4);
    expect(closing).toBeGreaterThan(0);

    const fm = content.slice(4, closing);
    expect(fm).toContain("name: _chaos-test-skill");
    expect(fm).toContain("description:");
    expect(fm).toContain("compatibility:");
    expect(fm).toContain("metadata:");
  });

  it("cleans up test skill directory", () => {
    rmSync(TEST_SKILL, { recursive: true, force: true });
    const { existsSync } = require("node:fs");
    expect(existsSync(TEST_SKILL)).toBe(false);
  });
});

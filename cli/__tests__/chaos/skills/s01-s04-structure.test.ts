import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SKILLS_DIR = resolve(import.meta.dirname, "../../../../.claude/skills");
const SKILLS = ["indicator-analysis", "backtest", "portfolio"];

const REQUIRED_REFS: Record<string, string[]> = {
  "indicator-analysis": ["bitbank-api-formats.md", "indicator-guide.md"],
  backtest: ["bitbank-api-formats.md", "strategy-patterns.md"],
  portfolio: ["bitbank-api-formats.md", "private-api-guide.md"],
};

describe("Chaos S-01: SKILL.md YAML frontmatter validity", () => {
  for (const skill of SKILLS) {
    it(`${skill}: starts with --- and has closing ---`, () => {
      const content = readFileSync(resolve(SKILLS_DIR, skill, "SKILL.md"), "utf-8");
      expect(content.startsWith("---\n")).toBe(true);
      expect(content.indexOf("\n---\n", 4)).toBeGreaterThan(0);
    });
  }
});

describe("Chaos S-02: name matches folder name", () => {
  for (const skill of SKILLS) {
    it(`${skill}: frontmatter name === folder`, () => {
      const content = readFileSync(resolve(SKILLS_DIR, skill, "SKILL.md"), "utf-8");
      const fm = content.slice(4, content.indexOf("\n---\n", 4));
      const m = fm.match(/^name:\s*(.+)$/m);
      expect(m).not.toBeNull();
      expect(m?.[1].trim()).toBe(skill);
    });
  }
});

describe("Chaos S-03: description ≤ 1024 chars", () => {
  for (const skill of SKILLS) {
    it(`${skill}: description within limit`, () => {
      const content = readFileSync(resolve(SKILLS_DIR, skill, "SKILL.md"), "utf-8");
      const fm = content.slice(4, content.indexOf("\n---\n", 4));
      const m = fm.match(/description:\s*\|\n([\s\S]*?)(?=\n\w|\nmetadata:|\ncompatibility:)/);
      expect(m).not.toBeNull();
      const desc =
        m?.[1]
          .split("\n")
          .map((l) => l.trim())
          .join("\n")
          .trim() ?? "";
      expect(desc.length).toBeLessThanOrEqual(1024);
      expect(desc.length).toBeGreaterThan(0);
    });
  }
});

describe("Chaos S-04: references/ files exist", () => {
  for (const skill of SKILLS) {
    const refs = REQUIRED_REFS[skill] ?? [];
    for (const ref of refs) {
      it(`${skill}: references/${ref} exists`, () => {
        // bitbank-api-formats.md is shared
        const direct = resolve(SKILLS_DIR, skill, "references", ref);
        const shared = resolve(SKILLS_DIR, "_shared/references", ref);
        expect(existsSync(direct) || existsSync(shared)).toBe(true);
      });
    }
  }
});

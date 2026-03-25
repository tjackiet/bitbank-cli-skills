import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SKILLS_DIR = resolve(import.meta.dirname, "../../.claude/skills");

const SKILLS = ["indicator-analysis", "backtest", "portfolio"];

const EXPECTED_REFERENCES: Record<string, string[]> = {
  "indicator-analysis": ["bitbank-api-formats.md", "indicator-guide.md"],
  backtest: ["bitbank-api-formats.md", "strategy-patterns.md"],
  portfolio: ["bitbank-api-formats.md", "private-api-guide.md"],
};

describe("Agent Skills", () => {
  for (const skill of SKILLS) {
    describe(skill, () => {
      const skillMdPath = resolve(SKILLS_DIR, skill, "SKILL.md");

      it("SKILL.md exists", () => {
        expect(existsSync(skillMdPath)).toBe(true);
      });

      it("has valid YAML frontmatter", () => {
        const content = readFileSync(skillMdPath, "utf-8");
        // Must start with ---
        expect(content.startsWith("---\n")).toBe(true);
        // Must have closing ---
        const closingIndex = content.indexOf("\n---\n", 4);
        expect(closingIndex).toBeGreaterThan(0);

        const frontmatter = content.slice(4, closingIndex);
        // Required fields
        expect(frontmatter).toContain("name:");
        expect(frontmatter).toContain("description:");
        expect(frontmatter).toContain("compatibility:");
        expect(frontmatter).toContain("metadata:");

        // name must match folder name
        const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
        expect(nameMatch).not.toBeNull();
        expect(nameMatch?.[1].trim()).toBe(skill);
      });

      it("description is within 1024 characters", () => {
        const content = readFileSync(skillMdPath, "utf-8");
        const closingIndex = content.indexOf("\n---\n", 4);
        const frontmatter = content.slice(4, closingIndex);

        // Extract description block (YAML multiline)
        const descMatch = frontmatter.match(
          /description:\s*\|\n([\s\S]*?)(?=\n\w|\nmetadata:|\ncompatibility:)/,
        );
        expect(descMatch).not.toBeNull();
        const description = descMatch?.[1]
          .split("\n")
          .map((l) => l.trim())
          .join("\n")
          .trim();
        expect(description).toBeDefined();
        expect(description!.length).toBeLessThanOrEqual(1024);
      });

      it("references/ files exist", () => {
        const refs = EXPECTED_REFERENCES[skill] ?? [];
        for (const ref of refs) {
          const refPath = resolve(SKILLS_DIR, skill, "references", ref);
          expect(existsSync(refPath), `Missing: ${ref}`).toBe(true);
        }
      });
    });
  }
});

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { EXIT } from "./exit-codes.js";
import type { Result } from "./types.js";

/** .env ファイルをパースして key=value の Record を返す */
export function parseEnvFile(content: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    // Remove surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    vars[key] = val;
  }
  return vars;
}

/** プロファイル用 .env ファイルを読み込み process.env に反映する */
export function applyProfile(profile: string): Result<string> {
  if (/[/\\]|\.\./.test(profile)) {
    return { success: false, error: "Invalid profile name", exitCode: EXIT.PARAM };
  }
  const filename = `.env.${profile}`;
  const filepath = resolve(process.cwd(), filename);
  if (!existsSync(filepath)) {
    return {
      success: false,
      error: `Profile file not found: ${filename}`,
      exitCode: EXIT.PARAM,
    };
  }
  const content = readFileSync(filepath, "utf-8");
  const vars = parseEnvFile(content);
  for (const [key, val] of Object.entries(vars)) {
    process.env[key] = val;
  }
  return { success: true, data: filename };
}

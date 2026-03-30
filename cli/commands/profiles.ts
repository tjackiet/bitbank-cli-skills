import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { output } from "../output.js";
import type { Format } from "../types.js";

/** .env.* ファイルを列挙してプロファイル名を返す */
export function listProfiles(): string[] {
  const dir = resolve(process.cwd());
  const files = readdirSync(dir);
  return files.filter((f) => f.startsWith(".env.") && f !== ".env.example").map((f) => f.slice(5));
}

export async function profilesHandler(
  _args: string[],
  _values: Record<string, string | boolean | undefined>,
  format: Format,
): Promise<void> {
  const profiles = listProfiles();
  output({ success: true, data: { profiles } }, format);
}

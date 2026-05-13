// 出金先ラベル allowlist の読み取り primitive。bitbank 側で登録済みの
// 出金先ラベル名のうち、CLI / AI 経由で trade withdraw が使ってよいものだけを
// 白名簿として持つ。UUID は持たない (ローカル改ざんによる UUID 捏造を防ぐ) —
// 実 UUID は withdraw 実行時に bitbank API で動的に解決する。
import { readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { EXIT } from "./exit-codes.js";
import type { Result } from "./types.js";

export const WithdrawalAllowlistSchema = z.object({
  version: z.literal(1),
  labels: z.array(z.string().min(1)),
});

export type WithdrawalAllowlist = z.infer<typeof WithdrawalAllowlistSchema>;

export function defaultAllowlistPath(): string {
  if (process.env.BITBANK_WITHDRAWAL_ALLOWLIST_PATH) {
    return process.env.BITBANK_WITHDRAWAL_ALLOWLIST_PATH;
  }
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg) return join(xdg, "bitbank", "withdrawal-allowlist.json");
  return join(homedir(), ".bitbank", "withdrawal-allowlist.json");
}

function warnIfInsecure(path: string): void {
  if (process.platform === "win32") return;
  try {
    const { mode } = statSync(path);
    if (mode & 0o077) {
      const octal = `0${(mode & 0o777).toString(8)}`;
      process.stderr.write(
        `Warning: ${path} is readable by other users (mode: ${octal}). Run: chmod 600 ${path}\n`,
      );
    }
  } catch {
    // stat failure is non-fatal; just skip the warning
  }
}

export function loadAllowlist(path = defaultAllowlistPath()): Result<WithdrawalAllowlist> {
  let buf: string;
  try {
    buf = readFileSync(path, "utf-8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        success: false,
        error: `Withdrawal allowlist not found at ${path}. Create it with mode 0600 and the format: {"version":1,"labels":["<bitbank-label>"]}`,
        exitCode: EXIT.PARAM,
      };
    }
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: `Failed to read allowlist: ${msg}`, exitCode: EXIT.GENERAL };
  }
  warnIfInsecure(path);
  let json: unknown;
  try {
    json = JSON.parse(buf);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: `Invalid allowlist JSON: ${msg}`, exitCode: EXIT.GENERAL };
  }
  const parsed = WithdrawalAllowlistSchema.safeParse(json);
  if (!parsed.success) {
    return {
      success: false,
      error: `Invalid allowlist file at ${path}: schema mismatch (expected { version: 1, labels: string[] })`,
      exitCode: EXIT.GENERAL,
    };
  }
  return { success: true, data: parsed.data };
}

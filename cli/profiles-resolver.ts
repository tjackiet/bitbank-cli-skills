import type { ApiCredentials } from "./auth.js";
import { EXIT } from "./exit-codes.js";
import { loadProfiles } from "./profiles-store.js";
import type { Result } from "./types.js";

export type { ApiCredentials };

const NOT_CONFIGURED =
  "BITBANK API credentials are not configured. " +
  "Add a profile with `bitbank profile add <name>`, " +
  'or set "BITBANK_API_KEY" and "BITBANK_API_SECRET" environment variables.';

function lookup(profiles: Record<string, { key: string; secret: string }>, name: string) {
  // Object.hasOwn で prototype 経由（"__proto__"/"toString" 等）を弾く
  if (!Object.hasOwn(profiles, name)) return undefined;
  return profiles[name];
}

/** Credential resolution: BITBANK_PROFILE env → profiles.json default → legacy env vars.
 * The `--profile=<name>` CLI flag is funnelled through BITBANK_PROFILE by cli/index.ts,
 * so this function does not need to know about CLI options directly. */
export function resolveCredentials(): Result<ApiCredentials> {
  const profileName = process.env.BITBANK_PROFILE;
  if (profileName) {
    const file = loadProfiles();
    if (!file.success) return { success: false, error: file.error, exitCode: EXIT.AUTH };
    const p = lookup(file.data.profiles, profileName);
    if (!p) {
      const names = Object.keys(file.data.profiles);
      const avail = names.length > 0 ? names.join(", ") : "(none)";
      return {
        success: false,
        error: `Profile "${profileName}" not found in profiles.json. Available: ${avail}`,
        exitCode: EXIT.AUTH,
      };
    }
    return { success: true, data: { apiKey: p.key, apiSecret: p.secret } };
  }
  const file = loadProfiles();
  if (file.success && file.data.default) {
    const p = lookup(file.data.profiles, file.data.default);
    if (p) return { success: true, data: { apiKey: p.key, apiSecret: p.secret } };
  }
  const apiKey = process.env.BITBANK_API_KEY;
  const apiSecret = process.env.BITBANK_API_SECRET;
  if (apiKey && apiSecret) return { success: true, data: { apiKey, apiSecret } };
  return { success: false, error: NOT_CONFIGURED, exitCode: EXIT.AUTH };
}

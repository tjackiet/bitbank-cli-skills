import { EXIT } from "../../exit-codes.js";
import { loadProfiles } from "../../profiles-store.js";
import type { Result } from "../../types.js";

export type ProfileShowResult = {
  name: string;
  default: boolean;
  keyMasked: string;
  secretMasked: string;
  description?: string;
  createdAt: string;
};

/** Mask all but the last 4 chars. Short values are fully masked. */
function maskTail(s: string): string {
  if (s.length <= 4) return "****";
  return `****${s.slice(-4)}`;
}

export async function profileShow(args: { name: string }): Promise<Result<ProfileShowResult>> {
  const file = loadProfiles();
  if (!file.success) return file;
  const p = file.data.profiles[args.name];
  if (!p) {
    return {
      success: false,
      error: `Profile "${args.name}" not found`,
      exitCode: EXIT.PARAM,
    };
  }
  return {
    success: true,
    data: {
      name: args.name,
      default: file.data.default === args.name,
      keyMasked: maskTail(p.key),
      secretMasked: maskTail(p.secret),
      description: p.description,
      createdAt: p.createdAt,
    },
  };
}

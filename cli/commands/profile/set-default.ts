import { EXIT } from "../../exit-codes.js";
import { loadProfiles, saveProfiles } from "../../profiles-store.js";
import type { Result } from "../../types.js";

export async function profileSetDefault(args: {
  name: string;
}): Promise<Result<{ default: string }>> {
  const file = loadProfiles();
  if (!file.success) return file;
  if (!file.data.profiles[args.name]) {
    return {
      success: false,
      error: `Profile "${args.name}" not found`,
      exitCode: EXIT.PARAM,
    };
  }
  const saved = saveProfiles({ ...file.data, default: args.name });
  if (!saved.success) return saved;
  return { success: true, data: { default: args.name } };
}

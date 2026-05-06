import { EXIT } from "../../exit-codes.js";
import { type ProfilesFile, loadProfiles, saveProfiles } from "../../profiles-store.js";
import type { Result } from "../../types.js";

export type ProfileRemoveArgs = {
  name: string;
  confirm: boolean;
};

export type ProfileRemoveResult = {
  removed: string;
  defaultCleared: boolean;
};

export async function profileRemove(args: ProfileRemoveArgs): Promise<Result<ProfileRemoveResult>> {
  if (!args.confirm) {
    return {
      success: false,
      error: "Refusing to remove profile without --confirm",
      exitCode: EXIT.PARAM,
    };
  }
  const file = loadProfiles();
  if (!file.success) return file;
  if (!file.data.profiles[args.name]) {
    return { success: false, error: `Profile "${args.name}" not found`, exitCode: EXIT.PARAM };
  }
  const { [args.name]: _, ...rest } = file.data.profiles;
  const wasDefault = file.data.default === args.name;
  const next: ProfilesFile = {
    version: 1,
    default: wasDefault ? null : file.data.default,
    profiles: rest,
  };
  const saved = saveProfiles(next);
  if (!saved.success) return saved;
  return {
    success: true,
    data: { removed: args.name, defaultCleared: wasDefault },
  };
}

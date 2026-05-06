import { loadProfiles } from "../../profiles-store.js";
import type { Result } from "../../types.js";

export type ProfileListEntry = {
  name: string;
  default: boolean;
  description?: string;
};

export async function profileList(): Promise<Result<ProfileListEntry[]>> {
  const file = loadProfiles();
  if (!file.success) return file;
  const entries: ProfileListEntry[] = [];
  for (const [name, p] of Object.entries(file.data.profiles)) {
    entries.push({
      name,
      default: file.data.default === name,
      description: p.description,
    });
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  return { success: true, data: entries };
}

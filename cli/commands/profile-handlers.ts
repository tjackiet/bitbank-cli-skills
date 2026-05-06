import { output } from "../output.js";
import type { CommandEntry } from "./handler-types.js";
import { bool, str, valStr } from "./handler-types.js";

export const profileCommands: Record<string, CommandEntry> = {
  add: {
    description: "Add a new credential profile (key/secret prompted; secret hidden)",
    options: { description: str, default: bool() },
    handler: async (args, values, format) => {
      const { profileAdd } = await import("./profile/add.js");
      const r = await profileAdd({
        name: args[0] ?? "",
        description: valStr(values, "description"),
        setDefault: !!values.default,
      });
      output(r, format, values.raw === true, values.machine === true);
    },
  },
  list: {
    description: "List configured profiles (no secrets)",
    handler: async (_a, values, format) => {
      const { profileList } = await import("./profile/list.js");
      const r = await profileList();
      output(r, format, values.raw === true, values.machine === true);
    },
  },
  show: {
    description: "Show a profile (secret always masked)",
    handler: async (args, values, format) => {
      const { profileShow } = await import("./profile/show.js");
      const r = await profileShow({ name: args[0] ?? "" });
      output(r, format, values.raw === true, values.machine === true);
    },
  },
  remove: {
    description: "Remove a profile (requires --confirm)",
    options: { confirm: bool() },
    handler: async (args, values, format) => {
      const { profileRemove } = await import("./profile/remove.js");
      const r = await profileRemove({ name: args[0] ?? "", confirm: !!values.confirm });
      output(r, format, values.raw === true, values.machine === true);
    },
  },
  "set-default": {
    description: "Set the default profile",
    handler: async (args, values, format) => {
      const { profileSetDefault } = await import("./profile/set-default.js");
      const r = await profileSetDefault({ name: args[0] ?? "" });
      output(r, format, values.raw === true, values.machine === true);
    },
  },
};

import type { CommandEntry } from "./handler-types.js";
import { bool, str, valStr } from "./handler-types.js";

export const streamCommands: Record<string, CommandEntry> = {
  stream: {
    description: "Subscribe to real-time stream (public or --private)",
    options: { private: bool(), channel: str, filter: str },
    handler: async (args, values, format) => {
      const { streamCommand } = await import("./stream/index.js");
      const fmt = format === "csv" ? "json" : format;
      const r = await streamCommand({
        pair: args[0],
        isPrivate: !!values.private,
        channel: valStr(values, "channel"),
        filter: valStr(values, "filter"),
        format: fmt,
      });
      if (!r.success) {
        process.stderr.write(`Error: ${r.error}\n`);
        process.exitCode = 1;
      }
    },
  },
};

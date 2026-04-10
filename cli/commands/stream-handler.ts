import type { CommandEntry } from "./handler-types.js";

const str = { type: "string" as const };
const bool = (d = false) => ({ type: "boolean" as const, default: d });

export const streamCommands: Record<string, CommandEntry> = {
  stream: {
    description: "Subscribe to real-time stream (public or --private)",
    options: { private: bool(), channel: str, filter: str },
    handler: async (args, values, format) => {
      const { streamCommand } = await import("./stream/index.js");
      const fmt = format === "csv" ? "json" : (format as "json" | "table");
      const r = await streamCommand({
        pair: args[0],
        isPrivate: !!values.private,
        channel: values.channel as string | undefined,
        filter: values.filter as string | undefined,
        format: fmt,
      });
      if (!r.success) {
        process.stderr.write(`Error: ${r.error}\n`);
        process.exitCode = 1;
      }
    },
  },
};

import type { CommandHandler } from "./handler-types.js";

export const streamCommands: Record<string, { description: string; handler: CommandHandler }> = {
  stream: {
    description: "Subscribe to real-time stream (public or --private)",
    handler: async (args, values, format) => {
      const { streamCommand } = await import("./stream.js");
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

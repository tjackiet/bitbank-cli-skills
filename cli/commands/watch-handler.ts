import { output } from "../output.js";
import type { WatchFormat } from "../watch/format.js";
import type { CommandEntry, ParsedValues } from "./handler-types.js";
import { str, valStr } from "./handler-types.js";

const numOpt = (v: ParsedValues, key: string, dflt?: number): number | undefined => {
  const s = valStr(v, key);
  if (s === undefined) return dflt;
  const n = Number(s);
  return Number.isFinite(n) ? n : dflt;
};

function resolveFormat(fmt: string, isTty: boolean, explicit: boolean): WatchFormat {
  const wanted = fmt === "table" ? "table" : "json";
  if (!isTty && wanted === "table") {
    if (explicit) {
      process.stderr.write("Warning: stdout is not a TTY; falling back to json.\n");
    }
    return "json";
  }
  if (isTty && !explicit) return "table";
  return wanted;
}

function isExplicitFormat(argv: string[]): boolean {
  return argv.some((a) => a === "--format" || a.startsWith("--format="));
}

export const watchCommands: Record<string, CommandEntry> = {
  watch: {
    description: "Watch a real-time public channel (ticker only)",
    options: {
      duration: str,
      count: str,
      "idle-timeout": str,
      "max-retries": str,
      "backoff-cap": str,
    },
    handler: async (args, values, format) => {
      const { watchCommand } = await import("./watch/index.js");
      const fmt = resolveFormat(
        String(values.format ?? format),
        Boolean(process.stdout.isTTY),
        isExplicitFormat(process.argv.slice(2)),
      );
      const r = await watchCommand({
        channel: args[0] ?? "",
        pair: args[1],
        format: fmt,
        duration: numOpt(values, "duration"),
        count: numOpt(values, "count"),
        idleTimeout: numOpt(values, "idle-timeout", 30) ?? 30,
        maxRetries:
          numOpt(values, "max-retries", Number.POSITIVE_INFINITY) ?? Number.POSITIVE_INFINITY,
        backoffCap: numOpt(values, "backoff-cap", 32) ?? 32,
      });
      if (!r.success) output(r, fmt === "table" ? "json" : fmt);
    },
  },
};

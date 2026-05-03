import type { CommandEntry } from "./commands/handler-types.js";
import { COMMANDS, TRADE_COMMANDS } from "./commands/registry.js";
import type { Format } from "./types.js";

export type ResolvedCommand = {
  isTrade: boolean;
  command: string | undefined;
  entry: CommandEntry | undefined;
};

export function resolveCommand(positionals: string[]): ResolvedCommand {
  const isTrade = positionals[0] === "trade";
  const command = isTrade ? positionals[1] : positionals[0];
  const entry = isTrade ? (command ? TRADE_COMMANDS[command] : undefined) : COMMANDS[command ?? ""];
  return { isTrade, command, entry };
}

export async function handleSpecialCommand(
  command: string,
  args: string[],
  opts: Record<string, string | boolean | undefined>,
  format: Format,
): Promise<boolean> {
  if (command === "profiles") {
    const { profilesHandler } = await import("./commands/profiles.js");
    await profilesHandler(args, opts, format);
    return true;
  }
  if (command === "schema") {
    const { buildSchemaHandler } = await import("./commands/schema/handler.js");
    const desc = Object.fromEntries(
      [...Object.entries(COMMANDS), ...Object.entries(TRADE_COMMANDS)].map(([k, v]) => [
        k,
        v.description,
      ]),
    );
    await buildSchemaHandler(desc)(args, opts, format);
    return true;
  }
  return false;
}

export async function runCommandHelp(command: string, description: string): Promise<boolean> {
  const { showCommandHelp } = await import("./commands/schema/help.js");
  return showCommandHelp(command, description);
}

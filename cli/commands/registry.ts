import type { CommandEntry } from "./handler-types.js";
import { privateCommands } from "./private-handlers.js";
import { publicCommands } from "./public-handlers.js";
import { streamCommands } from "./stream-handler.js";
import { tradeCommands } from "./trade-handlers.js";

export const COMMANDS: Record<string, CommandEntry> = {
  ...publicCommands,
  ...privateCommands,
  ...tradeCommands,
  ...streamCommands,
};

import type { CommandEntry } from "./handler-types.js";
import { paperCommands } from "./paper-handlers.js";
import { privateCommands } from "./private-handlers.js";
import { privateTransferCommands } from "./private-transfer-handlers.js";
import { publicCommands } from "./public-handlers.js";
import { streamCommands } from "./stream-handler.js";
import { tradeCommands } from "./trade-handlers.js";
import { watchCommands } from "./watch-handler.js";

export const COMMANDS: Record<string, CommandEntry> = {
  ...publicCommands,
  ...privateCommands,
  ...privateTransferCommands,
  ...streamCommands,
  ...watchCommands,
};

export const TRADE_COMMANDS: Record<string, CommandEntry> = { ...tradeCommands };

export const PAPER_COMMANDS: Record<string, CommandEntry> = { ...paperCommands };

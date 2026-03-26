import type { Format } from "../types.js";

export type ParsedValues = Record<string, string | boolean | undefined>;

export type CommandHandler = (
  args: string[],
  values: ParsedValues,
  format: Format,
) => Promise<void>;

export type CommandEntry = {
  description: string;
  handler: CommandHandler;
};

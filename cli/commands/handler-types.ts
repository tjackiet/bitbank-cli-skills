import type { Format } from "../types.js";

export type ParsedValues = Record<string, string | boolean | undefined>;

export type CommandHandler = (
  args: string[],
  values: ParsedValues,
  format: Format,
) => Promise<void>;

export type CliOptionConfig = {
  type: "string" | "boolean";
  default?: string | boolean;
};

export type CliOptions = Record<string, CliOptionConfig>;

export type CommandEntry = {
  description: string;
  handler: CommandHandler;
  options?: CliOptions;
};

import type { Format } from "../types.js";

export type ParsedValues = Record<string, string | boolean | undefined>;

/** Narrow a ParsedValues entry to string | undefined (never boolean). */
export function valStr(v: ParsedValues, key: string): string | undefined {
  const val = v[key];
  return typeof val === "string" ? val : undefined;
}

export type CommandHandler = (
  args: string[],
  values: ParsedValues,
  format: Format,
) => Promise<void>;

export type CliOptionConfig = {
  type: "string" | "boolean";
  default?: string | boolean;
};

export const str: CliOptionConfig = { type: "string" };
export const bool = (d = false): CliOptionConfig => ({ type: "boolean", default: d });

export type CliOptions = Record<string, CliOptionConfig>;

export type CommandEntry = {
  description: string;
  handler: CommandHandler;
  options?: CliOptions;
};

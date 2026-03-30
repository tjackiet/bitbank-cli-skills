import type { ExitCode } from "./exit-codes.js";

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; exitCode?: ExitCode };

export type Format = "json" | "table" | "csv";

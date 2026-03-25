export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type Format = "json" | "table" | "csv";

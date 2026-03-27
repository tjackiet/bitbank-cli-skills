import type { Format, Result } from "./types.js";

export function output<T>(result: Result<T>, format: Format): void {
  if (!result.success) {
    process.stderr.write(`Error: ${result.error}\n`);
    process.exitCode = 1;
    return;
  }
  const data = result.data;
  switch (format) {
    case "json":
      process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
      break;
    case "table":
      printTable(data);
      break;
    case "csv":
      printCsv(data);
      break;
  }
}

function toRows(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (typeof data === "object" && data !== null) return [data as Record<string, unknown>];
  return [{ value: data }];
}

function printTable(data: unknown): void {
  const rows = toRows(data);
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  const widths = keys.map((k) => Math.max(k.length, ...rows.map((r) => String(r[k] ?? "").length)));
  const header = keys.map((k, i) => k.padEnd(widths[i])).join("  ");
  const sep = widths.map((w) => "-".repeat(w)).join("  ");
  process.stdout.write(`${header}\n${sep}\n`);
  for (const row of rows) {
    const line = keys.map((k, i) => String(row[k] ?? "").padEnd(widths[i])).join("  ");
    process.stdout.write(`${line}\n`);
  }
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function printCsv(data: unknown): void {
  const rows = toRows(data);
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  process.stdout.write(`${keys.map(escapeCsvField).join(",")}\n`);
  for (const row of rows) {
    process.stdout.write(`${keys.map((k) => escapeCsvField(String(row[k] ?? ""))).join(",")}\n`);
  }
}

#!/usr/bin/env tsx
import { parseArgs } from "node:util";
import { COMMANDS } from "./commands/registry.js";
import { EXIT } from "./exit-codes.js";
import type { Format } from "./types.js";

function showHelp(): void {
  console.log("Usage: bitbank <command> [options]\n");
  console.log("Commands:");
  for (const [name, { description }] of Object.entries(COMMANDS)) {
    console.log(`  ${name.padEnd(24)} ${description}`);
  }
  console.log("\nOptions:");
  console.log("  --format=json|table|csv  Output format (default: json)");
  console.log("  --help                   Show this help");
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      format: { type: "string", default: "json" },
      help: { type: "boolean", default: false },
      type: { type: "string" },
      date: { type: "string" },
      limit: { type: "string", default: "100" },
      pair: { type: "string" },
      "order-id": { type: "string" },
      "order-ids": { type: "string" },
      count: { type: "string" },
      since: { type: "string" },
      end: { type: "string" },
      order: { type: "string" },
      asset: { type: "string" },
      all: { type: "boolean", default: false },
      side: { type: "string" },
      price: { type: "string" },
      amount: { type: "string" },
      "trigger-price": { type: "string" },
      "post-only": { type: "boolean", default: false },
      execute: { type: "boolean", default: false },
      confirm: { type: "boolean", default: false },
      uuid: { type: "string" },
      token: { type: "string" },
      id: { type: "string" },
      private: { type: "boolean", default: false },
      channel: { type: "string" },
      filter: { type: "string" },
      from: { type: "string" },
      to: { type: "string" },
      raw: { type: "boolean", default: false },
    },
    strict: false,
  });

  if (values.help || positionals.length === 0) {
    showHelp();
    return;
  }

  const format = (values.format ?? "json") as Format;
  if (!["json", "table", "csv"].includes(format)) {
    process.stderr.write(`Error: Unknown format "${format}". Use json, table, or csv.\n`);
    process.exitCode = EXIT.PARAM;
    return;
  }

  const [command, ...args] = positionals;
  const entry = COMMANDS[command];

  if (!entry) {
    process.stderr.write(`Error: Unknown command "${command}". Run with --help for usage.\n`);
    process.exitCode = EXIT.PARAM;
    return;
  }

  await entry.handler(args, values as Record<string, string | boolean | undefined>, format);
}

main();

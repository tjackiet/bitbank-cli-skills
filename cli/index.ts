#!/usr/bin/env tsx
import { parseArgs } from "node:util";
import { COMMANDS, TRADE_COMMANDS } from "./commands/registry.js";
import { COMMON_OPTIONS } from "./common-options.js";
import { EXIT, type ExitCode } from "./exit-codes.js";
import { machineOutput } from "./output.js";
import { applyProfile } from "./profile.js";
import type { Format } from "./types.js";

function showHelp(): void {
  console.log("Usage: bitbank <command> [options]\n");
  console.log("Commands:");
  console.log(`  ${"schema".padEnd(24)} Show command schemas (JSON Schema format)`);
  console.log(`  ${"profiles".padEnd(24)} List available profiles (.env.* files)`);
  for (const [name, { description }] of Object.entries(COMMANDS)) {
    console.log(`  ${name.padEnd(24)} ${description}`);
  }
  console.log(
    `  ${"trade <subcommand>".padEnd(24)} Fund-affecting operations (run 'bitbank trade' for list)`,
  );
  console.log("\nOptions:");
  console.log("  --profile=<name>         Use .env.<name> for credentials");
  console.log("  --format=json|table|csv  Output format (default: json)");
  console.log("  --machine                Machine-readable JSON envelope on stdout");
  console.log("  --help                   Show this help");
}

function showTradeHelp(): void {
  console.log("Usage: bitbank trade <subcommand> [options]\n");
  console.log("Fund-affecting operations. All default to dry-run; use --execute to send.\n");
  console.log("Subcommands:");
  for (const [name, { description }] of Object.entries(TRADE_COMMANDS)) {
    console.log(`  ${name.padEnd(24)} ${description}`);
  }
  console.log("\nRun 'bitbank trade <subcommand> --help' for subcommand options.");
}

function fail(machine: boolean, msg: string, code: ExitCode): void {
  if (machine) machineOutput({ success: false, error: msg, exitCode: code });
  else {
    process.stderr.write(`Error: ${msg}\n`);
    process.exitCode = code;
  }
}

async function handleSpecialCommand(
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

async function main(): Promise<void> {
  const { positionals: p1 } = parseArgs({
    allowPositionals: true,
    options: COMMON_OPTIONS,
    strict: false,
  });
  if (p1.length === 0) {
    showHelp();
    return;
  }

  const isTrade = p1[0] === "trade";
  const command = isTrade ? p1[1] : p1[0];
  const entry = isTrade ? (command ? TRADE_COMMANDS[command] : undefined) : COMMANDS[command ?? ""];
  const merged = { ...COMMON_OPTIONS, ...(entry?.options ?? {}) };
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: merged,
    strict: false,
  });
  const machine = values.machine === true;
  if (typeof values.profile === "string") {
    const r = applyProfile(values.profile);
    if (!r.success) {
      fail(machine, r.error, r.exitCode ?? EXIT.GENERAL);
      return;
    }
  }
  const format = (values.format ?? "json") as Format;
  if (!["json", "table", "csv"].includes(format)) {
    fail(machine, `Unknown format "${format}". Use json, table, or csv.`, EXIT.PARAM);
    return;
  }

  if (isTrade) {
    if (!command) {
      showTradeHelp();
      return;
    }
    if (!entry) {
      fail(
        machine,
        `Unknown trade subcommand "${command}". Run 'bitbank trade' for the list.`,
        EXIT.PARAM,
      );
      return;
    }
    if (values.help) {
      const { showCommandHelp } = await import("./commands/schema/help.js");
      if (showCommandHelp(command, entry.description)) return;
    }
    const [, , ...tradeArgs] = positionals;
    const opts = values as Record<string, string | boolean | undefined>;
    await entry.handler(tradeArgs, opts, format);
    return;
  }

  const [, ...args] = positionals;
  const opts = values as Record<string, string | boolean | undefined>;
  if (await handleSpecialCommand(command, args, opts, format)) return;
  if (!entry) {
    fail(machine, `Unknown command "${command}". Run with --help for usage.`, EXIT.PARAM);
    return;
  }

  if (values.help) {
    const { showCommandHelp } = await import("./commands/schema/help.js");
    if (showCommandHelp(command, entry.description)) return;
  }
  await entry.handler(args, opts, format);
}

main();

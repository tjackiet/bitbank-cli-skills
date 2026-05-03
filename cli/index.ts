#!/usr/bin/env tsx
import { parseArgs } from "node:util";
import { COMMON_OPTIONS } from "./common-options.js";
import { EXIT, type ExitCode } from "./exit-codes.js";
import { showHelp, showTradeHelp } from "./help-print.js";
import { machineOutput } from "./output.js";
import { applyProfile } from "./profile.js";
import { handleSpecialCommand, resolveCommand, runCommandHelp } from "./router.js";
import type { Format } from "./types.js";

function fail(machine: boolean, msg: string, code: ExitCode): void {
  if (machine) machineOutput({ success: false, error: msg, exitCode: code });
  else {
    process.stderr.write(`Error: ${msg}\n`);
    process.exitCode = code;
  }
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

  const { isTrade, command, entry } = resolveCommand(p1);
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
    if (values.help && (await runCommandHelp(command, entry.description))) return;
    const [, , ...tradeArgs] = positionals;
    const opts = values as Record<string, string | boolean | undefined>;
    await entry.handler(tradeArgs, opts, format);
    return;
  }

  const [, ...args] = positionals;
  const opts = values as Record<string, string | boolean | undefined>;
  if (command && (await handleSpecialCommand(command, args, opts, format))) return;
  if (!entry) {
    fail(machine, `Unknown command "${command}". Run with --help for usage.`, EXIT.PARAM);
    return;
  }
  if (values.help && command && (await runCommandHelp(command, entry.description))) return;
  await entry.handler(args, opts, format);
}

main();

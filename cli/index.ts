#!/usr/bin/env tsx
import { parseArgs } from "node:util";
import { output } from "./output.js";
import { type Format } from "./types.js";
import { ticker } from "./commands/public/ticker.js";
import { tickers, tickersJpy } from "./commands/public/tickers.js";
import { depth } from "./commands/public/depth.js";
import { transactions } from "./commands/public/transactions.js";
import { candles } from "./commands/public/candles.js";
import { circuitBreak } from "./commands/public/circuit-break.js";
import { status } from "./commands/public/status.js";
import { pairs } from "./commands/public/pairs.js";

const COMMANDS: Record<string, string> = {
  ticker:        "Get ticker for a pair (e.g. btc_jpy)",
  tickers:       "Get tickers for all pairs",
  "tickers-jpy": "Get tickers for all JPY pairs",
  depth:         "Get order book depth for a pair",
  transactions:  "Get recent transactions for a pair",
  candles:       "Get candlestick OHLCV data",
  "circuit-break": "Get circuit breaker info for a pair",
  status:        "Get exchange status for all pairs",
  pairs:         "Get all pair settings",
};

function showHelp(): void {
  console.log("Usage: bitbank <command> [options]\n");
  console.log("Commands:");
  for (const [name, desc] of Object.entries(COMMANDS)) {
    console.log(`  ${name.padEnd(18)} ${desc}`);
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
    process.exitCode = 1;
    return;
  }

  const [command, ...args] = positionals;

  switch (command) {
    case "ticker":
      output(await ticker(args[0]), format);
      break;
    case "tickers":
      output(await tickers(), format);
      break;
    case "tickers-jpy":
      output(await tickersJpy(), format);
      break;
    case "depth":
      output(await depth(args[0]), format);
      break;
    case "transactions":
      output(await transactions(args[0], values.date as string | undefined), format);
      break;
    case "candles":
      output(
        await candles(
          args[0],
          values.type as string | undefined,
          values.date as string | undefined,
          Number(values.limit ?? 100),
        ),
        format,
      );
      break;
    case "circuit-break":
      output(await circuitBreak(args[0]), format);
      break;
    case "status":
      output(await status(), format);
      break;
    case "pairs":
      output(await pairs(), format);
      break;
    default:
      process.stderr.write(`Error: Unknown command "${command}". Run with --help for usage.\n`);
      process.exitCode = 1;
  }
}

main();

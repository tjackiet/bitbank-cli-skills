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
import { assets } from "./commands/private/assets.js";
import { order } from "./commands/private/order.js";
import { ordersInfo } from "./commands/private/orders-info.js";
import { activeOrders } from "./commands/private/active-orders.js";
import { tradeHistory } from "./commands/private/trade-history.js";
import { depositHistory } from "./commands/private/deposit-history.js";
import { unconfirmedDeposits } from "./commands/private/unconfirmed-deposits.js";
import { depositOriginators } from "./commands/private/deposit-originators.js";
import { withdrawalAccounts } from "./commands/private/withdrawal-accounts.js";
import { withdrawalHistory } from "./commands/private/withdrawal-history.js";
import { marginStatus } from "./commands/private/margin-status.js";
import { marginPositions } from "./commands/private/margin-positions.js";
import { createOrder } from "./commands/trade/create-order.js";
import { cancelOrder } from "./commands/trade/cancel-order.js";
import { cancelOrders } from "./commands/trade/cancel-orders.js";
import { confirmDeposits } from "./commands/trade/confirm-deposits.js";
import { confirmDepositsAll } from "./commands/trade/confirm-deposits-all.js";
import { withdraw } from "./commands/trade/withdraw.js";
import { streamCommand } from "./commands/stream.js";

const COMMANDS: Record<string, string> = {
  // Public API
  ticker:        "Get ticker for a pair (e.g. btc_jpy)",
  tickers:       "Get tickers for all pairs",
  "tickers-jpy": "Get tickers for all JPY pairs",
  depth:         "Get order book depth for a pair",
  transactions:  "Get recent transactions for a pair",
  candles:       "Get candlestick OHLCV data",
  "circuit-break": "Get circuit breaker info for a pair",
  status:        "Get exchange status for all pairs",
  pairs:         "Get all pair settings",
  // Private API (read)
  assets:        "Get your asset balances",
  order:         "Get a specific order",
  "orders-info": "Get multiple orders by IDs",
  "active-orders": "Get active (open) orders",
  "trade-history": "Get trade execution history",
  "deposit-history": "Get deposit history",
  "unconfirmed-deposits": "Get unconfirmed deposits",
  "deposit-originators": "Get deposit originator addresses",
  "withdrawal-accounts": "Get registered withdrawal accounts",
  "withdrawal-history": "Get withdrawal history",
  "margin-status": "Get margin account status",
  "margin-positions": "Get open margin positions",
  // Trade (write) — dry-run by default
  "create-order":         "Create a spot order (dry-run default)",
  "cancel-order":         "Cancel a spot order (dry-run default)",
  "cancel-orders":        "Cancel multiple spot orders (dry-run default)",
  "confirm-deposits":     "Confirm a deposit (dry-run default)",
  "confirm-deposits-all": "Confirm all deposits (dry-run default)",
  withdraw:               "Request withdrawal (dry-run default, requires --confirm)",
  // Stream (real-time)
  stream:                 "Subscribe to real-time stream (public or --private)",
};

function showHelp(): void {
  console.log("Usage: bitbank <command> [options]\n");
  console.log("Commands:");
  for (const [name, desc] of Object.entries(COMMANDS)) {
    console.log(`  ${name.padEnd(24)} ${desc}`);
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
      // Trade options
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
      // Stream options
      private: { type: "boolean", default: false },
      channel: { type: "string" },
      filter: { type: "string" },
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
    // Public API
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

    // Private API (read)
    case "assets":
      output(await assets(!!values.all), format);
      break;
    case "order":
      output(await order(values.pair as string, values["order-id"] as string), format);
      break;
    case "orders-info":
      output(await ordersInfo(values.pair as string, values["order-ids"] as string), format);
      break;
    case "active-orders":
      output(
        await activeOrders(
          values.pair as string | undefined,
          values.count as string | undefined,
          values.since as string | undefined,
          values.end as string | undefined,
        ),
        format,
      );
      break;
    case "trade-history":
      output(
        await tradeHistory({
          pair: values.pair as string | undefined,
          count: values.count as string | undefined,
          orderId: values["order-id"] as string | undefined,
          since: values.since as string | undefined,
          end: values.end as string | undefined,
          order: values.order as string | undefined,
        }),
        format,
      );
      break;
    case "deposit-history":
      output(
        await depositHistory(
          values.asset as string | undefined,
          values.count as string | undefined,
          values.since as string | undefined,
          values.end as string | undefined,
        ),
        format,
      );
      break;
    case "unconfirmed-deposits":
      output(await unconfirmedDeposits(values.asset as string | undefined), format);
      break;
    case "deposit-originators":
      output(await depositOriginators(values.asset as string | undefined), format);
      break;
    case "withdrawal-accounts":
      output(await withdrawalAccounts(values.asset as string | undefined), format);
      break;
    case "withdrawal-history":
      output(
        await withdrawalHistory(
          values.asset as string | undefined,
          values.count as string | undefined,
          values.since as string | undefined,
          values.end as string | undefined,
        ),
        format,
      );
      break;
    case "margin-status":
      output(await marginStatus(), format);
      break;
    case "margin-positions":
      output(await marginPositions(values.pair as string | undefined), format);
      break;

    // Trade (write)
    case "create-order": {
      const r = await createOrder({
        pair: values.pair as string | undefined,
        side: values.side as string | undefined,
        type: values.type as string | undefined,
        price: values.price as string | undefined,
        amount: values.amount as string | undefined,
        triggerPrice: values["trigger-price"] as string | undefined,
        postOnly: !!values["post-only"],
        execute: !!values.execute,
      });
      if (r.success && "dryRun" in r.data) break;
      output(r, format);
      break;
    }
    case "cancel-order": {
      const r = await cancelOrder({
        pair: values.pair as string | undefined,
        orderId: values["order-id"] as string | undefined,
        execute: !!values.execute,
      });
      if (r.success && "dryRun" in r.data) break;
      output(r, format);
      break;
    }
    case "cancel-orders": {
      const r = await cancelOrders({
        pair: values.pair as string | undefined,
        orderIds: values["order-ids"] as string | undefined,
        execute: !!values.execute,
      });
      if (r.success && "dryRun" in r.data) break;
      output(r, format);
      break;
    }
    case "confirm-deposits": {
      const r = await confirmDeposits({
        id: values.id as string | undefined,
        execute: !!values.execute,
      });
      if (r.success && "dryRun" in r.data) break;
      output(r, format);
      break;
    }
    case "confirm-deposits-all": {
      const r = await confirmDepositsAll({
        execute: !!values.execute,
      });
      if (r.success && "dryRun" in r.data) break;
      output(r, format);
      break;
    }
    case "withdraw": {
      const r = await withdraw({
        asset: values.asset as string | undefined,
        uuid: values.uuid as string | undefined,
        amount: values.amount as string | undefined,
        token: values.token as string | undefined,
        execute: !!values.execute,
        confirm: !!values.confirm,
      });
      if (r.success && "dryRun" in r.data) break;
      output(r, format);
      break;
    }
    // Stream (real-time)
    case "stream": {
      const r = await streamCommand({
        pair: args[0],
        isPrivate: !!values.private,
        channel: values.channel as string | undefined,
        filter: values.filter as string | undefined,
        format: format === "csv" ? "json" : (format as "json" | "table"),
      });
      if (!r.success) {
        process.stderr.write(`Error: ${r.error}\n`);
        process.exitCode = 1;
      }
      break;
    }
    default:
      process.stderr.write(`Error: Unknown command "${command}". Run with --help for usage.\n`);
      process.exitCode = 1;
  }
}

main();

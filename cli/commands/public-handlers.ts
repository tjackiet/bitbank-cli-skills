import { output } from "../output.js";
import type { Format, Result } from "../types.js";
import type { CommandHandler } from "./handler-types.js";

export const publicCommands: Record<string, { description: string; handler: CommandHandler }> = {
  ticker: {
    description: "Get ticker for a pair (e.g. btc_jpy)",
    handler: async (args, _v, fmt) => {
      const { ticker } = await import("./public/ticker.js");
      output(await ticker(args[0]), fmt);
    },
  },
  tickers: {
    description: "Get tickers for all pairs",
    handler: async (_a, _v, fmt) => {
      const { tickers } = await import("./public/tickers.js");
      output(await tickers(), fmt);
    },
  },
  "tickers-jpy": {
    description: "Get tickers for all JPY pairs",
    handler: async (_a, _v, fmt) => {
      const { tickersJpy } = await import("./public/tickers.js");
      output(await tickersJpy(), fmt);
    },
  },
  depth: {
    description: "Get order book depth for a pair",
    handler: async (args, _v, fmt) => {
      const { depth } = await import("./public/depth.js");
      output(await depth(args[0]), fmt);
    },
  },
  transactions: {
    description: "Get recent transactions for a pair",
    handler: async (args, values, fmt) => {
      const { transactions } = await import("./public/transactions.js");
      output(await transactions(args[0], values.date as string | undefined), fmt);
    },
  },
  candles: {
    description: "Get candlestick OHLCV data",
    handler: async (args, values, fmt) => {
      const { candles } = await import("./public/candles.js");
      output(
        await candles(
          args[0],
          values.type as string | undefined,
          values.date as string | undefined,
          Number(values.limit ?? 100),
        ),
        fmt,
      );
    },
  },
  "circuit-break": {
    description: "Get circuit breaker info for a pair",
    handler: async (args, _v, fmt) => {
      const { circuitBreak } = await import("./public/circuit-break.js");
      output(await circuitBreak(args[0]), fmt);
    },
  },
  status: {
    description: "Get exchange status for all pairs",
    handler: async (_a, _v, fmt) => {
      const { status } = await import("./public/status.js");
      output(await status(), fmt);
    },
  },
  pairs: {
    description: "Get all pair settings",
    handler: async (_a, _v, fmt) => {
      const { pairs } = await import("./public/pairs.js");
      output(await pairs(), fmt);
    },
  },
};

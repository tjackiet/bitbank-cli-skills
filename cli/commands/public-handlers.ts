import type { CommandEntry } from "./handler-types.js";
import { handler } from "./make-handler.js";

const h = handler;

export const publicCommands: Record<string, CommandEntry> = {
  ticker: {
    description: "Get ticker for a pair (e.g. btc_jpy)",
    handler: h("./public/ticker.js", "ticker", (a) => [a[0]]),
  },
  tickers: {
    description: "Get tickers for all pairs",
    handler: h("./public/tickers.js", "tickers", () => []),
  },
  "tickers-jpy": {
    description: "Get tickers for all JPY pairs",
    handler: h("./public/tickers.js", "tickersJpy", () => []),
  },
  depth: {
    description: "Get order book depth for a pair",
    handler: h("./public/depth.js", "depth", (a) => [a[0]]),
  },
  transactions: {
    description: "Get recent transactions for a pair",
    handler: h("./public/transactions.js", "transactions", (a, v) => [
      a[0],
      v.date as string | undefined,
    ]),
  },
  candles: {
    description: "Get candlestick OHLCV data",
    handler: h("./public/candles.js", "candles", (a, v) => [
      a[0],
      v.type as string | undefined,
      v.date as string | undefined,
      v.from || v.to ? undefined : Number(v.limit ?? 100),
      v.from as string | undefined,
      v.to as string | undefined,
      v["no-cache"] === true,
    ]),
  },
  "circuit-break": {
    description: "Get circuit breaker info for a pair",
    handler: h("./public/circuit-break.js", "circuitBreak", (a) => [a[0]]),
  },
  status: {
    description: "Get exchange status for all pairs",
    handler: h("./public/status.js", "status", () => []),
  },
  pairs: {
    description: "Get all pair settings",
    handler: h("./public/pairs.js", "pairs", () => []),
  },
};

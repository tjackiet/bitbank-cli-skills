import type { CommandEntry } from "./handler-types.js";
import { valStr } from "./handler-types.js";
import { handler } from "./make-handler.js";

const h = handler;
const str = { type: "string" as const };

export const publicCommands: Record<string, CommandEntry> = {
  ticker: {
    description: "Get ticker for a pair (e.g. btc_jpy)",
    handler: h("./public/ticker.js", "ticker", (a) => ({ pair: a[0] })),
  },
  tickers: {
    description: "Get tickers for all pairs",
    handler: h("./public/tickers.js", "tickers", () => ({})),
  },
  "tickers-jpy": {
    description: "Get tickers for all JPY pairs",
    handler: h("./public/tickers.js", "tickersJpy", () => ({})),
  },
  depth: {
    description: "Get order book depth for a pair",
    handler: h("./public/depth.js", "depth", (a) => ({ pair: a[0] })),
  },
  transactions: {
    description: "Get recent transactions for a pair",
    options: { date: str },
    handler: h("./public/transactions.js", "transactions", (a, v) => ({
      pair: a[0],
      date: valStr(v, "date"),
    })),
  },
  candles: {
    description: "Get candlestick OHLCV data",
    options: {
      type: str,
      date: str,
      limit: { type: "string", default: "100" },
      from: str,
      to: str,
      "no-cache": { type: "boolean", default: false },
    },
    handler: h("./public/candles.js", "candles", (a, v) => ({
      pair: a[0],
      type: valStr(v, "type"),
      date: valStr(v, "date"),
      limit: v.limit !== undefined ? Number(v.limit) : undefined,
      from: valStr(v, "from"),
      to: valStr(v, "to"),
      noCache: v["no-cache"] === true,
    })),
  },
  "circuit-break": {
    description: "Get circuit breaker info for a pair",
    handler: h("./public/circuit-break.js", "circuitBreak", (a) => ({ pair: a[0] })),
  },
  status: {
    description: "Get exchange status for all pairs",
    handler: h("./public/status.js", "status", () => ({})),
  },
  pairs: {
    description: "Get all pair settings",
    handler: h("./public/pairs.js", "pairs", () => ({})),
  },
};

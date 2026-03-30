import { type SchemaDef, p } from "./types.js";

const pair = p("string", "Trading pair (e.g. btc_jpy)");
const n = { type: "number" };
const s = { type: "string" };

export const publicDataSchemas: Record<string, SchemaDef> = {
  candles: {
    category: "public",
    params: {
      pair,
      type: p("string", "Candle type", {
        enum: [
          "1min",
          "5min",
          "15min",
          "30min",
          "1hour",
          "4hour",
          "8hour",
          "12hour",
          "1day",
          "1week",
          "1month",
        ],
      }),
      date: p("string", "Date (YYYYMMDD or YYYY for >=4hour)"),
      limit: p("number", "Max rows (default 100)", { default: 100 }),
      from: p("string", "Range start (YYYYMMDD)"),
      to: p("string", "Range end (YYYYMMDD)"),
      "no-cache": p("boolean", "Skip cache"),
    },
    output: {
      type: "array",
      items: {
        type: "object",
        properties: { open: n, high: n, low: n, close: n, vol: n, timestamp: n },
      },
    },
  },
  "circuit-break": {
    category: "public",
    params: { pair },
    output: {
      type: "object",
      properties: {
        mode: s,
        estimated_itayose_price: { type: ["string", "null"] },
        estimated_itayose_amount: { type: ["string", "null"] },
        upper_trigger_price: s,
        lower_trigger_price: s,
        timestamp: n,
      },
    },
  },
  status: {
    category: "public",
    params: {},
    output: {
      type: "array",
      items: {
        type: "object",
        properties: { pair: s, status: s, min_amount: s, timestamp: n },
      },
    },
  },
  pairs: {
    category: "public",
    params: {},
    output: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: s,
          base_asset: s,
          quote_asset: s,
          maker_fee_rate_base_point: s,
          taker_fee_rate_base_point: s,
          unit_amount: s,
          limit_max_amount: s,
          market_max_amount: s,
        },
      },
    },
  },
};

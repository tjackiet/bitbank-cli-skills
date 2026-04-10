import type { CommandEntry } from "./handler-types.js";
import { handler } from "./make-handler.js";
import { tradeHistoryHandler } from "./private-trade-history-handler.js";

const h = handler;
const str = { type: "string" as const };
const bool = (d = false) => ({ type: "boolean" as const, default: d });

export const privateCommands: Record<string, CommandEntry> = {
  assets: {
    description: "Get your asset balances",
    options: { all: bool() },
    handler: h("./private/assets.js", "assets", (_a, v) => ({ showAll: !!v.all })),
  },
  order: {
    description: "Get a specific order",
    options: { pair: str, "order-id": str },
    handler: h("./private/order.js", "order", (_a, v) => ({
      pair: v.pair as string,
      orderId: v["order-id"] as string,
    })),
  },
  "orders-info": {
    description: "Get multiple orders by IDs",
    options: { pair: str, "order-ids": str },
    handler: h("./private/orders-info.js", "ordersInfo", (_a, v) => ({
      pair: v.pair as string,
      orderIds: v["order-ids"] as string,
    })),
  },
  "active-orders": {
    description: "Get active (open) orders",
    options: { pair: str, count: str, since: str, end: str },
    handler: h("./private/active-orders.js", "activeOrders", (_a, v) => ({
      pair: v.pair as string | undefined,
      count: v.count as string | undefined,
      since: v.since as string | undefined,
      end: v.end as string | undefined,
    })),
  },
  "trade-history": {
    description: "Get trade execution history",
    options: {
      pair: str,
      count: str,
      "order-id": str,
      since: str,
      end: str,
      order: str,
      all: bool(),
    },
    handler: tradeHistoryHandler,
  },
  "trade-history-all": {
    description: "Get all trade history (paginated)",
    options: { pair: str, since: str, end: str },
    handler: h("./private/trade-history-all.js", "tradeHistoryAll", (_a, v) => ({
      pair: v.pair as string | undefined,
      since: v.since as string | undefined,
      end: v.end as string | undefined,
    })),
  },
  "margin-status": {
    description: "Get margin account status",
    handler: h("./private/margin-status.js", "marginStatus", () => ({})),
  },
  "margin-positions": {
    description: "Get open margin positions",
    options: { pair: str },
    handler: h("./private/margin-positions.js", "marginPositions", (_a, v) => ({
      pair: v.pair as string | undefined,
    })),
  },
};

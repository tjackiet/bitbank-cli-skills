import type { CommandEntry } from "./handler-types.js";
import { handler } from "./make-handler.js";
import { tradeHistoryHandler } from "./private-trade-history-handler.js";

const h = handler;
const s = (v: unknown) => v as string | undefined;

export const privateCommands: Record<string, CommandEntry> = {
  assets: {
    description: "Get your asset balances",
    handler: h("./private/assets.js", "assets", (_a, v) => [!!v.all]),
  },
  order: {
    description: "Get a specific order",
    handler: h("./private/order.js", "order", (_a, v) => [
      v.pair as string,
      v["order-id"] as string,
    ]),
  },
  "orders-info": {
    description: "Get multiple orders by IDs",
    handler: h("./private/orders-info.js", "ordersInfo", (_a, v) => [
      v.pair as string,
      v["order-ids"] as string,
    ]),
  },
  "active-orders": {
    description: "Get active (open) orders",
    handler: h("./private/active-orders.js", "activeOrders", (_a, v) => [
      s(v.pair),
      s(v.count),
      s(v.since),
      s(v.end),
    ]),
  },
  "trade-history": {
    description: "Get trade execution history",
    handler: tradeHistoryHandler,
  },
  "trade-history-all": {
    description: "Get all trade history (paginated)",
    handler: h("./private/trade-history-all.js", "tradeHistoryAll", (_a, v) => [
      { pair: s(v.pair), since: s(v.since), end: s(v.end) },
    ]),
  },
  "deposit-history": {
    description: "Get deposit history",
    handler: h("./private/deposit-history.js", "depositHistory", (_a, v) => [
      s(v.asset),
      s(v.count),
      s(v.since),
      s(v.end),
    ]),
  },
  "unconfirmed-deposits": {
    description: "Get unconfirmed deposits",
    handler: h("./private/unconfirmed-deposits.js", "unconfirmedDeposits", (_a, v) => [s(v.asset)]),
  },
  "deposit-originators": {
    description: "Get deposit originator addresses",
    handler: h("./private/deposit-originators.js", "depositOriginators", (_a, v) => [s(v.asset)]),
  },
  "withdrawal-accounts": {
    description: "Get registered withdrawal accounts",
    handler: h("./private/withdrawal-accounts.js", "withdrawalAccounts", (_a, v) => [s(v.asset)]),
  },
  "withdrawal-history": {
    description: "Get withdrawal history",
    handler: h("./private/withdrawal-history.js", "withdrawalHistory", (_a, v) => [
      s(v.asset),
      s(v.count),
      s(v.since),
      s(v.end),
    ]),
  },
  "margin-status": {
    description: "Get margin account status",
    handler: h("./private/margin-status.js", "marginStatus", () => []),
  },
  "margin-positions": {
    description: "Get open margin positions",
    handler: h("./private/margin-positions.js", "marginPositions", (_a, v) => [s(v.pair)]),
  },
};

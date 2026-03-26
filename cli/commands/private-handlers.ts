import { output } from "../output.js";
import type { CommandHandler } from "./handler-types.js";

export const privateCommands: Record<string, { description: string; handler: CommandHandler }> = {
  assets: {
    description: "Get your asset balances",
    handler: async (_a, values, fmt) => {
      const { assets } = await import("./private/assets.js");
      output(await assets(!!values.all), fmt);
    },
  },
  order: {
    description: "Get a specific order",
    handler: async (_a, values, fmt) => {
      const { order } = await import("./private/order.js");
      output(await order(values.pair as string, values["order-id"] as string), fmt);
    },
  },
  "orders-info": {
    description: "Get multiple orders by IDs",
    handler: async (_a, values, fmt) => {
      const { ordersInfo } = await import("./private/orders-info.js");
      output(await ordersInfo(values.pair as string, values["order-ids"] as string), fmt);
    },
  },
  "active-orders": {
    description: "Get active (open) orders",
    handler: async (_a, values, fmt) => {
      const { activeOrders } = await import("./private/active-orders.js");
      output(
        await activeOrders(
          values.pair as string | undefined,
          values.count as string | undefined,
          values.since as string | undefined,
          values.end as string | undefined,
        ),
        fmt,
      );
    },
  },
  "trade-history": {
    description: "Get trade execution history",
    handler: async (_a, values, fmt) => {
      if (values.all) {
        const { tradeHistoryAll } = await import("./private/trade-history-all.js");
        output(
          await tradeHistoryAll({
            pair: values.pair as string | undefined,
            since: values.since as string | undefined,
            end: values.end as string | undefined,
          }),
          fmt,
        );
      } else {
        const { tradeHistory } = await import("./private/trade-history.js");
        output(
          await tradeHistory({
            pair: values.pair as string | undefined,
            count: values.count as string | undefined,
            orderId: values["order-id"] as string | undefined,
            since: values.since as string | undefined,
            end: values.end as string | undefined,
            order: values.order as string | undefined,
          }),
          fmt,
        );
      }
    },
  },
  "trade-history-all": {
    description: "Get all trade history (paginated)",
    handler: async (_a, values, fmt) => {
      const { tradeHistoryAll } = await import("./private/trade-history-all.js");
      output(
        await tradeHistoryAll({
          pair: values.pair as string | undefined,
          since: values.since as string | undefined,
          end: values.end as string | undefined,
        }),
        fmt,
      );
    },
  },
  "deposit-history": {
    description: "Get deposit history",
    handler: async (_a, values, fmt) => {
      const { depositHistory } = await import("./private/deposit-history.js");
      output(
        await depositHistory(
          values.asset as string | undefined,
          values.count as string | undefined,
          values.since as string | undefined,
          values.end as string | undefined,
        ),
        fmt,
      );
    },
  },
  "unconfirmed-deposits": {
    description: "Get unconfirmed deposits",
    handler: async (_a, values, fmt) => {
      const { unconfirmedDeposits } = await import("./private/unconfirmed-deposits.js");
      output(await unconfirmedDeposits(values.asset as string | undefined), fmt);
    },
  },
  "deposit-originators": {
    description: "Get deposit originator addresses",
    handler: async (_a, values, fmt) => {
      const { depositOriginators } = await import("./private/deposit-originators.js");
      output(await depositOriginators(values.asset as string | undefined), fmt);
    },
  },
  "withdrawal-accounts": {
    description: "Get registered withdrawal accounts",
    handler: async (_a, values, fmt) => {
      const { withdrawalAccounts } = await import("./private/withdrawal-accounts.js");
      output(await withdrawalAccounts(values.asset as string | undefined), fmt);
    },
  },
  "withdrawal-history": {
    description: "Get withdrawal history",
    handler: async (_a, values, fmt) => {
      const { withdrawalHistory } = await import("./private/withdrawal-history.js");
      output(
        await withdrawalHistory(
          values.asset as string | undefined,
          values.count as string | undefined,
          values.since as string | undefined,
          values.end as string | undefined,
        ),
        fmt,
      );
    },
  },
  "margin-status": {
    description: "Get margin account status",
    handler: async (_a, _v, fmt) => {
      const { marginStatus } = await import("./private/margin-status.js");
      output(await marginStatus(), fmt);
    },
  },
  "margin-positions": {
    description: "Get open margin positions",
    handler: async (_a, values, fmt) => {
      const { marginPositions } = await import("./private/margin-positions.js");
      output(await marginPositions(values.pair as string | undefined), fmt);
    },
  },
};

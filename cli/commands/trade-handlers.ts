import { output } from "../output.js";
import type { CommandHandler } from "./handler-types.js";

function isDryRun(r: { success: boolean; data?: unknown }): boolean {
  return r.success && typeof r.data === "object" && r.data !== null && "dryRun" in r.data;
}

export const tradeCommands: Record<string, { description: string; handler: CommandHandler }> = {
  "create-order": {
    description: "Create a spot order (dry-run default)",
    handler: async (_a, values, fmt) => {
      const { createOrder } = await import("./trade/create-order.js");
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
      if (!isDryRun(r)) output(r, fmt);
    },
  },
  "cancel-order": {
    description: "Cancel a spot order (dry-run default)",
    handler: async (_a, values, fmt) => {
      const { cancelOrder } = await import("./trade/cancel-order.js");
      const r = await cancelOrder({
        pair: values.pair as string | undefined,
        orderId: values["order-id"] as string | undefined,
        execute: !!values.execute,
      });
      if (!isDryRun(r)) output(r, fmt);
    },
  },
  "cancel-orders": {
    description: "Cancel multiple spot orders (dry-run default)",
    handler: async (_a, values, fmt) => {
      const { cancelOrders } = await import("./trade/cancel-orders.js");
      const r = await cancelOrders({
        pair: values.pair as string | undefined,
        orderIds: values["order-ids"] as string | undefined,
        execute: !!values.execute,
      });
      if (!isDryRun(r)) output(r, fmt);
    },
  },
  "confirm-deposits": {
    description: "Confirm a deposit (dry-run default)",
    handler: async (_a, values, fmt) => {
      const { confirmDeposits } = await import("./trade/confirm-deposits.js");
      const r = await confirmDeposits({
        id: values.id as string | undefined,
        execute: !!values.execute,
      });
      if (!isDryRun(r)) output(r, fmt);
    },
  },
  "confirm-deposits-all": {
    description: "Confirm all deposits (dry-run default)",
    handler: async (_a, values, fmt) => {
      const { confirmDepositsAll } = await import("./trade/confirm-deposits-all.js");
      const r = await confirmDepositsAll({ execute: !!values.execute });
      if (!isDryRun(r)) output(r, fmt);
    },
  },
  withdraw: {
    description: "Request withdrawal (dry-run default, requires --confirm)",
    handler: async (_a, values, fmt) => {
      const { withdraw } = await import("./trade/withdraw.js");
      const r = await withdraw({
        asset: values.asset as string | undefined,
        uuid: values.uuid as string | undefined,
        amount: values.amount as string | undefined,
        token: values.token as string | undefined,
        execute: !!values.execute,
        confirm: !!values.confirm,
      });
      if (!isDryRun(r)) output(r, fmt);
    },
  },
};

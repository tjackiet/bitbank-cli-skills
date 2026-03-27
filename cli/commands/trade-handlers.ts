import type { CommandEntry } from "./handler-types.js";
import { tradeHandler } from "./make-handler.js";

const th = tradeHandler;

export const tradeCommands: Record<string, CommandEntry> = {
  "create-order": {
    description: "Create a spot order (dry-run default)",
    handler: th("./trade/create-order.js", "createOrder", (v) => ({
      pair: v.pair as string | undefined,
      side: v.side as string | undefined,
      type: v.type as string | undefined,
      price: v.price as string | undefined,
      amount: v.amount as string | undefined,
      triggerPrice: v["trigger-price"] as string | undefined,
      postOnly: !!v["post-only"],
      execute: !!v.execute,
    })),
  },
  "cancel-order": {
    description: "Cancel a spot order (dry-run default)",
    handler: th("./trade/cancel-order.js", "cancelOrder", (v) => ({
      pair: v.pair as string | undefined,
      orderId: v["order-id"] as string | undefined,
      execute: !!v.execute,
    })),
  },
  "cancel-orders": {
    description: "Cancel multiple spot orders (dry-run default)",
    handler: th("./trade/cancel-orders.js", "cancelOrders", (v) => ({
      pair: v.pair as string | undefined,
      orderIds: v["order-ids"] as string | undefined,
      execute: !!v.execute,
    })),
  },
  "confirm-deposits": {
    description: "Confirm a deposit (dry-run default)",
    handler: th("./trade/confirm-deposits.js", "confirmDeposits", (v) => ({
      id: v.id as string | undefined,
      execute: !!v.execute,
    })),
  },
  "confirm-deposits-all": {
    description: "Confirm all deposits (dry-run default)",
    handler: th("./trade/confirm-deposits-all.js", "confirmDepositsAll", (v) => ({
      execute: !!v.execute,
    })),
  },
  withdraw: {
    description: "Request withdrawal (dry-run default, requires --confirm)",
    handler: th("./trade/withdraw.js", "withdraw", (v) => ({
      asset: v.asset as string | undefined,
      uuid: v.uuid as string | undefined,
      amount: v.amount as string | undefined,
      token: v.token as string | undefined,
      execute: !!v.execute,
      confirm: !!v.confirm,
    })),
  },
};

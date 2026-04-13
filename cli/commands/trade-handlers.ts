import type { CommandEntry } from "./handler-types.js";
import { bool, str, valStr } from "./handler-types.js";
import { tradeHandler } from "./make-handler.js";

const th = tradeHandler;

export const tradeCommands: Record<string, CommandEntry> = {
  "create-order": {
    description: "Create a spot order (dry-run default)",
    options: {
      pair: str,
      side: str,
      type: str,
      price: str,
      amount: str,
      "trigger-price": str,
      "post-only": bool(),
      execute: bool(),
    },
    handler: th("./trade/create-order.js", "createOrder", (v) => ({
      pair: valStr(v, "pair"),
      side: valStr(v, "side"),
      type: valStr(v, "type"),
      price: valStr(v, "price"),
      amount: valStr(v, "amount"),
      triggerPrice: valStr(v, "trigger-price"),
      postOnly: !!v["post-only"],
      execute: !!v.execute,
    })),
  },
  "cancel-order": {
    description: "Cancel a spot order (dry-run default)",
    options: { pair: str, "order-id": str, execute: bool() },
    handler: th("./trade/cancel-order.js", "cancelOrder", (v) => ({
      pair: valStr(v, "pair"),
      orderId: valStr(v, "order-id"),
      execute: !!v.execute,
    })),
  },
  "cancel-orders": {
    description: "Cancel multiple spot orders (dry-run default)",
    options: { pair: str, "order-ids": str, execute: bool() },
    handler: th("./trade/cancel-orders.js", "cancelOrders", (v) => ({
      pair: valStr(v, "pair"),
      orderIds: valStr(v, "order-ids"),
      execute: !!v.execute,
    })),
  },
  "confirm-deposits": {
    description: "Confirm a deposit (dry-run default)",
    options: { id: str, execute: bool() },
    handler: th("./trade/confirm-deposits.js", "confirmDeposits", (v) => ({
      id: valStr(v, "id"),
      execute: !!v.execute,
    })),
  },
  "confirm-deposits-all": {
    description: "Confirm all deposits (dry-run default)",
    options: { execute: bool() },
    handler: th("./trade/confirm-deposits-all.js", "confirmDepositsAll", (v) => ({
      execute: !!v.execute,
    })),
  },
  withdraw: {
    description: "Request withdrawal (dry-run default, requires --confirm)",
    options: { asset: str, uuid: str, amount: str, token: str, execute: bool(), confirm: bool() },
    handler: th("./trade/withdraw.js", "withdraw", (v) => ({
      asset: valStr(v, "asset"),
      uuid: valStr(v, "uuid"),
      amount: valStr(v, "amount"),
      token: valStr(v, "token"),
      execute: !!v.execute,
      confirm: !!v.confirm,
    })),
  },
};

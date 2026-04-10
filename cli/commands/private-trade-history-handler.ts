import { output } from "../output.js";
import type { CommandHandler } from "./handler-types.js";
import { valStr } from "./handler-types.js";

/** trade-history は --all フラグで分岐するためカスタムハンドラー */
export const tradeHistoryHandler: CommandHandler = async (_a, values, fmt) => {
  if (values.all) {
    const { tradeHistoryAll } = await import("./private/trade-history-all.js");
    output(
      await tradeHistoryAll({
        pair: valStr(values, "pair"),
        since: valStr(values, "since"),
        end: valStr(values, "end"),
      }),
      fmt,
    );
  } else {
    const { tradeHistory } = await import("./private/trade-history.js");
    output(
      await tradeHistory({
        pair: valStr(values, "pair"),
        count: valStr(values, "count"),
        orderId: valStr(values, "order-id"),
        since: valStr(values, "since"),
        end: valStr(values, "end"),
        order: valStr(values, "order"),
      }),
      fmt,
    );
  }
};

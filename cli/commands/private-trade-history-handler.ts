import { output } from "../output.js";
import type { CommandHandler } from "./handler-types.js";

/** trade-history は --all フラグで分岐するためカスタムハンドラー */
export const tradeHistoryHandler: CommandHandler = async (_a, values, fmt) => {
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
};

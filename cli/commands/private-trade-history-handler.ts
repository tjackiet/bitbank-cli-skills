import { output } from "../output.js";
import type { CommandHandler } from "./handler-types.js";

const s = (v: unknown) => v as string | undefined;

/** trade-history は --all フラグで分岐するためカスタムハンドラー */
export const tradeHistoryHandler: CommandHandler = async (_a, values, fmt) => {
  if (values.all) {
    const { tradeHistoryAll } = await import("./private/trade-history-all.js");
    output(
      await tradeHistoryAll({
        pair: s(values.pair),
        since: s(values.since),
        end: s(values.end),
      }),
      fmt,
    );
  } else {
    const { tradeHistory } = await import("./private/trade-history.js");
    output(
      await tradeHistory({
        pair: s(values.pair),
        count: s(values.count),
        orderId: s(values["order-id"]),
        since: s(values.since),
        end: s(values.end),
        order: s(values.order),
      }),
      fmt,
    );
  }
};

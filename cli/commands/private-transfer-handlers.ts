import type { CommandEntry } from "./handler-types.js";
import { valStr } from "./handler-types.js";
import { handler } from "./make-handler.js";

const h = handler;
const str = { type: "string" as const };

export const privateTransferCommands: Record<string, CommandEntry> = {
  "deposit-history": {
    description: "Get deposit history",
    options: { asset: str, count: str, since: str, end: str },
    handler: h("./private/deposit-history.js", "depositHistory", (_a, v) => ({
      asset: valStr(v, "asset"),
      count: valStr(v, "count"),
      since: valStr(v, "since"),
      end: valStr(v, "end"),
    })),
  },
  "unconfirmed-deposits": {
    description: "Get unconfirmed deposits",
    options: { asset: str },
    handler: h("./private/unconfirmed-deposits.js", "unconfirmedDeposits", (_a, v) => ({
      asset: valStr(v, "asset"),
    })),
  },
  "deposit-originators": {
    description: "Get deposit originator addresses",
    options: { asset: str },
    handler: h("./private/deposit-originators.js", "depositOriginators", (_a, v) => ({
      asset: valStr(v, "asset"),
    })),
  },
  "withdrawal-accounts": {
    description: "Get registered withdrawal accounts",
    options: { asset: str },
    handler: h("./private/withdrawal-accounts.js", "withdrawalAccounts", (_a, v) => ({
      asset: valStr(v, "asset"),
    })),
  },
  "withdrawal-history": {
    description: "Get withdrawal history",
    options: { asset: str, count: str, since: str, end: str },
    handler: h("./private/withdrawal-history.js", "withdrawalHistory", (_a, v) => ({
      asset: valStr(v, "asset"),
      count: valStr(v, "count"),
      since: valStr(v, "since"),
      end: valStr(v, "end"),
    })),
  },
};

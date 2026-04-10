import type { CommandEntry } from "./handler-types.js";
import { handler } from "./make-handler.js";

const h = handler;
const str = { type: "string" as const };

export const privateTransferCommands: Record<string, CommandEntry> = {
  "deposit-history": {
    description: "Get deposit history",
    options: { asset: str, count: str, since: str, end: str },
    handler: h("./private/deposit-history.js", "depositHistory", (_a, v) => ({
      asset: v.asset as string | undefined,
      count: v.count as string | undefined,
      since: v.since as string | undefined,
      end: v.end as string | undefined,
    })),
  },
  "unconfirmed-deposits": {
    description: "Get unconfirmed deposits",
    options: { asset: str },
    handler: h("./private/unconfirmed-deposits.js", "unconfirmedDeposits", (_a, v) => ({
      asset: v.asset as string | undefined,
    })),
  },
  "deposit-originators": {
    description: "Get deposit originator addresses",
    options: { asset: str },
    handler: h("./private/deposit-originators.js", "depositOriginators", (_a, v) => ({
      asset: v.asset as string | undefined,
    })),
  },
  "withdrawal-accounts": {
    description: "Get registered withdrawal accounts",
    options: { asset: str },
    handler: h("./private/withdrawal-accounts.js", "withdrawalAccounts", (_a, v) => ({
      asset: v.asset as string | undefined,
    })),
  },
  "withdrawal-history": {
    description: "Get withdrawal history",
    options: { asset: str, count: str, since: str, end: str },
    handler: h("./private/withdrawal-history.js", "withdrawalHistory", (_a, v) => ({
      asset: v.asset as string | undefined,
      count: v.count as string | undefined,
      since: v.since as string | undefined,
      end: v.end as string | undefined,
    })),
  },
};

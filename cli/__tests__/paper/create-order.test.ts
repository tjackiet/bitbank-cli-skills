// 100行超: 成行/指値発注の分岐を網羅
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { paperCreateOrder } from "../../commands/paper/create-order.js";
import { paperInit } from "../../commands/paper/init.js";
import { EXIT } from "../../exit-codes.js";
import { mockFetchData } from "../test-helpers.js";

const tickerOf = (last: string) =>
  mockFetchData({
    sell: last,
    buy: last,
    high: last,
    low: last,
    open: last,
    last,
    vol: "10",
    timestamp: 1700000000000,
  });

let dir: string;
let statePath: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "paper-co-"));
  statePath = join(dir, "paper-state.json");
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("paper create-order", () => {
  it("market buy fills at last price and updates balances", async () => {
    await paperInit({ jpy: "1000000", statePath });
    const r = await paperCreateOrder(
      { pair: "btc_jpy", side: "buy", type: "market", amount: "0.001", feeRate: 0, statePath },
      { fetch: tickerOf("5000000"), retries: 0 },
    );
    expect(r.success).toBe(true);
    if (!r.success || !("fillPrice" in r.data)) return;
    expect(r.data.fillPrice).toBe(5000000);
    expect(r.data.balances.jpy).toBe(1000000 - 5000);
    expect(r.data.balances.btc).toBe(0.001);
  });

  it("market sell deducts base and adds quote (minus fee)", async () => {
    await paperInit({ jpy: "1000000", statePath });
    // Seed with btc by buying first (fee=0 keeps math clean)
    await paperCreateOrder(
      { pair: "btc_jpy", side: "buy", type: "market", amount: "0.01", feeRate: 0, statePath },
      { fetch: tickerOf("5000000"), retries: 0 },
    );
    const r = await paperCreateOrder(
      { pair: "btc_jpy", side: "sell", type: "market", amount: "0.005", feeRate: 0, statePath },
      { fetch: tickerOf("6000000"), retries: 0 },
    );
    expect(r.success).toBe(true);
    if (!r.success || !("balances" in r.data)) return;
    expect(r.data.balances.btc).toBeCloseTo(0.005, 10);
    // Started with 1,000,000 - 0.01 * 5,000,000 = 950,000, then +0.005*6,000,000 = 980,000
    expect(r.data.balances.jpy).toBeCloseTo(980000, 6);
  });

  it("returns Err when buying with insufficient JPY", async () => {
    await paperInit({ jpy: "1000", statePath });
    const r = await paperCreateOrder(
      { pair: "btc_jpy", side: "buy", type: "market", amount: "0.001", feeRate: 0, statePath },
      { fetch: tickerOf("5000000"), retries: 0 },
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("insufficient");
  });

  it("returns Err when selling more base than held", async () => {
    await paperInit({ jpy: "1000000", statePath });
    const r = await paperCreateOrder(
      { pair: "btc_jpy", side: "sell", type: "market", amount: "0.001", feeRate: 0, statePath },
      { fetch: tickerOf("5000000"), retries: 0 },
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("insufficient");
  });

  it("returns Err when state is not initialized", async () => {
    const r = await paperCreateOrder(
      { pair: "btc_jpy", side: "buy", type: "market", amount: "0.001", feeRate: 0, statePath },
      { fetch: tickerOf("5000000"), retries: 0 },
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("not initialized");
  });

  it("requires --price for limit orders", async () => {
    await paperInit({ jpy: "1000000", statePath });
    const r = await paperCreateOrder(
      { pair: "btc_jpy", side: "buy", type: "limit", amount: "0.001", statePath },
      { fetch: tickerOf("5000000"), retries: 0 },
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("price");
  });

  it("persists fill into history", async () => {
    await paperInit({ jpy: "1000000", statePath });
    await paperCreateOrder(
      { pair: "btc_jpy", side: "buy", type: "market", amount: "0.001", feeRate: 0, statePath },
      { fetch: tickerOf("5000000"), retries: 0 },
    );
    const raw = JSON.parse(readFileSync(statePath, "utf-8"));
    expect(raw.history).toHaveLength(1);
    expect(raw.history[0].pair).toBe("btc_jpy");
    expect(raw.history[0].fillPrice).toBe(5000000);
    expect(existsSync(statePath)).toBe(true);
  });

  it("rejects --amount=0 with PARAM exit code", async () => {
    await paperInit({ jpy: "1000000", statePath });
    const r = await paperCreateOrder(
      { pair: "btc_jpy", side: "buy", type: "market", amount: "0", feeRate: 0, statePath },
      { fetch: tickerOf("5000000"), retries: 0 },
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.exitCode).toBe(EXIT.PARAM);
  });

  it("rejects negative --amount with PARAM exit code", async () => {
    await paperInit({ jpy: "1000000", statePath });
    const r = await paperCreateOrder(
      { pair: "btc_jpy", side: "buy", type: "market", amount: "-1", feeRate: 0, statePath },
      { fetch: tickerOf("5000000"), retries: 0 },
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.exitCode).toBe(EXIT.PARAM);
  });

  it("rejects --price=0 on limit orders with PARAM exit code", async () => {
    await paperInit({ jpy: "1000000", statePath });
    const r = await paperCreateOrder(
      {
        pair: "btc_jpy",
        side: "buy",
        type: "limit",
        amount: "0.001",
        price: "0",
        feeRate: 0,
        statePath,
      },
      { fetch: tickerOf("5000000"), retries: 0 },
    );
    expect(r.success).toBe(false);
    if (!r.success) expect(r.exitCode).toBe(EXIT.PARAM);
  });

  it("applies taker fee to buy cost", async () => {
    await paperInit({ jpy: "1000000", statePath });
    const r = await paperCreateOrder(
      { pair: "btc_jpy", side: "buy", type: "market", amount: "0.001", feeRate: 0.001, statePath },
      { fetch: tickerOf("5000000"), retries: 0 },
    );
    expect(r.success).toBe(true);
    if (!r.success || !("feeJpy" in r.data)) return;
    // notional 5000, fee 5 → jpy = 1,000,000 - 5005 = 994,995
    expect(r.data.feeJpy).toBeCloseTo(5, 10);
    expect(r.data.balances.jpy).toBeCloseTo(994995, 6);
  });
});

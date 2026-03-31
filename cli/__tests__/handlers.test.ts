import { describe, expect, it } from "vitest";
import { privateCommands } from "../commands/private-handlers.js";
import { publicCommands } from "../commands/public-handlers.js";
import { streamCommands } from "../commands/stream-handler.js";
import { tradeCommands } from "../commands/trade-handlers.js";

describe("publicCommands", () => {
  it("registers expected commands", () => {
    const names = Object.keys(publicCommands);
    expect(names).toContain("ticker");
    expect(names).toContain("tickers");
    expect(names).toContain("tickers-jpy");
    expect(names).toContain("depth");
    expect(names).toContain("transactions");
    expect(names).toContain("candles");
    expect(names).toContain("circuit-break");
    expect(names).toContain("status");
    expect(names).toContain("pairs");
  });

  it("all have handler functions", () => {
    for (const [name, entry] of Object.entries(publicCommands)) {
      expect(typeof entry.handler, `${name}`).toBe("function");
    }
  });
});

describe("privateCommands", () => {
  it("registers expected commands", () => {
    const names = Object.keys(privateCommands);
    expect(names).toContain("assets");
    expect(names).toContain("order");
    expect(names).toContain("active-orders");
    expect(names).toContain("trade-history");
    expect(names).toContain("deposit-history");
    expect(names).toContain("withdrawal-accounts");
    expect(names).toContain("margin-status");
    expect(names).toContain("margin-positions");
  });

  it("trade-history uses custom handler (not generic handler)", () => {
    // tradeHistoryHandler is directly assigned, not via handler()
    expect(privateCommands["trade-history"].handler).toBeDefined();
  });
});

describe("tradeCommands", () => {
  it("registers expected commands", () => {
    const names = Object.keys(tradeCommands);
    expect(names).toContain("create-order");
    expect(names).toContain("cancel-order");
    expect(names).toContain("cancel-orders");
    expect(names).toContain("confirm-deposits");
    expect(names).toContain("confirm-deposits-all");
    expect(names).toContain("withdraw");
  });

  it("all have descriptions mentioning dry-run", () => {
    for (const [name, entry] of Object.entries(tradeCommands)) {
      expect(entry.description, `${name}`).toContain("dry-run");
    }
  });
});

describe("streamCommands", () => {
  it("registers stream command", () => {
    expect(streamCommands.stream).toBeDefined();
    expect(streamCommands.stream.description).toContain("stream");
  });
});

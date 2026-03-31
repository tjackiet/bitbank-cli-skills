import { describe, expect, it } from "vitest";
import { COMMANDS } from "../commands/registry.js";

describe("COMMANDS registry", () => {
  it("includes public commands", () => {
    expect(COMMANDS.ticker).toBeDefined();
    expect(COMMANDS.ticker.description).toContain("ticker");
    expect(COMMANDS.depth).toBeDefined();
    expect(COMMANDS.candles).toBeDefined();
    expect(COMMANDS.status).toBeDefined();
    expect(COMMANDS.pairs).toBeDefined();
  });

  it("includes private commands", () => {
    expect(COMMANDS.assets).toBeDefined();
    expect(COMMANDS.order).toBeDefined();
    expect(COMMANDS["active-orders"]).toBeDefined();
    expect(COMMANDS["trade-history"]).toBeDefined();
  });

  it("includes trade commands", () => {
    expect(COMMANDS["create-order"]).toBeDefined();
    expect(COMMANDS["cancel-order"]).toBeDefined();
    expect(COMMANDS.withdraw).toBeDefined();
  });

  it("includes stream command", () => {
    expect(COMMANDS.stream).toBeDefined();
    expect(COMMANDS.stream.description).toContain("stream");
  });

  it("all entries have description and handler", () => {
    for (const [name, entry] of Object.entries(COMMANDS)) {
      expect(entry.description, `${name} missing description`).toBeTruthy();
      expect(typeof entry.handler, `${name} handler not a function`).toBe("function");
    }
  });
});

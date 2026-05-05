import { describe, expect, it } from "vitest";
import { COMMANDS, PAPER_COMMANDS, TRADE_COMMANDS } from "../../commands/registry.js";
import { resolveCommand } from "../../router.js";

describe("PAPER_COMMANDS registry", () => {
  it("includes all paper subcommands", () => {
    expect(PAPER_COMMANDS.init).toBeDefined();
    expect(PAPER_COMMANDS.assets).toBeDefined();
    expect(PAPER_COMMANDS["create-order"]).toBeDefined();
    expect(PAPER_COMMANDS["active-orders"]).toBeDefined();
    expect(PAPER_COMMANDS["cancel-order"]).toBeDefined();
    expect(PAPER_COMMANDS.tick).toBeDefined();
    expect(PAPER_COMMANDS["trade-history"]).toBeDefined();
    expect(PAPER_COMMANDS.reset).toBeDefined();
  });

  it("paper subcommands do not leak into top-level COMMANDS or TRADE_COMMANDS", () => {
    expect(COMMANDS.init).toBeUndefined();
    expect(COMMANDS.reset).toBeUndefined();
    expect(TRADE_COMMANDS.init).toBeUndefined();
    expect(TRADE_COMMANDS.reset).toBeUndefined();
  });

  it("all entries have description and handler", () => {
    for (const [name, entry] of Object.entries(PAPER_COMMANDS)) {
      expect(entry.description, `${name} missing description`).toBeTruthy();
      expect(typeof entry.handler, `${name} handler not a function`).toBe("function");
    }
  });
});

describe("resolveCommand for paper", () => {
  it("paper alone is isPaper=true with undefined entry", () => {
    const r = resolveCommand(["paper"]);
    expect(r.isPaper).toBe(true);
    expect(r.isTrade).toBe(false);
    expect(r.entry).toBeUndefined();
  });

  it("paper init resolves to PAPER_COMMANDS.init", () => {
    const r = resolveCommand(["paper", "init"]);
    expect(r.isPaper).toBe(true);
    expect(r.command).toBe("init");
    expect(r.entry).toBe(PAPER_COMMANDS.init);
  });

  it("paper unknown returns undefined entry", () => {
    const r = resolveCommand(["paper", "nope"]);
    expect(r.isPaper).toBe(true);
    expect(r.entry).toBeUndefined();
  });
});

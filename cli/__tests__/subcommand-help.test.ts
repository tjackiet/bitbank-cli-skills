import { describe, expect, it } from "vitest";
import { buildHelp } from "../commands/schema/help.js";

describe("subcommand help", () => {
  it("shows usage, description, and category", () => {
    const text = buildHelp("candles", "Get candlestick OHLCV data");
    expect(text).toContain("Usage: bitbank candles");
    expect(text).toContain("Get candlestick OHLCV data");
    expect(text).toContain("Category: public");
  });

  it("lists parameters with type and description", () => {
    const text = buildHelp("candles", "Get candlestick OHLCV data");
    expect(text).toContain("--pair");
    expect(text).toContain("Trading pair");
    expect(text).toContain("--type");
    expect(text).toContain("Type: string");
  });

  it("shows enum values", () => {
    const text = buildHelp("candles", "Get candlestick OHLCV data");
    expect(text).toContain("Values: 1min,");
    expect(text).toContain("1hour");
  });

  it("shows default values", () => {
    const text = buildHelp("candles", "Get candlestick OHLCV data");
    expect(text).toContain("Default: 100");
  });

  it("shows examples", () => {
    const text = buildHelp("candles", "Get candlestick OHLCV data");
    expect(text).toContain("Examples:");
    expect(text).toContain("bitbank candles --pair=btc_jpy");
    expect(text).toContain("--format=table");
  });

  it("shows (none) for commands without parameters", () => {
    const text = buildHelp("status", "Get exchange status");
    expect(text).toContain("Parameters: (none)");
  });

  it("returns null for unknown commands", () => {
    expect(buildHelp("nonexistent", "desc")).toBeNull();
  });

  it("works for trade commands with execute flag", () => {
    const text = buildHelp("create-order", "Create a spot order");
    expect(text).toContain("--side");
    expect(text).toContain("Values: buy, sell");
    expect(text).toContain("--execute");
    expect(text).toContain("Category: trade");
  });

  it("works for private commands", () => {
    const text = buildHelp("assets", "Get your asset balances");
    expect(text).toContain("Category: private");
    expect(text).toContain("--all");
  });
});

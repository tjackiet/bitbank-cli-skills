import { describe, expect, it } from "vitest";
import { buildSchemaHandler } from "../commands/schema/handler.js";
import { captureStdout } from "./test-helpers.js";

const DESC: Record<string, string> = {
  ticker: "Get ticker for a pair",
  candles: "Get candlestick OHLCV data",
  assets: "Get your asset balances",
  "create-order": "Create a spot order (dry-run default)",
  stream: "Subscribe to real-time stream",
};

describe("schema list", () => {
  it("lists all commands in json format", async () => {
    const c = captureStdout();
    try {
      await buildSchemaHandler(DESC)([], {}, "json");
      const data = JSON.parse(c.read());
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      const ticker = data.find((d: { command: string }) => d.command === "ticker");
      expect(ticker).toBeDefined();
      expect(ticker.category).toBe("public");
      expect(ticker.params).toContain("pair");
    } finally {
      c.restore();
    }
  });

  it("supports table format", async () => {
    const c = captureStdout();
    try {
      await buildSchemaHandler(DESC)([], {}, "table");
      const out = c.read();
      expect(out).toContain("command");
      expect(out).toContain("ticker");
    } finally {
      c.restore();
    }
  });
});

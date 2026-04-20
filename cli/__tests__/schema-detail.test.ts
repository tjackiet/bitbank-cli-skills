import { describe, expect, it } from "vitest";
import { buildSchemaHandler } from "../commands/schema/handler.js";
import { captureStdout } from "./test-helpers.js";

const DESC: Record<string, string> = {
  ticker: "Get ticker for a pair",
  candles: "Get candlestick OHLCV data",
  "create-order": "Create a spot order (dry-run default)",
};

describe("schema detail", () => {
  it("returns detail for ticker", async () => {
    const c = captureStdout();
    try {
      await buildSchemaHandler(DESC)(["ticker"], {}, "json");
      const data = JSON.parse(c.read());
      expect(data.command).toBe("ticker");
      expect(data.category).toBe("public");
      expect(data.params.type).toBe("object");
      expect(data.params.properties.pair).toBeDefined();
      expect(data.output.type).toBe("object");
      expect(data.output.properties.sell).toBeDefined();
    } finally {
      c.restore();
    }
  });

  it("returns candles schema with enum and default", async () => {
    const c = captureStdout();
    try {
      await buildSchemaHandler(DESC)(["candles"], {}, "json");
      const data = JSON.parse(c.read());
      expect(data.params.properties.type.enum).toContain("1hour");
      expect(data.params.properties.limit.default).toBe(100);
    } finally {
      c.restore();
    }
  });

  it("returns error for unknown command", async () => {
    const c = captureStdout();
    const origErr = process.stderr.write.bind(process.stderr);
    let errBuf = "";
    process.stderr.write = ((chunk: string | Uint8Array) => {
      errBuf += String(chunk);
      return true;
    }) as typeof process.stderr.write;
    try {
      await buildSchemaHandler(DESC)(["nonexistent"], {}, "json");
      expect(errBuf).toContain("Unknown command");
    } finally {
      c.restore();
      process.stderr.write = origErr;
    }
  });

  it("includes trade command execute param and side enum", async () => {
    const c = captureStdout();
    try {
      await buildSchemaHandler(DESC)(["create-order"], {}, "json");
      const data = JSON.parse(c.read());
      expect(data.category).toBe("trade");
      expect(data.command).toBe("trade create-order");
      expect(data.params.properties.execute).toBeDefined();
      expect(data.params.properties.side.enum).toContain("buy");
    } finally {
      c.restore();
    }
  });

  it("accepts 'trade <name>' two-arg form", async () => {
    const c = captureStdout();
    try {
      await buildSchemaHandler(DESC)(["trade", "create-order"], {}, "json");
      const data = JSON.parse(c.read());
      expect(data.command).toBe("trade create-order");
      expect(data.category).toBe("trade");
    } finally {
      c.restore();
    }
  });
});

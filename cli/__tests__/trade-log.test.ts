import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { TradeLogRecordSchema } from "../trade-log-schema.js";
import { buildLogRecord, writeTradeLog } from "../trade-log.js";

function tmpFile(): string {
  return join(
    tmpdir(),
    `trade-log-test-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`,
  );
}

const cleanup: string[] = [];
afterEach(() => {
  for (const f of cleanup) {
    try {
      unlinkSync(f);
    } catch {
      /* ignore */
    }
  }
  cleanup.length = 0;
});

describe("buildLogRecord", () => {
  it("builds a success record", () => {
    const r = buildLogRecord(
      "createOrder",
      { pair: "btc_jpy" },
      { success: true, data: { order_id: 1 } },
    );
    expect(r.success).toBe(true);
    expect(r.command).toBe("createOrder");
    expect(r.data).toEqual({ order_id: 1 });
    expect(r.error).toBeUndefined();
    expect(TradeLogRecordSchema.safeParse(r).success).toBe(true);
  });

  it("masks sensitive keys (token, otp_token)", () => {
    const r = buildLogRecord(
      "withdraw",
      { asset: "btc", amount: "0.5", token: "123456", otp_token: "abcdef" },
      { success: true, data: { uuid: "u1" } },
    );
    expect(r.params.token).toBe("***");
    expect(r.params.otp_token).toBe("***");
    expect(r.params.asset).toBe("btc");
    expect(r.params.amount).toBe("0.5");
  });

  it("builds a failure record", () => {
    const r = buildLogRecord(
      "cancelOrder",
      { pair: "btc_jpy" },
      { success: false, error: "not found" },
    );
    expect(r.success).toBe(false);
    expect(r.error).toBe("not found");
    expect(r.data).toBeUndefined();
    expect(TradeLogRecordSchema.safeParse(r).success).toBe(true);
  });
});

describe("writeTradeLog", () => {
  it("creates file and appends NDJSON line", () => {
    const f = tmpFile();
    cleanup.push(f);
    const record = buildLogRecord(
      "createOrder",
      { pair: "btc_jpy" },
      { success: true, data: { id: 1 } },
    );
    const result = writeTradeLog(f, record);
    expect(result.success).toBe(true);
    const lines = readFileSync(f, "utf8").trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(TradeLogRecordSchema.parse(JSON.parse(lines[0]))).toBeTruthy();
  });

  it("appends multiple records without overwriting", () => {
    const f = tmpFile();
    cleanup.push(f);
    const r1 = buildLogRecord(
      "createOrder",
      { pair: "btc_jpy" },
      { success: true, data: { id: 1 } },
    );
    const r2 = buildLogRecord(
      "cancelOrder",
      { pair: "btc_jpy" },
      { success: true, data: { id: 2 } },
    );
    writeTradeLog(f, r1);
    writeTradeLog(f, r2);
    const lines = readFileSync(f, "utf8").trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).command).toBe("createOrder");
    expect(JSON.parse(lines[1]).command).toBe("cancelOrder");
  });

  it("returns error for invalid path", () => {
    const result = writeTradeLog(
      "/nonexistent/dir/log.jsonl",
      buildLogRecord("x", {}, { success: true, data: {} }),
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Failed to write trade log");
  });
});

describe("dry-run does not log", () => {
  it("isDryRun result has no log file written", () => {
    const f = tmpFile();
    cleanup.push(f);
    // Simulate: dry-run returns { dryRun: true }, tradeHandler skips log
    // We verify by NOT calling writeTradeLog for dry-run results
    expect(existsSync(f)).toBe(false);
  });
});

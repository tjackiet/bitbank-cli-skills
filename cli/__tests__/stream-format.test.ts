import { beforeEach, describe, expect, it, vi } from "vitest";
import { type StreamMessage, writeStreamMessage } from "../stream-format.js";

let written: string;
beforeEach(() => {
  written = "";
  vi.spyOn(process.stdout, "write").mockImplementation((s) => {
    written += String(s);
    return true;
  });
});

function msg(channel: string, data: unknown): StreamMessage {
  return { channel, timestamp: 1700000000000, data };
}

describe("writeStreamMessage json", () => {
  it("outputs JSONL for ticker", () => {
    writeStreamMessage(msg("ticker_btc_jpy", { last: "100", vol: "5" }), "json");
    const parsed = JSON.parse(written.trim());
    expect(parsed.channel).toBe("ticker_btc_jpy");
    expect(parsed.data.last).toBe("100");
  });

  it("outputs JSONL for private event", () => {
    writeStreamMessage(msg("spot_trade", { price: "100" }), "json");
    const parsed = JSON.parse(written.trim());
    expect(parsed.channel).toBe("spot_trade");
  });
});

describe("writeStreamMessage table", () => {
  it("formats ticker", () => {
    writeStreamMessage(msg("ticker_btc_jpy", { last: "15580000", vol: "1234.5" }), "table");
    expect(written).toContain("TICKER");
    expect(written).toContain("btc_jpy");
    expect(written).toContain("15,580,000");
  });

  it("formats transactions", () => {
    const data = { transactions: [{ side: "buy", amount: "0.05", price: "15580000" }] };
    writeStreamMessage(msg("transactions_btc_jpy", data), "table");
    expect(written).toContain("TRADE");
    expect(written).toContain("Buy");
    expect(written).toContain("0.05");
  });

  it("formats depth_diff", () => {
    writeStreamMessage(msg("depth_diff_btc_jpy", { asks: [[1], [2]], bids: [[3]] }), "table");
    expect(written).toContain("DEPTH_DIFF");
    expect(written).toContain("asks: 2");
    expect(written).toContain("bids: 1");
  });

  it("formats depth_whole", () => {
    writeStreamMessage(msg("depth_whole_btc_jpy", { asks: [], bids: [[1]] }), "table");
    expect(written).toContain("DEPTH_WHOLE");
  });

  it("formats circuit_break_info", () => {
    writeStreamMessage(msg("circuit_break_info_btc_jpy", { mode: "NONE" }), "table");
    expect(written).toContain("CIRCUIT");
    expect(written).toContain("NONE");
  });

  it("formats unknown/private events as JSON", () => {
    writeStreamMessage(msg("asset_update", { free: "1000" }), "table");
    expect(written).toContain("asset_update");
    expect(written).toContain("1000");
  });
});

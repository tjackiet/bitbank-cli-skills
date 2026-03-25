export type StreamMessage = {
  channel: string;
  timestamp: number;
  data: unknown;
};

export type StreamFormat = "json" | "table";

export function writeStreamMessage(msg: StreamMessage, format: StreamFormat): void {
  const line = format === "json" ? formatJson(msg) : formatTable(msg);
  if (line) process.stdout.write(line + "\n");
}

function formatJson(msg: StreamMessage): string {
  return JSON.stringify(msg);
}

function formatTable(msg: StreamMessage): string {
  const time = new Date(msg.timestamp).toLocaleTimeString("ja-JP", { hour12: false });
  const chan = msg.channel;
  const data = msg.data as Record<string, unknown>;

  if (chan.startsWith("ticker_")) {
    const pair = chan.slice(7);
    return `[${time}] TICKER ${pair}  Last: ${fmtNum(data.last)}  Vol: ${fmtNum(data.vol)}`;
  }
  if (chan.startsWith("transactions_")) {
    const pair = chan.slice(13);
    const txs = (data.transactions ?? []) as Array<Record<string, unknown>>;
    if (txs.length === 0) return `[${time}] TRADE  ${pair}  (no transactions)`;
    return txs
      .map((tx) => `[${time}] TRADE  ${pair}  ${ucFirst(tx.side)} ${tx.amount} @ ${fmtNum(tx.price)}`)
      .join("\n");
  }
  if (chan.startsWith("depth_diff_") || chan.startsWith("depth_whole_")) {
    const isDiff = chan.startsWith("depth_diff_");
    const pair = chan.slice(isDiff ? 11 : 12);
    const label = isDiff ? "DEPTH_DIFF" : "DEPTH_WHOLE";
    const asks = Array.isArray(data.asks) ? data.asks.length : 0;
    const bids = Array.isArray(data.bids) ? data.bids.length : 0;
    return `[${time}] ${label} ${pair}  asks: ${asks}, bids: ${bids}`;
  }
  if (chan.startsWith("circuit_break_info_")) {
    const pair = chan.slice(19);
    return `[${time}] CIRCUIT ${pair}  mode: ${data.mode}`;
  }
  // Private stream events or unknown channels
  return `[${time}] ${chan}  ${JSON.stringify(data)}`;
}

function fmtNum(v: unknown): string {
  const n = Number(v);
  return isNaN(n) ? String(v ?? "") : n.toLocaleString();
}

function ucFirst(v: unknown): string {
  const s = String(v ?? "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

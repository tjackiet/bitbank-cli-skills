export type StreamMessage = {
  channel: string;
  timestamp: number;
  data: unknown;
};

export type StreamFormat = "json" | "table";

export function writeStreamMessage(msg: StreamMessage, format: StreamFormat): void {
  const line = format === "json" ? formatJson(msg) : formatTable(msg);
  if (line) process.stdout.write(`${line}\n`);
}

function formatJson(msg: StreamMessage): string {
  return JSON.stringify(msg);
}

type Renderer = (pair: string, time: string, data: Record<string, unknown>) => string;

function depthLine(label: string): Renderer {
  return (pair, time, data) => {
    const asks = Array.isArray(data.asks) ? data.asks.length : 0;
    const bids = Array.isArray(data.bids) ? data.bids.length : 0;
    return `[${time}] ${label} ${pair}  asks: ${asks}, bids: ${bids}`;
  };
}

const PUBLIC_CHANNEL_RENDERERS: Array<{ prefix: string; render: Renderer }> = [
  {
    prefix: "ticker_",
    render: (pair, time, data) =>
      `[${time}] TICKER ${pair}  Last: ${fmtNum(data.last)}  Vol: ${fmtNum(data.vol)}`,
  },
  {
    prefix: "transactions_",
    render: (pair, time, data) => {
      const txs = (data.transactions ?? []) as Array<Record<string, unknown>>;
      if (txs.length === 0) return `[${time}] TRADE  ${pair}  (no transactions)`;
      return txs
        .map(
          (tx) =>
            `[${time}] TRADE  ${pair}  ${ucFirst(tx.side)} ${tx.amount} @ ${fmtNum(tx.price)}`,
        )
        .join("\n");
    },
  },
  { prefix: "depth_diff_", render: depthLine("DEPTH_DIFF") },
  { prefix: "depth_whole_", render: depthLine("DEPTH_WHOLE") },
  {
    prefix: "circuit_break_info_",
    render: (pair, time, data) => `[${time}] CIRCUIT ${pair}  mode: ${data.mode}`,
  },
];

function formatTable(msg: StreamMessage): string {
  const time = new Date(msg.timestamp).toLocaleTimeString("ja-JP", { hour12: false });
  const data = msg.data as Record<string, unknown>;
  for (const { prefix, render } of PUBLIC_CHANNEL_RENDERERS) {
    if (msg.channel.startsWith(prefix)) {
      return render(msg.channel.slice(prefix.length), time, data);
    }
  }
  return `[${time}] ${msg.channel}  ${JSON.stringify(data)}`;
}

function fmtNum(v: unknown): string {
  const n = Number(v);
  return Number.isNaN(n) ? String(v ?? "") : n.toLocaleString();
}

function ucFirst(v: unknown): string {
  const s = String(v ?? "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

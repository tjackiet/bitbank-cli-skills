export type TickerData = {
  ts: string;
  pair: string;
  last: string;
  bid: string;
  ask: string;
  high: string;
  low: string;
  vol: string;
};

export type WatchFormat = "json" | "table";

export function formatJsonl(t: TickerData): string {
  return JSON.stringify(t);
}

const ANSI_CLEAR_LINE = "\x1b[2K\r";
const ANSI_CURSOR_UP = "\x1b[1A";

export type TickerWriter = (t: TickerData) => void;

export function createJsonlWriter(): TickerWriter {
  return (t) => process.stdout.write(`${formatJsonl(t)}\n`);
}

export function createTableWriter(): TickerWriter {
  let drawn = false;
  return (t) => {
    const time = t.ts.length >= 19 ? t.ts.slice(11, 19) : t.ts;
    const line =
      `${t.pair}  last=${t.last}  bid=${t.bid}  ask=${t.ask}  ` +
      `high=${t.high}  low=${t.low}  vol=${t.vol}  @${time}`;
    const out = drawn ? `${ANSI_CURSOR_UP}${ANSI_CLEAR_LINE}${line}\n` : `${line}\n`;
    process.stdout.write(out);
    drawn = true;
  };
}

export function createWriter(fmt: WatchFormat): TickerWriter {
  return fmt === "table" ? createTableWriter() : createJsonlWriter();
}

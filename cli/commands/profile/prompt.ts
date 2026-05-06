/** Interactive prompts for profile add. Hidden secret input avoids leaking
 * the secret to the terminal scrollback / shell history (flag-based input is
 * forbidden because shells log argv). */

export type Prompts = {
  readVisible: (prompt: string) => Promise<string>;
  readHidden: (prompt: string) => Promise<string>;
};

// 連続する readChunkedLine 呼び出し間で改行を跨ぐ追加データを保持する。
// パイプから "key\nsecret\n" を 1 chunk で受け取った場合に 2 回目以降の
// 呼び出しが取り残されないようにする
let pendingBuf = "";

function takeBufferedLine(): string | null {
  const nl = pendingBuf.indexOf("\n");
  if (nl === -1) return null;
  const line = pendingBuf.slice(0, nl).replace(/\r$/, "");
  pendingBuf = pendingBuf.slice(nl + 1);
  return line;
}

function readChunkedLine(): Promise<string> {
  const buffered = takeBufferedLine();
  if (buffered !== null) return Promise.resolve(buffered);
  return new Promise((resolve) => {
    const cleanup = () => {
      process.stdin.removeListener("data", onData);
      process.stdin.removeListener("end", onEnd);
      process.stdin.pause();
    };
    const onData = (chunk: Buffer) => {
      pendingBuf += chunk.toString("utf-8");
      const line = takeBufferedLine();
      if (line !== null) {
        cleanup();
        resolve(line);
      }
    };
    const onEnd = () => {
      // EOF: flush whatever is buffered without a trailing newline
      const rest = pendingBuf.replace(/\r$/, "");
      pendingBuf = "";
      cleanup();
      resolve(rest);
    };
    process.stdin.on("data", onData);
    process.stdin.once("end", onEnd);
    process.stdin.resume();
  });
}

async function readVisible(prompt: string): Promise<string> {
  process.stderr.write(prompt);
  return readChunkedLine();
}

async function readHidden(prompt: string): Promise<string> {
  process.stderr.write(prompt);
  if (!process.stdin.isTTY) {
    return readChunkedLine();
  }
  return new Promise((resolve) => {
    let buf = "";
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const finish = (val: string) => {
      process.stdin.setRawMode(false);
      process.stdin.removeListener("data", onData);
      process.stdin.removeListener("end", onEnd);
      process.stdin.removeListener("close", onEnd);
      process.stdin.pause();
      process.stderr.write("\n");
      resolve(val);
    };
    const onEnd = () => finish(buf);
    const onData = (chunk: Buffer) => {
      const s = chunk.toString("utf-8");
      for (const ch of s) {
        const code = ch.charCodeAt(0);
        if (code === 3) {
          finish("");
          process.exit(130);
          return;
        }
        if (code === 13 || code === 10 || code === 4) {
          finish(buf);
          return;
        }
        if (code === 127 || code === 8) buf = buf.slice(0, -1);
        else if (code >= 32) buf += ch;
      }
    };
    process.stdin.on("data", onData);
    process.stdin.once("end", onEnd);
    process.stdin.once("close", onEnd);
  });
}

export const defaultPrompts: Prompts = { readVisible, readHidden };

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, resolve, sep } from "node:path";

const CACHE_BASE = join(homedir(), ".bitbank-cache");
const memCache = new Map<string, unknown>();

/** パストラバーサルを防止: セグメントに / \ .. . を含む場合 null を返す */
function sanitizeSegment(s: string): string | null {
  if (s === "." || /[/\\]|\.\./.test(s) || s.length === 0) return null;
  return s;
}

function cacheKey(pair: string, type: string, date: string): string {
  return `${pair}/${type}/${date}`;
}

function cachePath(pair: string, type: string, date: string): string | null {
  const sp = sanitizeSegment(pair);
  const st = sanitizeSegment(type);
  const sd = sanitizeSegment(date);
  if (!sp || !st || !sd) return null;
  const p = join(CACHE_BASE, sp, st, `${sd}.json`);
  // resolve して CACHE_BASE 配下であることを二重確認
  const resolvedBase = resolve(CACHE_BASE);
  if (!resolve(p).startsWith(resolvedBase + sep)) return null;
  return p;
}

/** シンボリックリンク経由のキャッシュ外アクセスを防止 */
function isSymlinkSafe(filePath: string): boolean {
  try {
    const real = realpathSync(filePath);
    const realBase = realpathSync(CACHE_BASE);
    return real.startsWith(realBase + sep) || real === realBase;
  } catch {
    return false;
  }
}

export function readCache<T>(pair: string, type: string, date: string): T | null {
  const key = cacheKey(pair, type, date);
  const mem = memCache.get(key);
  if (mem !== undefined) return mem as T;

  const p = cachePath(pair, type, date);
  if (!p || !existsSync(p)) return null;
  if (!isSymlinkSafe(p)) return null;
  try {
    const data = JSON.parse(readFileSync(p, "utf-8")) as T;
    memCache.set(key, data);
    return data;
  } catch {
    return null;
  }
}

export function writeCache(pair: string, type: string, date: string, data: unknown): void {
  const p = cachePath(pair, type, date);
  if (!p) return;
  memCache.set(cacheKey(pair, type, date), data);
  const dir = join(p, "..");
  mkdirSync(dir, { recursive: true });
  // 書き込み先がシンボリックリンクなら中止
  if (existsSync(p) && lstatSync(p).isSymbolicLink()) return;
  writeFileSync(p, JSON.stringify(data));
}

/** テスト用: インメモリキャッシュをクリア */
export function clearMemCache(): void {
  memCache.clear();
}

/** 期間が完了済み（不変データ）ならキャッシュ対象 */
export function isCompletePeriod(date: string): boolean {
  const now = new Date();
  if (date.length === 4) {
    return Number(date) < now.getFullYear();
  }
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return date < `${y}${m}${d}`;
}

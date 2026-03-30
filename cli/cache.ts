import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CACHE_BASE = join(homedir(), ".bitbank-cache");

function cachePath(pair: string, type: string, date: string): string {
  return join(CACHE_BASE, pair, type, `${date}.json`);
}

export function readCache<T>(pair: string, type: string, date: string): T | null {
  const p = cachePath(pair, type, date);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function writeCache(pair: string, type: string, date: string, data: unknown): void {
  const p = cachePath(pair, type, date);
  mkdirSync(join(CACHE_BASE, pair, type), { recursive: true });
  writeFileSync(p, JSON.stringify(data));
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

import type { RateLimitInfo } from "./types.js";

export type Bucket = "public" | "private";

type BucketState = { lastRequestMs: number; rateLimit?: RateLimitInfo };

const buckets: Record<Bucket, BucketState> = {
  public: { lastRequestMs: 0 },
  private: { lastRequestMs: 0 },
};

/** public は積極スロットル、private（取引系）は緩めにして即時性を確保 */
const DEFAULTS: Record<Bucket, { throttleMs: number; lowWaterMark: number }> = {
  public: { throttleMs: 100, lowWaterMark: 5 },
  private: { throttleMs: 0, lowWaterMark: 3 },
};

export function detectBucket(url: string): Bucket {
  return url.includes("public.bitbank.cc") ? "public" : "private";
}

/**
 * リクエスト送信前にスロットル判定を行う。
 * 1. X-RateLimit-Remaining が閾値を下回っていたらリセットまで待機
 * 2. 前回リクエストからの経過時間が throttleMs 未満なら差分だけ待機
 */
export async function waitForSlot(bucket: Bucket, throttleMs?: number): Promise<void> {
  const st = buckets[bucket];
  const def = DEFAULTS[bucket];
  const interval = throttleMs ?? def.throttleMs;

  // Remaining-based: 残数が閾値を下回ったらリセットまで待機
  const rl = st.rateLimit;
  if (rl && rl.remaining >= 0 && rl.remaining < def.lowWaterMark && rl.reset > 0) {
    const wait = rl.reset * 1000 - Date.now();
    if (wait > 0) await new Promise<void>((r) => setTimeout(r, wait));
    st.rateLimit = undefined;
  }

  // Time-based: 最小インターバルを確保
  if (interval > 0) {
    const elapsed = Date.now() - st.lastRequestMs;
    if (elapsed < interval) {
      await new Promise<void>((r) => setTimeout(r, interval - elapsed));
    }
  }

  st.lastRequestMs = Date.now();
}

export function updateRateLimit(bucket: Bucket, rl: RateLimitInfo | undefined): void {
  if (rl) buckets[bucket].rateLimit = rl;
}

/** テスト用: 状態リセット */
export function resetThrottle(): void {
  for (const b of Object.keys(buckets) as Bucket[]) {
    buckets[b] = { lastRequestMs: 0 };
  }
}

import { apiErrorExitCode, formatApiError } from "./error-codes.js";
import { EXIT, type ExitCode } from "./exit-codes.js";
import { extractRateLimit } from "./rate-limit.js";
import { detectBucket, updateRateLimit, waitForSlot } from "./throttle.js";
import type { Result } from "./types.js";

export { ERROR_CODES, apiErrorExitCode, formatApiError } from "./error-codes.js";

export function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500;
}
const BASE_DELAY_MS = 500; // 指数バックオフのベース遅延（ms）
function parseRetryAfter(v: string): number | null {
  if (/^\d+$/.test(v)) return Number(v) * 1000;
  const ts = /[a-z]/i.test(v) ? Date.parse(v) : Number.NaN;
  return ts > 0 ? Math.max(0, ts - Date.now()) : null;
}
export async function retryDelay(res: Response | null, attempt: number): Promise<void> {
  const after = res?.status === 429 ? res.headers.get("Retry-After") : null;
  const ms = (after ? parseRetryAfter(after) : null) ?? 2 ** attempt * BASE_DELAY_MS;
  await new Promise((r) => setTimeout(r, ms));
}

export type BaseFetchOptions = {
  timeoutMs?: number;
  retries?: number;
  fetch?: typeof globalThis.fetch;
  /** プロアクティブスロットルの最小インターバル(ms)。省略時はバケット既定値 */
  throttleMs?: number;
};

export async function fetchWithRetry<T>(
  url: string,
  init: RequestInit,
  opts: BaseFetchOptions,
  parseError: (body: { data?: { code?: number } }) => string,
): Promise<Result<T>> {
  const { timeoutMs = 5000, retries = 2, fetch: fetchFn = globalThis.fetch } = opts;
  const bucket = detectBucket(url);

  let lastError = "";
  let lastExitCode: ExitCode = EXIT.GENERAL;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt === 0) await waitForSlot(bucket, opts.throttleMs);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetchFn(url, { ...init, signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        if (shouldRetry(res.status) && attempt < retries) {
          await retryDelay(res, attempt + 1);
          continue;
        }
        lastError = `HTTP ${res.status}: ${res.statusText}`;
        lastExitCode = res.status === 401 || res.status === 403 ? EXIT.AUTH : EXIT.GENERAL;
        continue;
      }
      const body = await res.json();
      if (body.success !== 1) {
        const code = body.data?.code ?? 0;
        if (code === 60001 && attempt < retries) {
          await retryDelay(null, attempt + 1);
          continue;
        }
        return { success: false, error: parseError(body), exitCode: apiErrorExitCode(code) };
      }
      const rl = extractRateLimit(res.headers);
      updateRateLimit(bucket, rl);
      return { success: true, data: body.data as T, ...(rl && { meta: { rateLimit: rl } }) };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      lastExitCode = EXIT.NETWORK;
      if (attempt < retries) {
        await retryDelay(null, attempt + 1);
      }
    }
  }
  return { success: false, error: lastError, exitCode: lastExitCode };
}

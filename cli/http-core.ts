import { EXIT, type ExitCode } from "./exit-codes.js";
import type { Result } from "./types.js";

export const ERROR_CODES: Record<number, string> = {
  10000: "URL不正",
  20001: "API認証失敗",
  20002: "APIキー不正",
  20003: "APIキー権限不足",
  30001: "注文数量不正",
  30006: "注文数量下限",
  30007: "注文数量上限",
  30012: "残高不足",
  40001: "不正なパラメータ",
  50003: "現在取引不可",
  50004: "注文不可（板寄せ中）",
  50009: "注文不可（サーキットブレーカー）",
  60001: "レート制限",
  70001: "システムエラー",
};

export function apiErrorExitCode(code: number): (typeof EXIT)[keyof typeof EXIT] {
  if (code >= 20001 && code <= 20003) return EXIT.AUTH;
  if (code === 60001) return EXIT.RATE_LIMIT;
  if (code >= 30001 && code <= 40001) return EXIT.PARAM;
  return EXIT.GENERAL;
}

export function formatApiError(code: number): string {
  const msg = ERROR_CODES[code];
  return msg ? `${code}: ${msg}` : `API error: ${code}`;
}

export function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500;
}

export async function retryDelay(res: Response | null, attempt: number): Promise<void> {
  if (res?.status === 429) {
    const after = res.headers.get("Retry-After");
    const ms = after ? Number(after) * 1000 : 2 ** attempt * 500;
    await new Promise((r) => setTimeout(r, ms));
  } else {
    await new Promise((r) => setTimeout(r, 2 ** attempt * 500));
  }
}

export type BaseFetchOptions = {
  timeoutMs?: number;
  retries?: number;
  fetch?: typeof globalThis.fetch;
};

export async function fetchWithRetry<T>(
  url: string,
  init: RequestInit,
  opts: BaseFetchOptions,
  parseError: (body: { data?: { code?: number } }) => string,
): Promise<Result<T>> {
  const { timeoutMs = 5000, retries = 2, fetch: fetchFn = globalThis.fetch } = opts;

  let lastError = "";
  let lastExitCode: ExitCode = EXIT.GENERAL;
  for (let attempt = 0; attempt <= retries; attempt++) {
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
      return { success: true, data: body.data as T };
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

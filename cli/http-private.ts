import { type ApiCredentials, authHeadersGet, authHeadersPost, loadCredentials } from "./auth.js";
import type { Result } from "./types.js";

const PRIVATE_BASE_URL = "https://api.bitbank.cc/v1";

type FetchFn = typeof globalThis.fetch;

export type PrivateHttpOptions = {
  timeoutMs?: number;
  retries?: number;
  fetch?: FetchFn;
  credentials?: ApiCredentials;
  nonce?: string;
};

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

function formatError(code: number): string {
  const msg = ERROR_CODES[code];
  return msg ? `${code}: ${msg}` : `API error: ${code}`;
}

function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500;
}

async function retryDelay(res: Response, attempt: number): Promise<void> {
  if (res.status === 429) {
    const after = res.headers.get("Retry-After");
    const ms = after ? Number(after) * 1000 : 2 ** attempt * 500;
    await new Promise((r) => setTimeout(r, ms));
  } else {
    await new Promise((r) => setTimeout(r, 2 ** attempt * 500));
  }
}

export async function privateGet<T>(
  path: string,
  params?: Record<string, string>,
  opts: PrivateHttpOptions = {},
): Promise<Result<T>> {
  const creds = opts.credentials ?? loadCredentials();
  if ("error" in creds) return { success: false, error: creds.error };

  const { timeoutMs = 5000, retries = 2, fetch: fetchFn = globalThis.fetch } = opts;
  const qs =
    params && Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : "";
  const url = `${PRIVATE_BASE_URL}${path}${qs}`;
  const headers = authHeadersGet(creds, path, qs, opts.nonce);

  let lastError = "";
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetchFn(url, { headers, signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        if (shouldRetry(res.status) && attempt < retries) {
          await retryDelay(res, attempt + 1);
          continue;
        }
        lastError = `HTTP ${res.status}: ${res.statusText}`;
        continue;
      }
      const body = await res.json();
      if (body.success !== 1) {
        return { success: false, error: formatError(body.data?.code) };
      }
      return { success: true, data: body.data as T };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 2 ** (attempt + 1) * 500));
      }
    }
  }
  return { success: false, error: lastError };
}

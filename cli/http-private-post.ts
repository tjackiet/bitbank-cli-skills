import { type Result } from "./types.js";
import {
  loadCredentials,
  authHeadersPost,
  type ApiCredentials,
} from "./auth.js";
import { ERROR_CODES } from "./http-private.js";

const PRIVATE_BASE_URL = "https://api.bitbank.cc/v1";

type FetchFn = typeof globalThis.fetch;

export type PrivatePostOptions = {
  timeoutMs?: number;
  retries?: number;
  fetch?: FetchFn;
  credentials?: ApiCredentials;
  nonce?: string;
};

function formatError(code: number): string {
  const msg = ERROR_CODES[code];
  return msg ? `${code}: ${msg}` : `API error: ${code}`;
}

function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500;
}

export async function privatePost<T>(
  path: string,
  body?: Record<string, unknown>,
  opts: PrivatePostOptions = {},
): Promise<Result<T>> {
  const creds = opts.credentials ?? loadCredentials();
  if ("error" in creds) return { success: false, error: creds.error };

  const { timeoutMs = 5000, retries = 2, fetch: fetchFn = globalThis.fetch } = opts;
  const url = `${PRIVATE_BASE_URL}${path}`;
  const jsonBody = body ? JSON.stringify(body) : "";
  const headers = authHeadersPost(creds, jsonBody, opts.nonce);

  let lastError = "";
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetchFn(url, {
        method: "POST",
        headers,
        body: jsonBody || undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        if (shouldRetry(res.status) && attempt < retries) {
          const after = res.headers.get("Retry-After");
          const ms = after ? Number(after) * 1000 : 2 ** (attempt + 1) * 500;
          await new Promise((r) => setTimeout(r, ms));
          continue;
        }
        lastError = `HTTP ${res.status}: ${res.statusText}`;
        continue;
      }
      const resBody = await res.json();
      if (resBody.success !== 1) {
        return { success: false, error: formatError(resBody.data?.code) };
      }
      return { success: true, data: resBody.data as T };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 2 ** (attempt + 1) * 500));
      }
    }
  }
  return { success: false, error: lastError };
}

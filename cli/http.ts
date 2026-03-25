import { type Result } from "./types.js";

const PUBLIC_BASE_URL = "https://public.bitbank.cc";

type FetchFn = typeof globalThis.fetch;

export type HttpOptions = {
  timeoutMs?: number;
  retries?: number;
  fetch?: FetchFn;
};

export async function publicGet<T>(
  path: string,
  opts: HttpOptions = {},
): Promise<Result<T>> {
  const { timeoutMs = 5000, retries = 2, fetch: fetchFn = globalThis.fetch } = opts;
  const url = `${PUBLIC_BASE_URL}${path}`;

  let lastError = "";
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 2 ** attempt * 500));
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetchFn(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        lastError = `HTTP ${res.status}: ${res.statusText}`;
        continue;
      }
      const body = await res.json();
      if (body.success !== 1) {
        return { success: false, error: body.data?.code?.toString() ?? "API error" };
      }
      return { success: true, data: body.data as T };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  return { success: false, error: lastError };
}

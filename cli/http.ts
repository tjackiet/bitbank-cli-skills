import { type BaseFetchOptions, fetchWithRetry } from "./http-core.js";
import type { Result } from "./types.js";

const PUBLIC_BASE_URL = "https://public.bitbank.cc";

export type HttpOptions = BaseFetchOptions;

export async function publicGet<T>(path: string, opts: HttpOptions = {}): Promise<Result<T>> {
  const url = `${PUBLIC_BASE_URL}${path}`;
  return fetchWithRetry<T>(url, {}, opts, (body) => body.data?.code?.toString() ?? "API error");
}

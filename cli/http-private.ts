import { type ApiCredentials, authHeadersGet } from "./auth.js";
import { type BaseFetchOptions, ERROR_CODES, fetchWithRetry, formatApiError } from "./http-core.js";
import { resolveCredentials } from "./profiles-resolver.js";
import type { Result } from "./types.js";

export const PRIVATE_BASE_URL = "https://api.bitbank.cc/v1";

export { ERROR_CODES };

export type PrivateHttpOptions = BaseFetchOptions & {
  credentials?: ApiCredentials;
  nonce?: string;
};

export async function privateGet<T>(
  path: string,
  params?: Record<string, string>,
  opts: PrivateHttpOptions = {},
): Promise<Result<T>> {
  let creds: ApiCredentials;
  if (opts.credentials) {
    creds = opts.credentials;
  } else {
    const r = resolveCredentials();
    if (!r.success) return r;
    creds = r.data;
  }

  const qs =
    params && Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : "";
  const url = `${PRIVATE_BASE_URL}${path}${qs}`;
  const headers = authHeadersGet(creds, path, qs, opts.nonce);

  return fetchWithRetry<T>(url, { headers }, opts, (body) => formatApiError(body.data?.code ?? 0));
}

import { type ApiCredentials, authHeadersPost } from "./auth.js";
import { type BaseFetchOptions, fetchWithRetry, formatApiError } from "./http-core.js";
import { PRIVATE_BASE_URL } from "./http-private.js";
import { resolveCredentials } from "./profiles-resolver.js";
import type { Result } from "./types.js";

export type PrivatePostOptions = BaseFetchOptions & {
  credentials?: ApiCredentials;
  nonce?: string;
};

export async function privatePost<T>(
  path: string,
  body?: Record<string, unknown>,
  opts: PrivatePostOptions = {},
): Promise<Result<T>> {
  let creds: ApiCredentials;
  if (opts.credentials) {
    creds = opts.credentials;
  } else {
    const r = resolveCredentials();
    if (!r.success) return r;
    creds = r.data;
  }

  const url = `${PRIVATE_BASE_URL}${path}`;
  const jsonBody = body ? JSON.stringify(body) : "";
  const headers = authHeadersPost(creds, jsonBody, opts.nonce);

  return fetchWithRetry<T>(
    url,
    { method: "POST", headers, body: jsonBody || undefined },
    { ...opts, retries: 0, retryOnNetworkError: false },
    (b) => formatApiError(b.data?.code ?? 0),
  );
}

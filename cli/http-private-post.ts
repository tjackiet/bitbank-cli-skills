import { type ApiCredentials, authHeadersPost, loadCredentials } from "./auth.js";
import { EXIT } from "./exit-codes.js";
import { type BaseFetchOptions, fetchWithRetry, formatApiError } from "./http-core.js";
import { PRIVATE_BASE_URL } from "./http-private.js";
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
  const creds = opts.credentials ?? loadCredentials();
  if ("error" in creds) return { success: false, error: creds.error, exitCode: EXIT.AUTH };

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

import { type ApiCredentials, authHeadersGet, loadCredentials } from "./auth.js";
import { EXIT } from "./exit-codes.js";
import { type BaseFetchOptions, ERROR_CODES, fetchWithRetry, formatApiError } from "./http-core.js";
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
  const creds = opts.credentials ?? loadCredentials();
  if ("error" in creds) return { success: false, error: creds.error, exitCode: EXIT.AUTH };

  const qs =
    params && Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : "";
  const url = `${PRIVATE_BASE_URL}${path}${qs}`;
  const headers = authHeadersGet(creds, path, qs, opts.nonce);

  return fetchWithRetry<T>(url, { headers }, opts, (body) => formatApiError(body.data?.code ?? 0));
}

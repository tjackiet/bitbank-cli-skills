import { createHmac } from "node:crypto";

export type ApiCredentials = {
  apiKey: string;
  apiSecret: string;
};

export function loadCredentials(): ApiCredentials | { error: string } {
  const apiKey = process.env.BITBANK_API_KEY;
  const apiSecret = process.env.BITBANK_API_SECRET;
  if (!apiKey || !apiSecret) {
    return {
      error:
        "BITBANK_API_KEY and BITBANK_API_SECRET must be set. " +
        "Export them or use: node --env-file=.env",
    };
  }
  return { apiKey, apiSecret };
}

export function signGet(
  nonce: string,
  path: string,
  queryString: string,
  secret: string,
): string {
  const message = nonce + "/v1" + path + queryString;
  return createHmac("sha256", secret).update(message).digest("hex");
}

export function signPost(
  nonce: string,
  body: string,
  secret: string,
): string {
  const message = nonce + body;
  return createHmac("sha256", secret).update(message).digest("hex");
}

const TIME_WINDOW = "5000";

export function authHeadersGet(
  creds: ApiCredentials,
  path: string,
  queryString: string,
  nonce?: string,
): Record<string, string> {
  const n = nonce ?? Date.now().toString();
  return {
    "ACCESS-KEY": creds.apiKey,
    "ACCESS-NONCE": n,
    "ACCESS-SIGNATURE": signGet(n, path, queryString, creds.apiSecret),
    "ACCESS-TIME-WINDOW": TIME_WINDOW,
  };
}

export function authHeadersPost(
  creds: ApiCredentials,
  body: string,
  nonce?: string,
): Record<string, string> {
  const n = nonce ?? Date.now().toString();
  return {
    "ACCESS-KEY": creds.apiKey,
    "ACCESS-NONCE": n,
    "ACCESS-SIGNATURE": signPost(n, body, creds.apiSecret),
    "ACCESS-TIME-WINDOW": TIME_WINDOW,
    "Content-Type": "application/json",
  };
}

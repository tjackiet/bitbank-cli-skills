import PubNub from "pubnub";
import { type ApiCredentials, loadCredentials } from "../../auth.js";
import { type PrivateHttpOptions, privateGet } from "../../http-private.js";
import type { Result } from "../../types.js";
import { type StreamFormat, writeStreamMessage } from "./format.js";

const SUBSCRIBE_KEY = "sub-c-ecebae8e-dd60-11e6-b6b1-02ee2ddab7fe";
// Refresh 5 minutes before the 12-hour TTL expires
const TOKEN_REFRESH_MS = (12 * 60 - 5) * 60 * 1000;

type SubscribeResponse = {
  pubnub_channel: string;
  pubnub_token: string;
};

export type PrivateStreamOptions = {
  format: StreamFormat;
  filter?: string[];
  credentials?: ApiCredentials;
  httpOpts?: PrivateHttpOptions;
};

export async function startPrivateStream(
  opts: PrivateStreamOptions,
): Promise<Result<{ stop: () => void }>> {
  const creds = opts.credentials ?? loadCredentials();
  if ("error" in creds) return { success: false, error: creds.error };

  const httpOpts = { ...opts.httpOpts, credentials: creds };
  const sub = await privateGet<SubscribeResponse>("/user/subscribe", undefined, httpOpts);
  if (!sub.success) return sub;

  const pubnub = new PubNub({
    subscribeKey: SUBSCRIBE_KEY,
    userId: sub.data.pubnub_channel,
  });
  pubnub.setToken(sub.data.pubnub_token);

  pubnub.addListener({
    message: (event) => {
      const data = event.message as Record<string, unknown>;
      const eventType = String(data.event_type ?? event.channel);
      if (opts.filter?.length && !opts.filter.includes(eventType)) return;
      writeStreamMessage({ channel: eventType, timestamp: Date.now(), data }, opts.format);
    },
    status: (event) => {
      if (event.category === "PNConnectedCategory") {
        process.stderr.write(`Private stream connected: ${sub.data.pubnub_channel}\n`);
      }
    },
  });

  pubnub.subscribe({ channels: [sub.data.pubnub_channel] });

  const refreshTimer = setInterval(async () => {
    const fresh = await privateGet<SubscribeResponse>("/user/subscribe", undefined, httpOpts);
    if (fresh.success) {
      pubnub.setToken(fresh.data.pubnub_token);
      process.stderr.write("Token refreshed.\n");
    } else {
      process.stderr.write(`Token refresh failed: ${fresh.error}\n`);
    }
  }, TOKEN_REFRESH_MS);

  const stop = (): void => {
    clearInterval(refreshTimer);
    pubnub.unsubscribeAll();
  };

  return { success: true, data: { stop } };
}

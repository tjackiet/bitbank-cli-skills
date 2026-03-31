import { describe, expect, it, vi } from "vitest";
import { handler, tradeHandler } from "../commands/make-handler.js";
import { captureStdout } from "./test-helpers.js";

describe("handler", () => {
  it("calls module function and outputs result", async () => {
    const cap = captureStdout();
    const h = handler(
      new URL("../commands/public/ticker.js", import.meta.url).pathname,
      "ticker",
      (a) => [a[0]],
    );

    const mod = await import("../commands/public/ticker.js");
    vi.spyOn(mod, "ticker").mockResolvedValue({
      success: true,
      data: {
        timestamp: 0,
        last: 100,
        vol: 1,
        buy: 99,
        sell: 101,
        open: 98,
        high: 102,
        low: 97,
      },
    });

    await h(["btc_jpy"], {}, "json");
    const output = cap.read();
    cap.restore();
    vi.restoreAllMocks();
    expect(output).toContain('"last": 100');
  });
});

describe("tradeHandler", () => {
  it("skips output on dry run result", async () => {
    const cap = captureStdout();

    const th = tradeHandler(
      new URL("../commands/trade/cancel-order.js", import.meta.url).pathname,
      "cancelOrder",
      (v) => ({ pair: v.pair as string, orderId: v["order-id"] as string }),
    );

    vi.spyOn(await import("../commands/trade/cancel-order.js"), "cancelOrder").mockResolvedValue({
      success: true,
      data: { dryRun: true },
    });

    await th([], { pair: "btc_jpy", "order-id": "123" }, "json");
    const output = cap.read();
    cap.restore();
    vi.restoreAllMocks();
    expect(output).toBe("");
  });
});

import { describe, expect, it, vi } from "vitest";
import { cancelOrder } from "../../commands/trade/cancel-order.js";

const CREDS = { apiKey: "testkey", apiSecret: "testsecret" };

function mockFetch(body: unknown): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify(body));
}

describe("cancel-order", () => {
  it("returns dryRun without --execute", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const result = await cancelOrder({ pair: "btc_jpy", orderId: "123" });
    expect(result).toEqual({ success: true, data: { dryRun: true } });
    const output = writeSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).toContain("DRY RUN");
    writeSpy.mockRestore();
  });

  it("calls API with --execute", async () => {
    const result = await cancelOrder(
      { pair: "btc_jpy", orderId: "123", execute: true },
      {
        fetch: mockFetch({
          success: 1,
          data: {
            order_id: 123,
            pair: "btc_jpy",
            side: "buy",
            type: "limit",
            price: "5000000",
            status: "CANCELED_UNFILLED",
          },
        }),
        retries: 0,
        credentials: CREDS,
        nonce: "1",
      },
    );
    expect(result.success).toBe(true);
  });

  it("requires pair", async () => {
    const result = await cancelOrder({ orderId: "123" });
    expect(result).toEqual({ success: false, error: "pair is required. Example: --pair=btc_jpy" });
  });

  it("requires order-id", async () => {
    const result = await cancelOrder({ pair: "btc_jpy" });
    expect(result).toEqual({
      success: false,
      error: "order-id is required. Example: --order-id=12345",
    });
  });
});

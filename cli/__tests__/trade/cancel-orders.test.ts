import { describe, expect, it, vi } from "vitest";
import { cancelOrders } from "../../commands/trade/cancel-orders.js";

const CREDS = { apiKey: "testkey", apiSecret: "testsecret" };

function mockFetch(body: unknown): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify(body));
}

describe("cancel-orders", () => {
  it("returns dryRun without --execute", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const result = await cancelOrders({ pair: "btc_jpy", orderIds: "1,2,3" });
    expect(result).toEqual({ success: true, data: { dryRun: true } });
    writeSpy.mockRestore();
  });

  it("calls API with --execute", async () => {
    const result = await cancelOrders(
      { pair: "btc_jpy", orderIds: "1,2", execute: true },
      {
        fetch: mockFetch({
          success: 1,
          data: {
            orders: [
              {
                order_id: 1,
                pair: "btc_jpy",
                side: "buy",
                type: "limit",
                price: "5000000",
                status: "CANCELED_UNFILLED",
              },
              {
                order_id: 2,
                pair: "btc_jpy",
                side: "sell",
                type: "limit",
                price: "6000000",
                status: "CANCELED_UNFILLED",
              },
            ],
          },
        }),
        retries: 0,
        credentials: CREDS,
        nonce: "1",
      },
    );
    expect(result.success).toBe(true);
  });

  it("rejects more than 30 order IDs", async () => {
    const ids = Array.from({ length: 31 }, (_, i) => i + 1).join(",");
    const result = await cancelOrders({ pair: "btc_jpy", orderIds: ids });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("at most 30");
  });

  it("requires pair", async () => {
    const result = await cancelOrders({ orderIds: "1,2" });
    expect(result.success).toBe(false);
  });

  it("requires order-ids", async () => {
    const result = await cancelOrders({ pair: "btc_jpy" });
    expect(result.success).toBe(false);
  });
});

import { describe, expect, it, vi } from "vitest";
import { createOrder } from "../../commands/trade/create-order.js";

const CREDS = { apiKey: "testkey", apiSecret: "testsecret" };

function mockFetch(body: unknown): typeof globalThis.fetch {
  return async () => new Response(JSON.stringify(body));
}

const VALID_RESPONSE = {
  success: 1,
  data: {
    order_id: 123,
    pair: "btc_jpy",
    side: "buy",
    type: "limit",
    start_amount: "0.001",
    remaining_amount: "0.001",
    executed_amount: "0",
    price: "5000000",
    post_only: false,
    average_price: "0",
    ordered_at: 1700000000000,
    expire_at: null,
    status: "UNFILLED",
  },
};

describe("create-order", () => {
  it("returns dryRun when --execute is not set", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const result = await createOrder({
      pair: "btc_jpy",
      side: "buy",
      type: "limit",
      price: "5000000",
      amount: "0.001",
    });
    expect(result).toEqual({ success: true, data: { dryRun: true } });
    const output = writeSpy.mock.calls.map((c) => c[0]).join("");
    expect(output).toContain("DRY RUN");
    expect(output).toContain("--execute");
    writeSpy.mockRestore();
  });

  it("calls API when --execute is set", async () => {
    const result = await createOrder(
      {
        pair: "btc_jpy",
        side: "buy",
        type: "limit",
        price: "5000000",
        amount: "0.001",
        execute: true,
      },
      { fetch: mockFetch(VALID_RESPONSE), retries: 0, credentials: CREDS, nonce: "1" },
    );
    expect(result.success).toBe(true);
    if (result.success) expect((result.data as Record<string, unknown>).order_id).toBe(123);
  });

  it("validates price required for limit order", async () => {
    const result = await createOrder({
      pair: "btc_jpy",
      side: "buy",
      type: "limit",
      amount: "0.001",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("price is required");
  });

  it("validates trigger-price required for stop_limit", async () => {
    const result = await createOrder({
      pair: "btc_jpy",
      side: "sell",
      type: "stop_limit",
      price: "5000000",
      amount: "0.001",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("trigger-price is required");
  });

  it("validates amount > 0", async () => {
    const result = await createOrder({
      pair: "btc_jpy",
      side: "buy",
      type: "market",
      amount: "0",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("amount must be > 0");
  });

  it("validates side enum", async () => {
    const result = await createOrder({
      pair: "btc_jpy",
      side: "invalid",
      type: "market",
      amount: "0.001",
    });
    expect(result.success).toBe(false);
  });

  it("market order does not require price", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const result = await createOrder({
      pair: "btc_jpy",
      side: "buy",
      type: "market",
      amount: "0.001",
    });
    expect(result).toEqual({ success: true, data: { dryRun: true } });
    writeSpy.mockRestore();
  });
});

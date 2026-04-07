import { describe, expect, it } from "vitest";
import { createOrder } from "../../../commands/trade/create-order.js";

describe("Chaos T-02: create-order --execute with missing required params", () => {
  it("rejects when pair is missing", async () => {
    const r = await createOrder({
      side: "buy",
      type: "limit",
      price: "5000000",
      amount: "0.001",
      execute: true,
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toMatch(/pair|Required/i);
  });

  it("rejects when side is missing", async () => {
    const r = await createOrder({
      pair: "btc_jpy",
      type: "limit",
      price: "5000000",
      amount: "0.001",
      execute: true,
    });
    expect(r.success).toBe(false);
  });

  it("rejects when type is missing", async () => {
    const r = await createOrder({
      pair: "btc_jpy",
      side: "buy",
      price: "5000000",
      amount: "0.001",
      execute: true,
    });
    expect(r.success).toBe(false);
  });

  it("rejects when amount is missing", async () => {
    const r = await createOrder({
      pair: "btc_jpy",
      side: "buy",
      type: "limit",
      price: "5000000",
      execute: true,
    });
    expect(r.success).toBe(false);
  });

  it("validation fires before API call (no fetch needed)", async () => {
    // Even with execute: true, validation errors should prevent API call
    // We pass no fetch mock — if it tried to call fetch, it would throw
    const r = await createOrder({ execute: true });
    expect(r.success).toBe(false);
  });
});

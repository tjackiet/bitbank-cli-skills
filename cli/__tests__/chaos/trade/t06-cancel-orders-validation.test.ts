import { describe, expect, it } from "vitest";
import { cancelOrders } from "../../../commands/trade/cancel-orders.js";

describe("Chaos T-06: cancel-orders with invalid --order-ids", () => {
  it("rejects non-numeric order IDs like abc,def", async () => {
    const r = await cancelOrders({ pair: "btc_jpy", orderIds: "abc,def" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toMatch(/integer|number/);
  });

  it("rejects mixed numeric/non-numeric IDs", async () => {
    const r = await cancelOrders({ pair: "btc_jpy", orderIds: "1,abc,3" });
    expect(r.success).toBe(false);
  });

  it("rejects empty string", async () => {
    const r = await cancelOrders({ pair: "btc_jpy", orderIds: "" });
    expect(r.success).toBe(false);
  });

  it("rejects 31 order IDs (max is 30)", async () => {
    const ids = Array.from({ length: 31 }, (_, i) => i + 1).join(",");
    const r = await cancelOrders({ pair: "btc_jpy", orderIds: ids });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("30");
  });

  it("accepts exactly 30 order IDs (dry-run)", async () => {
    const { vi } = await import("vitest");
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const ids = Array.from({ length: 30 }, (_, i) => i + 1).join(",");
    const r = await cancelOrders({ pair: "btc_jpy", orderIds: ids });
    expect(r.success).toBe(true);
    spy.mockRestore();
  });
});

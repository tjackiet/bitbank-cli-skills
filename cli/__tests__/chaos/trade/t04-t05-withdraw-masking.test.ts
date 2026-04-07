import { describe, expect, it, vi } from "vitest";
import { withdraw } from "../../../commands/trade/withdraw.js";

const SECRET_TOKEN = "super-secret-otp-token-12345";

describe("Chaos T-04: withdraw dry-run masks --token in hint", () => {
  it("shows --token=*** instead of actual value", async () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await withdraw({
      asset: "btc",
      uuid: "uuid-1",
      amount: "0.5",
      token: SECRET_TOKEN,
    });
    const out = spy.mock.calls.map((c) => c[0]).join("");
    expect(out).toContain("--token=***");
    expect(out).not.toContain(SECRET_TOKEN);
    spy.mockRestore();
  });

  it("without token, no --token=*** in hint", async () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await withdraw({ asset: "btc", uuid: "uuid-1", amount: "0.5" });
    const out = spy.mock.calls.map((c) => c[0]).join("");
    expect(out).not.toContain("--token");
    spy.mockRestore();
  });
});

describe("Chaos T-05: withdraw dry-run masks token in body", () => {
  it('body shows token: "***" instead of real value', async () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await withdraw({
      asset: "btc",
      uuid: "uuid-1",
      amount: "0.5",
      token: SECRET_TOKEN,
    });
    const out = spy.mock.calls.map((c) => c[0]).join("");
    expect(out).toContain('token: "***"');
    expect(out).not.toContain(SECRET_TOKEN);
    spy.mockRestore();
  });
});

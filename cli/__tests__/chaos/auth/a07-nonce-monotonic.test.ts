import { describe, expect, it } from "vitest";
import { generateNonce } from "../../../auth.js";

describe("Chaos A-07: nonce is monotonically increasing", () => {
  it("sequential calls produce increasing nonces", () => {
    const n1 = generateNonce();
    const n2 = generateNonce();
    const n3 = generateNonce();
    expect(Number(n2)).toBeGreaterThan(Number(n1));
    expect(Number(n3)).toBeGreaterThan(Number(n2));
  });

  it("rapid calls in same millisecond still increase", () => {
    const nonces: string[] = [];
    for (let i = 0; i < 100; i++) {
      nonces.push(generateNonce());
    }
    for (let i = 1; i < nonces.length; i++) {
      expect(Number(nonces[i])).toBeGreaterThan(Number(nonces[i - 1]));
    }
  });

  it("nonce is a valid numeric string", () => {
    const n = generateNonce();
    expect(n).toMatch(/^\d+$/);
    expect(Number(n)).toBeGreaterThan(0);
  });
});

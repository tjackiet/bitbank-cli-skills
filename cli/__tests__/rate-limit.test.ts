import { describe, expect, it } from "vitest";
import { extractRateLimit } from "../rate-limit.js";

describe("extractRateLimit", () => {
  it("extracts all rate limit headers", () => {
    const headers = new Headers({
      "X-RateLimit-Remaining": "95",
      "X-RateLimit-Limit": "100",
      "X-RateLimit-Reset": "1700000000",
    });
    expect(extractRateLimit(headers)).toEqual({
      remaining: 95,
      limit: 100,
      reset: 1700000000,
    });
  });

  it("returns undefined when no headers present", () => {
    expect(extractRateLimit(new Headers())).toBeUndefined();
  });

  it("returns -1 for missing individual headers", () => {
    const headers = new Headers({ "X-RateLimit-Remaining": "10" });
    expect(extractRateLimit(headers)).toEqual({
      remaining: 10,
      limit: -1,
      reset: 0,
    });
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, getRateLimitHeaders, resetRateLimitStore } from "@/lib/security/rateLimit";

describe("rate limit", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("permite peticiones dentro del limite", () => {
    expect(checkRateLimit({ key: "user-1", limit: 2, now: 1_000, windowMs: 60_000 })).toMatchObject({
      allowed: true,
      remaining: 1
    });
    expect(checkRateLimit({ key: "user-1", limit: 2, now: 2_000, windowMs: 60_000 })).toMatchObject({
      allowed: true,
      remaining: 0
    });
  });

  it("bloquea cuando se supera el limite y expone Retry-After", () => {
    checkRateLimit({ key: "user-1", limit: 1, now: 1_000, windowMs: 60_000 });
    const result = checkRateLimit({ key: "user-1", limit: 1, now: 2_000, windowMs: 60_000 });

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(59);
    expect(getRateLimitHeaders(result)).toMatchObject({
      "RateLimit-Limit": "1",
      "RateLimit-Remaining": "0",
      "Retry-After": "59"
    });
  });

  it("reinicia la ventana despues del reset", () => {
    checkRateLimit({ key: "user-1", limit: 1, now: 1_000, windowMs: 60_000 });
    const result = checkRateLimit({ key: "user-1", limit: 1, now: 62_000, windowMs: 60_000 });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });
});

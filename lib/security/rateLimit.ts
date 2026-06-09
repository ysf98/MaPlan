import { NextResponse } from "next/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitOptions = {
  key: string;
  limit: number;
  now?: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const buckets = new Map<string, RateLimitBucket>();

export function checkRateLimit({ key, limit, now = Date.now(), windowMs }: RateLimitOptions): RateLimitResult {
  const existingBucket = buckets.get(key);
  const bucket =
    existingBucket && existingBucket.resetAt > now
      ? existingBucket
      : {
          count: 0,
          resetAt: now + windowMs
        };

  bucket.count += 1;
  buckets.set(key, bucket);

  const remaining = Math.max(0, limit - bucket.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  return {
    allowed: bucket.count <= limit,
    limit,
    remaining,
    resetAt: bucket.resetAt,
    retryAfterSeconds
  };
}

export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    "Retry-After": String(result.retryAfterSeconds)
  };
}

export function rateLimitExceededResponse(result: RateLimitResult) {
  return NextResponse.json(
    { error: "Has hecho demasiadas solicitudes. Intentalo de nuevo en unos segundos." },
    { status: 429, headers: getRateLimitHeaders(result) }
  );
}

export function resetRateLimitStore() {
  buckets.clear();
}

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  now?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const MAX_BUCKETS = 5000;
const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = options.now ?? Date.now();
  pruneBuckets(now);
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(key, { count: 1, resetAt });

    return {
      allowed: true,
      limit: options.limit,
      remaining: Math.max(options.limit - 1, 0),
      resetAt,
      retryAfterSeconds: 0
    };
  }

  if (bucket.count >= options.limit) {
    return {
      allowed: false,
      limit: options.limit,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSeconds: Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1)
    };
  }

  bucket.count += 1;

  return {
    allowed: true,
    limit: options.limit,
    remaining: Math.max(options.limit - bucket.count, 0),
    resetAt: bucket.resetAt,
    retryAfterSeconds: 0
  };
}

export function getRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  return {
    "x-ratelimit-limit": String(result.limit),
    "x-ratelimit-remaining": String(result.remaining),
    "x-ratelimit-reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed
      ? {}
      : { "retry-after": String(result.retryAfterSeconds) })
  };
}

export function clearRateLimitBuckets(): void {
  buckets.clear();
}

function pruneBuckets(now: number): void {
  if (buckets.size < MAX_BUCKETS) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }

  const targetSize = Math.floor(MAX_BUCKETS * 0.8);
  for (const key of buckets.keys()) {
    if (buckets.size <= targetSize) {
      break;
    }

    buckets.delete(key);
  }
}

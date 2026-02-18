type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimit(ip: string, limitPerMinute: number) {
  const now = Date.now();
  const windowMs = 60_000;
  const bucket = buckets.get(ip);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limitPerMinute - 1 };
  }

  if (bucket.count >= limitPerMinute) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limitPerMinute - bucket.count, resetAt: bucket.resetAt };
}

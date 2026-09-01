interface RateLimitRecord {
  timestamps: number[];
}

const ipMap = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale IP records every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipMap.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < 3600000); // 1 hour
      if (record.timestamps.length === 0) {
        ipMap.delete(ip);
      }
    }
  }, 300000);

  // Unref in Node environment so this doesn't hold open process teardown
  if (typeof interval.unref === "function") {
    interval.unref();
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export function checkRateLimit(
  ip: string,
  limit = 12,
  windowMs = 60000 // 12 requests per minute per IP
): RateLimitResult {
  const now = Date.now();
  let record = ipMap.get(ip);

  if (!record) {
    record = { timestamps: [] };
    ipMap.set(ip, record);
  }

  // Keep only timestamps within the sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    limit,
    remaining: limit - record.timestamps.length,
    resetSeconds: Math.ceil(windowMs / 1000),
  };
}

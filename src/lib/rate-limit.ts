export interface RateLimitOptions {
  limit: number;
  window: number; // in seconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-Memory implementation of Rate Limiter for now.
// Designed to be drop-in replaced by @upstash/ratelimit (Redis) later.
class MemoryRateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();

  async limit(identifier: string, options: RateLimitOptions = { limit: 10, window: 60 }): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = options.window * 1000;
    
    let record = this.store.get(identifier);
    
    // Clean up expired or create new
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
    }
    
    record.count++;
    this.store.set(identifier, record);

    const remaining = Math.max(0, options.limit - record.count);
    
    return {
      success: record.count <= options.limit,
      limit: options.limit,
      remaining,
      reset: record.resetAt
    };
  }
}

export const rateLimiter = new MemoryRateLimiter();

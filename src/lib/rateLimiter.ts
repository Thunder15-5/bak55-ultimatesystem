/**
 * Client-side rate limiting to prevent abuse
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  check(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Get existing requests for this key
    let timestamps = this.requests.get(key) || [];
    
    // Filter out old requests
    timestamps = timestamps.filter(t => t > windowStart);
    
    // Check if limit exceeded
    if (timestamps.length >= config.maxRequests) {
      return false;
    }
    
    // Add new request
    timestamps.push(now);
    this.requests.set(key, timestamps);
    
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Common rate limit configs
export const RATE_LIMITS = {
  TIP: { maxRequests: 5, windowMs: 60000 }, // 5 tips per minute
  COMMENT: { maxRequests: 10, windowMs: 60000 }, // 10 comments per minute
  VOTE: { maxRequests: 20, windowMs: 60000 }, // 20 votes per minute
  UPLOAD: { maxRequests: 3, windowMs: 3600000 }, // 3 uploads per hour
  WITHDRAWAL: { maxRequests: 2, windowMs: 3600000 }, // 2 withdrawals per hour
};

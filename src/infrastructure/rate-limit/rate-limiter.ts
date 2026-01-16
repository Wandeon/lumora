import { getRedis } from './redis-client';

interface RateLimitResult {
  success: boolean;
  reset: number;
  remaining: number;
}

interface RateLimitConfig {
  prefix: string;
  maxRequests: number;
  windowMs: number;
}

/**
 * Sliding window rate limiter using Redis
 */
async function checkLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedis();
  const key = `${config.prefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Use a transaction for atomic operations
  const pipeline = redis.pipeline();

  // Remove old entries outside the window
  pipeline.zremrangebyscore(key, 0, windowStart);

  // Count current entries in window
  pipeline.zcard(key);

  // Add current request
  pipeline.zadd(key, now, `${now}-${Math.random()}`);

  // Set expiry on the key
  pipeline.pexpire(key, config.windowMs);

  const results = await pipeline.exec();

  if (!results) {
    // Redis error, allow the request
    return {
      success: true,
      reset: now + config.windowMs,
      remaining: config.maxRequests,
    };
  }

  const count = (results[1]?.[1] as number) || 0;
  const success = count < config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - count - 1);

  return {
    success,
    reset: now + config.windowMs,
    remaining,
  };
}

// Rate limit configurations
const CONFIGS = {
  signup: {
    prefix: 'ratelimit:signup',
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
  }, // 5 per hour
  forgotPassword: {
    prefix: 'ratelimit:forgot-password',
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
  }, // 3 per hour
  order: { prefix: 'ratelimit:order', maxRequests: 20, windowMs: 60 * 1000 }, // 20 per minute
  checkout: {
    prefix: 'ratelimit:checkout',
    maxRequests: 10,
    windowMs: 60 * 1000,
  }, // 10 per minute
  login: {
    prefix: 'ratelimit:login',
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  }, // 5 per 15 minutes
} as const;

export async function checkSignupLimit(ip: string): Promise<RateLimitResult> {
  return checkLimit(ip, CONFIGS.signup);
}

export async function checkForgotPasswordLimit(
  ip: string
): Promise<RateLimitResult> {
  return checkLimit(ip, CONFIGS.forgotPassword);
}

export async function checkOrderLimit(ip: string): Promise<RateLimitResult> {
  return checkLimit(ip, CONFIGS.order);
}

export async function checkCheckoutLimit(ip: string): Promise<RateLimitResult> {
  return checkLimit(ip, CONFIGS.checkout);
}

export async function checkLoginLimit(ip: string): Promise<RateLimitResult> {
  return checkLimit(ip, CONFIGS.login);
}

/**
 * Rate limiter with Upstash Redis (serverless-compatible)
 * Falls back to in-memory Map when UPSTASH_REDIS_REST_URL is not set (local dev)
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

// ─── Route config ───────────────────────────────────────────

interface RateLimitConfig {
  anonymous?: { maxRequests: number; windowMs: number };
  authenticated?: { maxRequests: number; windowMs: number };
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const ROUTE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/chat': {
    anonymous: { maxRequests: 20, windowMs: MINUTE },
    authenticated: { maxRequests: 40, windowMs: MINUTE },
  },
  '/api/mint': {
    authenticated: { maxRequests: 5, windowMs: HOUR },
  },
  '/api/soul': {
    authenticated: { maxRequests: 10, windowMs: MINUTE },
  },
  '/api/diary': {
    authenticated: { maxRequests: 30, windowMs: MINUTE },
  },
  '/api/profile': {
    authenticated: { maxRequests: 20, windowMs: MINUTE },
  },
  '/api/notifications': {
    authenticated: { maxRequests: 30, windowMs: MINUTE },
  },
  '/api/souls': {
    authenticated: { maxRequests: 20, windowMs: MINUTE },
  },
  '/api/session': {
    anonymous: { maxRequests: 10, windowMs: MINUTE },
  },
};

// ─── Upstash Redis rate limiter ─────────────────────────────

let upstashLimiters: Map<string, import('@upstash/ratelimit').Ratelimit> | null = null;

async function getUpstashLimiter(key: string, maxRequests: number, windowMs: number) {
  if (!upstashLimiters) {
    upstashLimiters = new Map();
  }

  const limiterKey = `${key}:${maxRequests}:${windowMs}`;
  let limiter = upstashLimiters.get(limiterKey);
  if (!limiter) {
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');
    const redis = Redis.fromEnv();
    const windowSec = Math.ceil(windowMs / 1000);

    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
      prefix: `ratelimit:${key}`,
    });
    upstashLimiters.set(limiterKey, limiter);
  }
  return limiter;
}

// ─── In-memory fallback ─────────────────────────────────────

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter(t => now - t < 3600000);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 5 * 60 * 1000);

function isRateLimitedInMemory(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);
  if (entry.timestamps.length >= maxRequests) {
    return true;
  }
  entry.timestamps.push(now);
  return false;
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Extract client IP from request headers.
 *
 * SECURITY NOTE (IP spoofing):
 * On Vercel, `x-forwarded-for` is set by the platform edge and cannot be
 * spoofed by end users — this is safe in Vercel deployments.
 * For self-hosted / non-Vercel environments, place the app behind a trusted
 * reverse proxy that strips and re-sets `x-forwarded-for`, or switch to a
 * platform-provided header (e.g., CF-Connecting-IP for Cloudflare).
 */
export function getClientIP(req: { headers: { get(name: string): string | null } }): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

/**
 * Check rate limit for a route. Returns a 429 NextResponse if limited, or null if OK.
 */
export async function checkRateLimit(
  route: string,
  ip: string,
  walletAddress?: string,
): Promise<NextResponse | null> {
  const normalizedRoute = route.replace(/^(\/api\/[^/]+).*$/, '$1');
  const config = ROUTE_LIMITS[normalizedRoute];
  if (!config) return null;

  const identifier = walletAddress || `ip:${ip}`;
  const limits = walletAddress ? config.authenticated : config.anonymous;
  if (!limits) return null;

  const key = `${normalizedRoute}:${identifier}`;
  const useUpstash = !!process.env.UPSTASH_REDIS_REST_URL;

  let limited = false;

  if (useUpstash) {
    try {
      const limiter = await getUpstashLimiter(normalizedRoute, limits.maxRequests, limits.windowMs);
      const result = await limiter.limit(key);
      limited = !result.success;
    } catch (e) {
      // If Redis fails, fall back to in-memory
      logger.error('rate_limit.upstash_error', { details: { error: String(e) } });
      limited = isRateLimitedInMemory(key, limits.maxRequests, limits.windowMs);
    }
  } else {
    limited = isRateLimitedInMemory(key, limits.maxRequests, limits.windowMs);
  }

  if (limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 },
    );
  }

  return null;
}

import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Inline logger for middleware (Edge Runtime — can't import from src/lib)
// ---------------------------------------------------------------------------
function logJson(level: string, event: string, extra?: Record<string, unknown>) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...extra });
  if (level === 'ERROR' || level === 'CRITICAL') console.error(line);
  else if (level === 'WARN') console.warn(line);
  else console.log(line);
}

// ---------------------------------------------------------------------------
// In-memory Rate Limiter (셀프호스트 환경 — Map 기반)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}

// Endpoint-specific limits (requests per minute)
const RATE_LIMITS: Record<string, number> = {
  '/api/chat': 30,
  '/api/mint': 5,
  '/api/soul': 10,
  '/api/profile': 30,
  '/api/diary': 30,
  '/api/notifications': 30,
};
const DEFAULT_RATE_LIMIT = 60;

function getRateLimit(pathname: string): number {
  for (const [prefix, limit] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(prefix)) return limit;
  }
  return DEFAULT_RATE_LIMIT;
}

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const start = Date.now();
  const ip = getClientIP(req);
  const method = req.method;

  // --- Kill Switch ---
  if (process.env.DITO_MAINTENANCE === 'true') {
    logJson('INFO', 'maintenance.active', { endpoint: pathname, ip, method });
    return NextResponse.json(
      { error: 'Service is under maintenance. Please try again later.' },
      { status: 503, headers: { 'Retry-After': '300' } }
    );
  }

  // --- Rate Limiting (with lazy cleanup) ---
  cleanupStaleEntries();
  const limit = getRateLimit(pathname);
  const key = `${ip}:${pathname.split('/').slice(0, 3).join('/')}`;
  const now = Date.now();

  let entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 60_000 };
    rateLimitMap.set(key, entry);
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);

  if (entry.count > limit) {
    logJson('WARN', 'ratelimit.exceeded', { endpoint: pathname, ip, method, details: { limit, count: entry.count } });
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // Attach rate limit headers to successful responses
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(remaining));

  // Log request
  const duration_ms = Date.now() - start;
  logJson('INFO', 'api.request', { endpoint: pathname, ip, method, duration_ms });

  return response;
}

export const config = {
  matcher: '/api/:path*',
};

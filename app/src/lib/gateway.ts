/**
 * Gateway proxy helper — forwards a Next.js API request to the Rust Gateway
 * and returns the Gateway's response verbatim. Adds `Authorization: Bearer`
 * using the caller's cookie if present, else the service token.
 *
 * Gateway endpoints live under `/api/*` on the Gateway (JWT-guarded scope).
 * The body/query shape is 1:1 with the Gateway handler signature.
 */
import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_DITO_API_URL || 'http://localhost:8091';

function authToken(req: NextRequest): string {
  const cookie = req.cookies.get('sb-access-token')?.value;
  const service = process.env.DITO_API_TOKEN || '';
  return cookie || service;
}

function unwrap(data: unknown): unknown {
  // Gateway wraps responses as `{ success, data, message, ... }`.
  // Existing Next.js callers expect flat shapes like `{ entries: [] }`,
  // so unwrap if we see the envelope.
  if (
    data &&
    typeof data === 'object' &&
    'success' in (data as Record<string, unknown>) &&
    'data' in (data as Record<string, unknown>)
  ) {
    return (data as { data: unknown }).data;
  }
  return data;
}

export async function proxyToGateway(
  req: NextRequest,
  opts: {
    /** Gateway path including the leading `/api/...` */
    path: string;
    /** HTTP method. Defaults to the incoming request's method. */
    method?: string;
    /** Forward the incoming query string to the Gateway. */
    forwardQuery?: boolean;
    /** Forward the incoming JSON body. */
    forwardBody?: boolean;
  }
): Promise<NextResponse> {
  const method = (opts.method || req.method).toUpperCase();
  const token = authToken(req);

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  let url = `${GATEWAY_URL}${opts.path}`;
  if (opts.forwardQuery) {
    const qs = req.nextUrl.search;
    if (qs) url += qs;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  let body: string | undefined;
  if (opts.forwardBody && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    try {
      const json = await req.json();
      body = JSON.stringify(json);
      headers['Content-Type'] = 'application/json';
    } catch {
      // empty body is fine
    }
  }

  try {
    const res = await fetch(url, { method, headers, body });
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* keep raw text */
    }

    const unwrapped = unwrap(parsed);
    return NextResponse.json(unwrapped, { status: res.status });
  } catch (err) {
    console.error('Gateway proxy error:', err);
    return NextResponse.json(
      { error: 'Gateway unreachable' },
      { status: 502 }
    );
  }
}

#!/usr/bin/env node
/**
 * Mint a long-lived dev JWT for hitting the Gateway from local Next.js.
 *
 * Reads DITO_JWT_SECRET from env or argv[2]. Prints the token to stdout.
 *
 * Usage:
 *   node scripts/dev-token.mjs                            # uses env DITO_JWT_SECRET
 *   node scripts/dev-token.mjs my-secret                  # explicit secret
 *   node scripts/dev-token.mjs my-secret 365              # with TTL in days
 *
 * Pipe into the app's .env.local:
 *   echo "DITO_API_TOKEN=$(node scripts/dev-token.mjs)" >> ../app/.env.local
 *
 * No npm deps needed — minimal HS256 implementation.
 */
import crypto from 'node:crypto';

const secret = process.argv[2] || process.env.DITO_JWT_SECRET || 'test-secret';
const ttlDays = Number(process.argv[3] || 365);

if (!secret || secret === 'test-secret') {
  console.error('warn: using fallback "test-secret" — set DITO_JWT_SECRET to match Gateway env');
}

const header = { alg: 'HS256', typ: 'JWT' };
const now = Math.floor(Date.now() / 1000);
const payload = {
  user_id: 'dev-local',
  user_name: 'dev',
  exp: now + ttlDays * 86400,
  iat: now,
};

function b64url(input) {
  const buf = Buffer.from(typeof input === 'string' ? input : JSON.stringify(input));
  return buf.toString('base64url');
}

const head = b64url(header);
const body = b64url(payload);
const sig = crypto
  .createHmac('sha256', secret)
  .update(`${head}.${body}`)
  .digest('base64url');

process.stdout.write(`${head}.${body}.${sig}\n`);

import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { logger } from './logger';

export const AUTH_MESSAGE_PREFIX = 'DITO.guru auth:';
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes
const NONCE_TTL_SEC = 310; // 5 min + 10s buffer

// ─── Nonce replay prevention (Upstash Redis with in-memory fallback) ───

// In-memory fallback for local dev / when Redis is not configured
const usedNonces = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of usedNonces) {
    if (now > expiry) usedNonces.delete(key);
  }
}, 2 * 60 * 1000);

let _redis: import('@upstash/redis').Redis | null | undefined;

async function getRedis(): Promise<import('@upstash/redis').Redis | null> {
  if (_redis !== undefined) return _redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    _redis = null;
    return null;
  }
  try {
    const { Redis } = await import('@upstash/redis');
    _redis = Redis.fromEnv();
    return _redis;
  } catch {
    _redis = null;
    return null;
  }
}

async function checkAndMarkNonce(authMessage: string): Promise<boolean> {
  const redis = await getRedis();
  if (redis) {
    try {
      const key = `nonce:${authMessage}`;
      // SET NX returns OK if set, null if already exists
      const result = await redis.set(key, '1', { nx: true, ex: NONCE_TTL_SEC });
      return result !== null;
    } catch (e) {
      logger.error('nonce.redis_error', { details: { error: String(e) } });
      // Fall through to in-memory
    }
  }
  // In-memory fallback
  if (usedNonces.has(authMessage)) return false;
  usedNonces.set(authMessage, Date.now() + NONCE_TTL_SEC * 1000);
  return true;
}

/**
 * Validate wallet address is valid base58 Solana address
 */
export function isValidWalletAddress(address: string): boolean {
  if (!address || address.length < 32 || address.length > 44) return false;
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) return false;
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create standard auth message for signing
 */
export function createAuthMessage(walletAddress: string, timestamp: number): string {
  return `${AUTH_MESSAGE_PREFIX}${walletAddress}:${timestamp}`;
}

/**
 * Verify a wallet signature (ed25519)
 * Returns true if valid, false otherwise
 */
export function verifyWallet(
  walletAddress: string,
  signature: string,
  message: string
): boolean {
  try {
    const publicKey = new PublicKey(walletAddress);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Buffer.from(signature, 'base64');

    if (signatureBytes.length !== 64) return false;

    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
  } catch {
    return false;
  }
}

/**
 * Full auth check: validates wallet format, signature, and timestamp freshness
 * Returns { valid: true } or { valid: false, error: string }
 */
export async function authenticateRequest(params: {
  wallet_address?: string;
  signature?: string;
  auth_message?: string;
  auth_timestamp?: number;
}): Promise<{ valid: true } | { valid: false; error: string; status: number }> {
  const { wallet_address, signature, auth_message, auth_timestamp } = params;

  if (!wallet_address) {
    return { valid: false, error: 'wallet_address required', status: 400 };
  }

  if (!isValidWalletAddress(wallet_address)) {
    return { valid: false, error: 'Invalid wallet address format', status: 400 };
  }

  if (!signature || !auth_message || !auth_timestamp) {
    return { valid: false, error: 'Authentication required: signature, auth_message, and auth_timestamp must be provided', status: 401 };
  }

  // Verify timestamp freshness
  const now = Date.now();
  if (Math.abs(now - auth_timestamp) > TIMESTAMP_TOLERANCE_MS) {
    return { valid: false, error: 'Auth message expired', status: 401 };
  }

  // Verify message format
  const expectedMessage = createAuthMessage(wallet_address, auth_timestamp);
  if (auth_message !== expectedMessage) {
    return { valid: false, error: 'Invalid auth message format', status: 401 };
  }

  // Verify signature
  if (!verifyWallet(wallet_address, signature, auth_message)) {
    return { valid: false, error: 'Invalid signature', status: 401 };
  }

  // Reject replayed auth messages
  if (!(await checkAndMarkNonce(auth_message))) {
    return { valid: false, error: 'Auth message already used', status: 401 };
  }

  return { valid: true };
}

/**
 * Authenticate GET requests using query parameters
 */
export async function authenticateGet(searchParams: URLSearchParams): Promise<{ valid: true; wallet_address: string } | { valid: false; error: string; status: number }> {
  const wallet_address = getWalletParam(searchParams);
  const signature = searchParams.get('signature') || undefined;
  const auth_message = searchParams.get('auth_message') || undefined;
  const auth_timestamp = searchParams.get('auth_timestamp') ? Number(searchParams.get('auth_timestamp')) : undefined;

  const result = await authenticateRequest({ wallet_address, signature, auth_message, auth_timestamp });
  if (!result.valid) return result;
  return { valid: true, wallet_address: wallet_address! };
}

/**
 * Authenticate POST/PUT requests using request body
 */
export async function authenticateBody(body: Record<string, unknown>): Promise<{ valid: true; wallet_address: string } | { valid: false; error: string; status: number }> {
  const result = await authenticateRequest({
    wallet_address: body.wallet_address as string | undefined,
    signature: body.signature as string | undefined,
    auth_message: body.auth_message as string | undefined,
    auth_timestamp: body.auth_timestamp as number | undefined,
  });
  if (!result.valid) return result;
  return { valid: true, wallet_address: body.wallet_address as string };
}

/**
 * Sanitize text input: strip HTML tags, trim
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').trim();
}

export function getWalletParam(searchParams: URLSearchParams): string | undefined {
  return searchParams.get('wallet_address') || searchParams.get('wallet') || undefined;
}

/**
 * Prompt injection filter patterns
 */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+(instructions|prompts?)/gi,
  /system\s+prompt/gi,
  /you\s+are\s+now/gi,
  /forget\s+(your|all)\s+instructions/gi,
  /new\s+role/gi,
  /act\s+as\s+(a\s+)?different/gi,
  /override\s+(system|instructions)/gi,
  /disregard\s+(all|previous)/gi,
  /pretend\s+you\s+are/gi,
  /반드시\s+(무시|잊어|변경)/gi,
  /무시해/gi,
  /시스템\s*프롬프트/gi,
  /이전\s*(지시|명령).*무시/gi,
  /역할\s*변경/gi,
  /새로운\s*역할/gi,
  /ignore\s+above/gi,
  /new\s+instructions/gi,
  /system\s*:/gi,
  /assistant\s*:/gi,
  /<<SYS>>/gi,
];

/**
 * Strip zero-width and invisible characters, normalize unicode
 */
function stripInvisibleChars(input: string): string {
  // Remove zero-width characters: U+200B, U+200C, U+200D, U+FEFF, U+00AD
  return input.replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, '').normalize('NFC');
}

/**
 * Sanitize user prompt: remove prompt injection attempts and log warnings.
 * Returns cleaned text.
 */
export function sanitizePrompt(input: string): string {
  if (typeof input !== 'string') return '';

  let cleaned = stripInvisibleChars(input);

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    if (pattern.test(cleaned)) {
      logger.warn('prompt_injection.detected', { details: { pattern: pattern.source } });
      pattern.lastIndex = 0;
      cleaned = cleaned.replace(pattern, '');
    }
  }

  return cleaned.trim();
}

export function sanitizeHistory(
  history: unknown,
  options?: { maxMessages?: number; maxCharsPerMessage?: number }
): Array<{ role: string; content: string }> {
  const maxMessages = options?.maxMessages ?? 50;
  const maxCharsPerMessage = options?.maxCharsPerMessage ?? 10000;

  if (!Array.isArray(history)) return [];

  return history
    .slice(-maxMessages)
    .map((entry) => {
      const row = entry as { role?: unknown; content?: unknown };
      return {
        role: typeof row.role === 'string' ? row.role : '',
        content: sanitizePrompt(sanitizeText(String(row.content || '')).slice(0, maxCharsPerMessage)),
      };
    })
    .filter((entry) => entry.content.length > 0);
}

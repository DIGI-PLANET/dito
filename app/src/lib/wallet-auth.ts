/**
 * Client-side wallet authentication utility
 * Signs auth messages and caches signatures for API calls
 */

import { handleSignatureError } from './session-logout';
import { AUTH_MESSAGE_PREFIX } from './auth';
// Client caches a signed auth message for 4 min (server window is 5 min).
// SECURITY: Each cached signature is used once — server-side nonce replay
// prevention (backed by Upstash Redis in production) rejects any reuse,
// so caching here only avoids redundant wallet signing prompts.
const CACHE_DURATION_MS = 4 * 60 * 1000; // 4 minutes (server allows 5)

interface CachedAuth {
  signature: string;
  auth_message: string;
  auth_timestamp: number;
  expiresAt: number;
}

let cachedAuth: CachedAuth | null = null;
let cachedWallet: string | null = null;

/**
 * Sign an auth message with the connected wallet
 */
export async function getAuthParams(
  walletAddress: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<{ signature: string; auth_message: string; auth_timestamp: number }> {
  // Return cached if still valid and same wallet
  if (
    cachedAuth &&
    cachedWallet === walletAddress &&
    Date.now() < cachedAuth.expiresAt
  ) {
    return {
      signature: cachedAuth.signature,
      auth_message: cachedAuth.auth_message,
      auth_timestamp: cachedAuth.auth_timestamp,
    };
  }

  const timestamp = Date.now();
  const message = `${AUTH_MESSAGE_PREFIX}${walletAddress}:${timestamp}`;
  const messageBytes = new TextEncoder().encode(message);
  
  let signatureBytes: Uint8Array;
  try {
    signatureBytes = await signMessage(messageBytes);
  } catch (error) {
    // Handle signature cancellation
    const wasCancelled = handleSignatureError(error, true);
    if (wasCancelled) {
      throw new Error('Signature cancelled by user');
    }
    // Re-throw other errors
    throw error;
  }
  
  const signature = Buffer.from(signatureBytes).toString('base64');

  cachedAuth = {
    signature,
    auth_message: message,
    auth_timestamp: timestamp,
    expiresAt: Date.now() + CACHE_DURATION_MS,
  };
  cachedWallet = walletAddress;

  return { signature, auth_message: message, auth_timestamp: timestamp };
}

/**
 * Clear cached auth (call on disconnect)
 */
export function clearAuthCache(): void {
  cachedAuth = null;
  cachedWallet = null;
}

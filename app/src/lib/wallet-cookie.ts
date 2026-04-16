/**
 * Wallet cookie stores the Solana public key (wallet address).
 *
 * SECURITY NOTE (ISMS-003 accepted risk):
 * This cookie is intentionally NOT httpOnly because client-side JS needs to
 * read the wallet address for UI rendering and wallet adapter integration.
 * The wallet address is a PUBLIC key — not a secret. Exposure via XSS does
 * not grant access to funds or private data. CSP + input sanitization
 * mitigate XSS risk. Reviewed 2026-02-18.
 */
const COOKIE_NAME = 'dito-wallet';
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export function getWalletCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setWalletCookie(address: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(address)}; path=/; max-age=${MAX_AGE}; SameSite=Strict; Secure`;
}

export function removeWalletCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Strict; Secure`;
}

/** SSR: parse wallet from cookie header string (validates format) */
export function getWalletFromCookies(cookieHeader: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  if (!match) return null;
  const value = decodeURIComponent(match[1]);
  // Validate wallet address format: base58, 32-44 chars
  if (!value || value.length < 32 || value.length > 44 || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(value)) {
    return null;
  }
  return value;
}

// localStorage migration removed — cookies are the sole source

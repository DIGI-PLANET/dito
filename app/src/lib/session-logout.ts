/**
 * Session logout utility
 * Clears all user data and redirects to appropriate page
 */

import { store, setSignMessageFn } from './store';
import { removeWalletCookie } from './wallet-cookie';
import { clearAuthCache } from './wallet-auth';

/**
 * Complete session logout - clears all user data
 */
export function logoutSession(): void {
  // Clear wallet connection
  removeWalletCookie();
  
  // Clear auth cache
  clearAuthCache();
  
  // Clear sign function
  setSignMessageFn(null);
  
  // Reset store to initial state
  const defaultProfile: import('./store').UserProfile = {
    language: 'en',
    ember_stage: 'sparked',
    interests: [],
    challenges_completed: 0,
    growth_notes: [],
    minted: false,
    discovery_complete: false,
    wallet_connected: false,
  };
  store.setProfile(defaultProfile);
  
  // Clear any other cached data if needed
  // (messages, diary entries, etc. are wallet-specific so will be refreshed)
}

/**
 * Handle wallet signature cancellation
 * Detects user cancellation and triggers logout
 */
export function handleSignatureError(error: unknown, autoLogout = true): boolean {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  // Common signature cancellation patterns
  const cancelPatterns = [
    'user rejected',
    'user denied',
    'user cancelled',
    'cancelled by user',
    'rejected by user',
    'user canceled',
    'transaction was cancelled',
    'signature request was rejected',
    'user closed modal',
  ];
  
  const isCancellation = cancelPatterns.some(pattern => errorMessage.includes(pattern));
  
  if (isCancellation && autoLogout) {
    console.log('[DITO] Signature cancelled - logging out session');
    logoutSession();
    
    // Redirect to connect page after a small delay
    setTimeout(() => {
      window.location.href = '/auth';
    }, 100);
  }
  
  return isCancellation;
}
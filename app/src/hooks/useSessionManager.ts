/**
 * Hook for session management - tracks activity and handles cleanup
 */

'use client';

import { useEffect } from 'react';
import { updateSessionActivity, deactivateSession } from '@/lib/session-manager';
import { getWalletCookie } from '@/lib/wallet-cookie';

export function useSessionManager() {
  useEffect(() => {
    const wallet = getWalletCookie();
    if (!wallet) return;

    // Update session activity on mount
    updateSessionActivity(wallet);

    // Set up periodic activity updates (every 5 minutes)
    const activityInterval = setInterval(() => {
      const currentWallet = getWalletCookie();
      if (currentWallet) {
        updateSessionActivity(currentWallet);
      } else {
        clearInterval(activityInterval);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const currentWallet = getWalletCookie();
        if (currentWallet) {
          updateSessionActivity(currentWallet);
        }
      }
    };

    // Handle page unload (cleanup session)
    const handleBeforeUnload = () => {
      const currentWallet = getWalletCookie();
      if (currentWallet) {
        // Use sendBeacon for reliable cleanup on page unload
        const data = JSON.stringify({
          action: 'deactivate_session',
          wallet: currentWallet
        });
        
        try {
          navigator.sendBeacon('/api/session-cleanup', data);
        } catch (error) {
          console.warn('[SessionManager] Beacon cleanup failed:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(activityInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}
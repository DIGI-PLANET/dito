'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { setSignMessageFn } from '@/lib/store';
import { clearAuthCache } from '@/lib/wallet-auth';
import { removeWalletCookie, getWalletCookie } from '@/lib/wallet-cookie';

/**
 * Hook that syncs the wallet adapter's signMessage to the global store auth.
 * Place this once in a layout or provider component.
 */
export function useWalletAuth() {
  const router = useRouter();
  const { signMessage, connected, publicKey } = useWallet();

  useEffect(() => {
    if (connected && signMessage && publicKey) {
      setSignMessageFn(signMessage);
    } else {
      // Wallet disconnected (either from app or from wallet directly)
      setSignMessageFn(null);
      clearAuthCache();
      
      // If we had a wallet cookie but now disconnected, clean up
      const hadWallet = getWalletCookie();
      if (hadWallet && !connected) {
        console.log('[WalletAuth] Wallet disconnected externally, cleaning up...');
        removeWalletCookie();
        
        // Redirect to connect page after a small delay to avoid render conflicts
        setTimeout(() => {
          router.replace('/connect');
        }, 100);
      }
    }
  }, [connected, signMessage, publicKey, router]);
}

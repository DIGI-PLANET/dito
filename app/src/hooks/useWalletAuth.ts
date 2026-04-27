'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePhantom, useSolana } from '@phantom/react-sdk';
import { setSignMessageFn } from '@/lib/store';
import { clearAuthCache } from '@/lib/wallet-auth';
import { removeWalletCookie, getWalletCookie } from '@/lib/wallet-cookie';

/**
 * Syncs the Phantom SDK's Solana signMessage to the global store auth.
 * Place this once in a layout/provider so app code can call `getSignMessage()`
 * without dragging the SDK hook everywhere.
 *
 * Disconnect cleanup mirrors the previous wallet-adapter behaviour: if a
 * wallet cookie is present but the SDK reports disconnected, we wipe local
 * state and bounce to /connect.
 */
export function useWalletAuth() {
  const router = useRouter();
  const { isConnected, addresses } = usePhantom();
  const { solana, isAvailable } = useSolana();

  useEffect(() => {
    if (isConnected && isAvailable && addresses && addresses.length > 0) {
      // Bridge Phantom's signMessage to the legacy store contract
      // (which expects (msg: Uint8Array) => Promise<Uint8Array>).
      const signMessage = async (message: Uint8Array): Promise<Uint8Array> => {
        const result = await solana.signMessage(message);
        // Phantom SDK returns either Uint8Array or { signature: Uint8Array }
        if (result instanceof Uint8Array) return result;
        const sig = (result as { signature?: Uint8Array | string })?.signature;
        if (sig instanceof Uint8Array) return sig;
        if (typeof sig === 'string') {
          // base64-decode if needed
          return Uint8Array.from(atob(sig), (c) => c.charCodeAt(0));
        }
        throw new Error('Unexpected signMessage result shape from Phantom SDK');
      };
      setSignMessageFn(signMessage);
    } else {
      setSignMessageFn(null);
      clearAuthCache();

      const hadWallet = getWalletCookie();
      if (hadWallet && !isConnected) {
        console.log('[WalletAuth] Wallet disconnected, cleaning up...');
        removeWalletCookie();
        setTimeout(() => {
          router.replace('/connect');
        }, 100);
      }
    }
  }, [isConnected, isAvailable, solana, addresses, router]);
}

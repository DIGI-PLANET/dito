'use client';

import { useMemo, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
  LedgerWalletAdapter,
  Coin98WalletAdapter,
  TokenPocketWalletAdapter,
  MathWalletAdapter,
  SafePalWalletAdapter,
  NightlyWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { getWalletCookie } from '@/lib/wallet-cookie';

import '@solana/wallet-adapter-react-ui/styles.css';

function WalletAuthSync({ children }: { children: ReactNode }) {
  useWalletAuth();
  return <>{children}</>;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
  // Only autoConnect if user was previously logged in (has wallet cookie)
  const shouldAutoConnect = useMemo(() => !!getWalletCookie(), []);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new LedgerWalletAdapter(),
      new Coin98WalletAdapter(),
      new TokenPocketWalletAdapter(),
      new MathWalletAdapter(),
      new SafePalWalletAdapter(),
      new NightlyWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={shouldAutoConnect}>
        <WalletModalProvider>
          <WalletAuthSync>
            {children}
          </WalletAuthSync>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

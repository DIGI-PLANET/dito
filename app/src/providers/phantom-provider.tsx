'use client';

import { ReactNode } from 'react';
import { useTheme } from 'next-themes';
import {
  PhantomProvider as PhantomSDKProvider,
  AddressType,
  darkTheme,
  lightTheme,
} from '@phantom/react-sdk';
import { useWalletAuth } from '@/hooks/useWalletAuth';

function WalletAuthSync({ children }: { children: ReactNode }) {
  useWalletAuth();
  return <>{children}</>;
}

const APP_ID =
  process.env.NEXT_PUBLIC_PHANTOM_APP_ID ||
  'f6e1ed4d-5f34-4ff2-ad13-b72d97f8475c';

const APP_ICON =
  process.env.NEXT_PUBLIC_PHANTOM_APP_ICON ||
  'https://phantom-portal20240925173430423400000001.s3.ca-central-1.amazonaws.com/icons/e73b6f5a-7276-428d-85c1-d055fbd9ccbd.jpg';

function buildRedirectUrl(): string | undefined {
  // Configurable via env (registered in Phantom Portal whitelist).
  const explicit = process.env.NEXT_PUBLIC_PHANTOM_REDIRECT_URL;
  if (explicit) return explicit;
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth`;
  }
  return undefined;
}

/**
 * Wraps `@phantom/react-sdk`'s `PhantomProvider` with our theme provider.
 * Currently scoped to the auth flow only — we still use `@solana/wallet-adapter-react`
 * for in-app Solana actions (mint, sign messages) until they migrate.
 */
export function PhantomProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'dark' ? darkTheme : lightTheme;

  return (
    <PhantomSDKProvider
      config={{
        providers: ['google', 'apple', 'injected'],
        appId: APP_ID,
        addressTypes: [AddressType.solana],
        authOptions: {
          redirectUrl: buildRedirectUrl(),
        },
      }}
      theme={theme}
      appIcon={APP_ICON}
      appName="DITO"
    >
      <WalletAuthSync>{children}</WalletAuthSync>
    </PhantomSDKProvider>
  );
}

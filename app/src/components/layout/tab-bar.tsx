'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Flame, Gem, Archive, Settings, Lock } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { getWalletCookie } from '@/lib/wallet-cookie';
import { store } from '@/lib/store';

const tabs = [
  { href: '/dashboard', Icon: Home, labelKey: 'tab.home' as const },
  {
    href: '/today',
    Icon: Flame,
    labelKey: 'tab.today' as const,
    requiresDiscovery: true,
  },
  {
    href: '/ember',
    Icon: Gem,
    labelKey: 'tab.ember' as const,
    gated: true,
    requiresDiscovery: true,
  },
  {
    href: '/memories',
    Icon: Archive,
    labelKey: 'tab.memories' as const,
    requiresDiscovery: true,
  },
  { href: '/auth', Icon: Settings, labelKey: 'tab.settings' as const },
];

export function TabBar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [hasWallet, setHasWallet] = useState(false);
  const [hasCompletedDiscovery, setHasCompletedDiscovery] = useState(false);

  useEffect(() => {
    const wallet = getWalletCookie();
    setHasWallet(!!wallet);

    if (wallet) {
      const profile = store.getProfile();
      setHasCompletedDiscovery(!!profile.current_talent);
    } else {
      setHasCompletedDiscovery(false);
    }
  }, []);

  // Hide on landing, discovery, onboarding — and always when no wallet
  if (
    pathname === '/' ||
    !hasWallet ||
    pathname === '/discovery' ||
    pathname === '/onboarding'
  ) {
    return null;
  }

  return (
    <nav className="tab-bar">
      {tabs.map((tab) => {
        const walletLocked = tab.gated && !hasWallet;
        const discoveryLocked =
          tab.requiresDiscovery && (!hasWallet || !hasCompletedDiscovery);
        const locked = walletLocked || discoveryLocked;
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
        const Icon = tab.Icon;

        const TabContent = (
          <>
            <span className="tab-icon relative">
              <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
              {locked && (
                <Lock
                  className="absolute -right-2 -top-1 h-3 w-3"
                  strokeWidth={2}
                  style={{ color: 'var(--fg-dimmer)' }}
                />
              )}
            </span>
            <span>{t(tab.labelKey)}</span>
          </>
        );

        if (locked) {
          return (
            <button
              key={tab.href}
              className={`${active ? 'active' : ''} tab-locked cursor-not-allowed`}
              onClick={(e) => e.preventDefault()}
            >
              {TabContent}
            </button>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${active ? 'active' : ''}`}
          >
            {TabContent}
          </Link>
        );
      })}
    </nav>
  );
}

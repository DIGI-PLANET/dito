'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/providers/i18n-provider';
import { getWalletCookie } from '@/lib/wallet-cookie';
import { store } from '@/lib/store';

const tabs = [
  { href: '/', icon: '🏠', labelKey: 'tab.home' as const },
  { href: '/chat', icon: '💬', labelKey: 'tab.chat' as const, requiresDiscovery: true },
  { href: '/soul', icon: 'ember-logo', labelKey: 'tab.soul' as const, gated: true, requiresDiscovery: true },
  { href: '/guide', icon: '📖', labelKey: 'tab.guide' as const },
  { href: '/auth', icon: '⚙️', labelKey: 'tab.settings' as const, altLabelKey: 'tab.connect' as const, altIcon: '🔗' },
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

  // Hide on landing, discovery, onboarding, and when no wallet
  if (pathname === '/' || !hasWallet || pathname === '/discovery' || pathname === '/onboarding') return null;

  return (
    <nav className="tab-bar">
      {tabs.map((tab) => {
        const walletLocked = tab.gated && !hasWallet;
        const discoveryLocked = tab.requiresDiscovery && (!hasWallet || !hasCompletedDiscovery);
        const locked = walletLocked || discoveryLocked;
        
        const icon = (!hasWallet && 'altIcon' in tab) ? tab.altIcon as string : tab.icon;
        const labelKey = (!hasWallet && 'altLabelKey' in tab) ? tab.altLabelKey as Parameters<typeof t>[0] : tab.labelKey;
        
        const TabContent = (
          <>
            <span className="tab-icon">
              {icon === 'ember-logo' ? '🔥' : icon}
              {locked && <span className="tab-lock">🔒</span>}
            </span>
            <span>{t(labelKey)}</span>
          </>
        );
        
        // If locked, render as button that does nothing
        if (locked) {
          return (
            <button
              key={tab.href}
              className={`${pathname === tab.href ? 'active' : ''} tab-locked cursor-not-allowed`}
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
            className={`${pathname === tab.href ? 'active' : ''}`}
          >
            {TabContent}
          </Link>
        );
      })}
    </nav>
  );
}

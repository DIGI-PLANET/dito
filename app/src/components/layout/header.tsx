'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useI18n } from '@/providers/i18n-provider';
import { useEffect, useState } from 'react';
import { NotificationBell } from './notification-bell';
import { getWalletCookie } from '@/lib/wallet-cookie';

const PAGE_TITLES: Record<string, { en: string; ko: string } | { connected: { en: string; ko: string }; disconnected: { en: string; ko: string } }> = {
  '/chat': { en: 'Ember Diary', ko: 'Ember 일기' },
  '/soul': { en: 'Ember Soul', ko: 'Ember Soul' },
  '/guide': { en: 'Guide', ko: '가이드' },
  '/connect': { connected: { en: 'Settings', ko: '설정' }, disconnected: { en: 'Connect', ko: '연결' } },
  '/auth': { en: 'Portal Entry', ko: '포털 진입' },
  '/auth/signup': { en: 'Sign Up', ko: '회원가입' },
  '/auth/login': { en: 'Sign In', ko: '로그인' },
  '/mint': { en: 'Awaken', ko: '각성' },
  '/privacy': { en: 'Privacy Policy', ko: '개인정보 처리방침' },
  '/terms': { en: 'Terms of Service', ko: '이용약관' },
};

export function Header() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [onSecondSection, setOnSecondSection] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      setOnSecondSection((e as CustomEvent<{ onSecond: boolean }>).detail.onSecond);
    };
    window.addEventListener('landing-section-change', handler);
    return () => window.removeEventListener('landing-section-change', handler);
  }, []);

  // Hide header on pages with custom headers
  if (pathname === '/discovery' || pathname === '/onboarding') return null;

  const isHome = pathname === '/';
  const mainPages = ['/', '/chat', '/soul', '/guide'];
  const isMainPage = mainPages.includes(pathname);
  const closePages = ['/privacy', '/terms', '/connect'];
  const titleEntry = PAGE_TITLES[pathname];
  const hasWallet = mounted ? !!getWalletCookie() : false;
  
  // Only calculate pageTitle when mounted to avoid hydration mismatch
  const pageTitle = !mounted ? '' : titleEntry
    ? ('connected' in titleEntry
      ? (hasWallet ? titleEntry.connected[lang] : titleEntry.disconnected[lang])
      : titleEntry[lang])
    : '';

  const isLanding = isHome && !hasWallet;

  const landingStyle = isLanding
    ? (onSecondSection
      ? undefined
      : { background: 'transparent', borderBottom: 'none', backdropFilter: 'none' })
    : undefined;

  return (
    <header className={`app-header ${isLanding ? 'app-header-landing' : ''}`} style={landingStyle}>
      {/* Left: Back button (not on home) */}
      <div className="flex items-center w-16">
        {!isMainPage ? (
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground px-1 py-1 rounded-lg transition-colors"
          >
            {closePages.includes(pathname) ? '✕' : '←'}
          </button>
        ) : (
          <div className="w-6" />
        )}
      </div>

      {/* Center: Up button on landing second section, logo on home, page title elsewhere */}
      {isLanding ? (
        onSecondSection ? (
          <button
            onClick={() => {
              const container = document.querySelector('.snap-container');
              if (container) container.scrollBy({ top: -container.clientHeight, behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-0.5 text-[#ff6b35] hover:text-[#ff8c5a] transition-colors animate-bounce mt-6"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
            <span className="text-[11px] font-medium">{t('scroll.up')}</span>
          </button>
        ) : <div />
      ) : isHome ? (
        <Link href="/" className="text-lg font-bold">
          <span className="text-[#ff6b35]">DITO</span>
          <span className="text-muted-foreground">.guru</span>
        </Link>
      ) : (
        <span className="text-base font-bold">{pageTitle}</span>
      )}

      {/* Right: Theme + Lang */}
      <div className="flex items-center gap-1 justify-end">
        {hasWallet && <NotificationBell />}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-base px-1 py-1 rounded-lg transition-colors"
        >
          {mounted ? (theme === 'dark' ? '☀️' : '🌙') : '🌙'}
        </button>
        <button
          onClick={() => setLang(lang === 'en' ? 'ko' : 'en')}
          className="text-xs text-muted-foreground hover:text-foreground px-1 py-1 rounded-lg transition-colors"
        >
          {lang === 'en' ? '한' : 'EN'}
        </button>
      </div>
    </header>
  );
}

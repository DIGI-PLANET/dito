'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/providers/i18n-provider';
import { t } from '@/lib/i18n';

const CONSENT_KEY = 'dito-cookie-consent';

export function CookieBanner() {
  const { lang } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasConsent = document.cookie.includes(CONSENT_KEY);
    if (!hasConsent) {
      const id = window.setTimeout(() => setVisible(true), 1200);
      return () => window.clearTimeout(id);
    }
  }, []);

  const decide = (value: 'all' | 'essential') => {
    document.cookie = `${CONSENT_KEY}=${value}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Strict`;
    setVisible(false);
  };

  return (
    <aside
      role="dialog"
      aria-live="polite"
      aria-label={t(lang, 'cookie.kicker')}
      className="fixed left-6 bottom-6 z-200 w-[min(360px,calc(100vw-48px))] rounded-2xl px-5.5 pt-5 pb-4.5 backdrop-blur-md transition-all duration-350 ease-out max-md:left-3 max-md:right-3 max-md:bottom-3 max-md:w-auto max-md:max-w-none max-md:px-4.5 max-md:pt-4.5 max-md:pb-4 max-md:rounded-xl"
      style={{
        background: 'rgba(14, 12, 11, 0.92)',
        border: '1px solid var(--rule)',
        color: 'var(--fg)',
        boxShadow: '0 18px 40px -20px rgba(0,0,0,0.7)',
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        className="mb-2.5"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'var(--ember)',
        }}
      >
        {t(lang, 'cookie.kicker')}
      </div>
      <h4
        className="m-0 mb-1.5"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 400,
          fontSize: 18,
          letterSpacing: '-0.01em',
          color: 'var(--fg)',
        }}
      >
        {t(lang, 'cookie.title')}
      </h4>
      <p
        className="m-0 mb-4"
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 12.5,
          lineHeight: 1.6,
          color: 'var(--fg-dim)',
        }}
      >
        {t(lang, 'cookie.body')}{' '}
        <Link
          href="/privacy"
          className="transition-colors"
          style={{
            color: 'var(--fg)',
            borderBottom: '1px solid var(--rule)',
          }}
        >
          {t(lang, 'cookie.learn')}
        </Link>
      </p>
      <div className="flex gap-2 items-center max-md:flex-wrap max-[420px]:flex-col max-[420px]:items-stretch max-[420px]:gap-1.5">
        <button
          type="button"
          onClick={() => decide('all')}
          className="cursor-pointer transition-colors max-md:flex-1 max-md:min-w-30 max-[420px]:w-full"
          style={{
            appearance: 'none',
            border: '1px solid var(--ember)',
            background: 'var(--ember)',
            color: '#0e0c0b',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            padding: '9px 14px',
            borderRadius: 999,
          }}
        >
          {t(lang, 'cookie.acceptAll')}
        </button>
        <button
          type="button"
          onClick={() => decide('essential')}
          className="cursor-pointer transition-colors hover:border-(--fg-dim) hover:text-(--fg) max-md:flex-1 max-md:min-w-30 max-[420px]:w-full"
          style={{
            appearance: 'none',
            border: '1px solid var(--rule)',
            background: 'transparent',
            color: 'var(--fg-dim)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            padding: '9px 14px',
            borderRadius: 999,
          }}
        >
          {t(lang, 'cookie.essential')}
        </button>
      </div>
    </aside>
  );
}

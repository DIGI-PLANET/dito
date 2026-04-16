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
    const checkConsent = () => {
      const hasConsent = document.cookie.includes(CONSENT_KEY);
      if (!hasConsent) setVisible(true);
    };
    checkConsent();
  }, []);

  const handleConsent = (accepted: boolean) => {
    document.cookie = `${CONSENT_KEY}=${accepted ? 'true' : 'false'}; path=/; max-age=${365*24*60*60}; SameSite=Strict`;
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3">
        <p className="flex-1 text-xs text-muted-foreground text-center sm:text-left">
          🍪 {t(lang, 'cookie.text')}
          {' '}
          <Link href="/privacy" className="underline hover:text-[#ff6b35]">
            {t(lang, 'cookie.learn')}
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handleConsent(false)}
            className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t(lang, 'cookie.decline')}
          </button>
          <button
            onClick={() => handleConsent(true)}
            className="rounded-xl bg-[#ff6b35] px-4 py-2 text-xs font-medium text-white hover:bg-[#e55a2b] transition-colors"
          >
            {t(lang, 'cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}

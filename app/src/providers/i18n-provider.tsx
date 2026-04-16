'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lang, t, TranslationKey } from '@/lib/i18n';

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const Ctx = createContext<I18nCtx>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

const LANG_COOKIE = 'dito-lang';

function getLangCookie(): Lang | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`${LANG_COOKIE}=([^;]*)`));
  return match ? (match[1] as Lang) : null;
}

function setLangCookie(l: Lang) {
  if (typeof document === 'undefined') return;
  document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=${365*24*60*60}; SameSite=Strict`;
}

function detectLang(): Lang {
  const saved = getLangCookie();
  if (saved) return saved;
  if (typeof navigator === 'undefined') return 'en';
  const browserLang = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || '';
  return browserLang.startsWith('ko') ? 'ko' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    setLangCookie(l);
  };

  return (
    <Ctx.Provider value={{ lang, setLang, t: (key) => t(lang, key) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useI18n = () => useContext(Ctx);

'use client';

import { ReactNode, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useI18n } from '@/providers/i18n-provider';
import styles from './legal-shell.module.css';

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

type LegalShellProps = {
  kicker: string;
  title: string;
  lede: ReactNode;
  meta: string;
  backLabel: string;
  children: ReactNode;
};

export function LegalShell({
  kicker,
  title,
  lede,
  meta,
  backLabel,
  children,
}: LegalShellProps) {
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useI18n();
  const [mounted, setMounted] = useState(false);

  const isKo = lang === 'ko';

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleThemeToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doc = document as DocWithVT;
    if (reduce || !doc.startViewTransition) {
      setTheme(next);
      return;
    }
    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    const transition = doc.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });
    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 550,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  const handleLangToggle = () => {
    const next = lang === 'ko' ? 'en' : 'ko';
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doc = document as DocWithVT;
    if (reduce || !doc.startViewTransition) {
      setLang(next);
      return;
    }
    doc.startViewTransition(() => {
      flushSync(() => setLang(next));
    });
  };

  return (
    <div data-landing-page className={styles.root}>
      <header className={styles.top}>
        <Link href="/" className={styles.brand} aria-label="DITO home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ember-logo.png" alt="" />
          <span>DITO</span>
        </Link>
        <div className={styles.topRight}>
          {mounted && (
            <button
              type="button"
              onClick={handleThemeToggle}
              className={styles.ctrlIcon}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={handleLangToggle}
            className={styles.ctrl}
            aria-label={isKo ? 'Switch to English' : '한국어로 변경'}
          >
            {isKo ? 'English' : '한국어'}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.kicker}>{kicker}</div>
        <h1>{title}</h1>
        <p className={styles.lede}>{lede}</p>
        <p className={styles.meta}>{meta}</p>

        {children}

        <p className={styles.back}>
          <Link href="/">← {backLabel}</Link>
        </p>
      </main>

      <footer className={styles.foot}>
        <span className={styles.fLeft}>DITO</span>
        <span className={styles.fMid}>
          <a
            href="https://x.com/0xDARGONNE"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            title="X"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
            </svg>
          </a>
          <a
            href="https://discord.gg/6Cjn2sJZrV"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Discord"
            title="Discord"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3.2a.074.074 0 0 0-.078.037c-.34.6-.717 1.382-.98 1.999a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.997-1.999.077.077 0 0 0-.078-.037A19.74 19.74 0 0 0 5.18 4.369a.07.07 0 0 0-.032.027C2.522 8.32 1.79 12.144 2.149 15.92a.083.083 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.027 14.2 14.2 0 0 0 1.226-1.994.075.075 0 0 0-.041-.104 13.13 13.13 0 0 1-1.872-.892.077.077 0 0 1-.008-.127c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.041.105c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .031-.055c.43-4.367-.72-8.16-3.046-11.524a.061.061 0 0 0-.031-.028ZM8.02 13.62c-1.182 0-2.156-1.085-2.156-2.418 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.095 2.156 2.42 0 1.332-.955 2.417-2.156 2.417Zm7.974 0c-1.183 0-2.157-1.085-2.157-2.418 0-1.333.955-2.419 2.157-2.419 1.21 0 2.175 1.095 2.156 2.42 0 1.332-.946 2.417-2.156 2.417Z" />
            </svg>
          </a>
        </span>
        <span className={styles.fRight}>
          <span>
            <Link href="/privacy">Privacy</Link>
            <span className={styles.dot}>·</span>
            <Link href="/terms">Terms</Link>
          </span>
          <span className={styles.copy}>© 2026 DIGI PLANET</span>
        </span>
      </footer>
    </div>
  );
}

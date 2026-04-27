'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useI18n } from '@/providers/i18n-provider';
import styles from './page.module.css';

type FlameProfile = {
  size: number;
  sat: number;
  bright: number;
  opac: number;
  glow: number;
  halo: number;
};

const FLAME_PROFILES: Record<string, FlameProfile> = {
  dormant: { size: 130, sat: 0.12, bright: 0.5,  opac: 0.28, glow: 0.0, halo: 0.0 },
  sparked: { size: 190, sat: 0.55, bright: 0.85, opac: 0.75, glow: 0.3, halo: 0.35 },
  burning: { size: 260, sat: 0.85, bright: 1.0,  opac: 0.95, glow: 0.6, halo: 0.55 },
  blazing: { size: 320, sat: 1.05, bright: 1.05, opac: 1.0,  glow: 0.85, halo: 0.75 },
  radiant: { size: 380, sat: 1.1,  bright: 1.08, opac: 1.0,  glow: 1.05, halo: 0.9 },
  eternal: { size: 440, sat: 1.15, bright: 1.12, opac: 1.0,  glow: 1.3,  halo: 1.0 },
};

type Stage = keyof typeof FLAME_PROFILES;

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

function flameFilter(stage: Stage) {
  const p = FLAME_PROFILES[stage];
  const glow = p.glow;
  return [
    `saturate(${p.sat})`,
    `brightness(${p.bright})`,
    glow > 0
      ? `drop-shadow(0 0 ${10 * glow}px rgba(232,119,72,${0.38 * glow}))`
      : '',
    glow > 0.4
      ? `drop-shadow(0 0 ${28 * glow}px rgba(201,80,45,${0.22 * glow}))`
      : '',
    stage === 'eternal'
      ? 'drop-shadow(0 0 36px rgba(240,215,168,0.4))'
      : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function haloBackground(stage: Stage) {
  const a = FLAME_PROFILES[stage].halo;
  return `radial-gradient(circle at 50% 50%, rgba(217,88,44, ${a * 0.35}) 0%, rgba(47,157,163, ${a * 0.08}) 40%, transparent 65%)`;
}

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<Stage>('dormant');
  const [scrollPct, setScrollPct] = useState(0);
  const sceneRefs = useRef<Array<HTMLElement | null>>([]);

  const isKo = lang === 'ko';

  // Mount + default theme
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (typeof window !== 'undefined' && !localStorage.getItem('theme')) {
      setTheme('dark');
    }
  }, [setTheme]);

  // Snap-scroll on the document — only while landing is mounted
  useEffect(() => {
    const html = document.documentElement;
    const prevSnap = html.style.scrollSnapType;
    const prevBeh = html.style.scrollBehavior;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      html.style.scrollSnapType = 'y mandatory';
      html.style.scrollBehavior = 'smooth';
    }
    return () => {
      html.style.scrollSnapType = prevSnap;
      html.style.scrollBehavior = prevBeh;
    };
  }, []);

  // Stage tracking via IntersectionObserver
  useEffect(() => {
    const sections = sceneRefs.current.filter(Boolean) as HTMLElement[];
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length) {
          const next = visible[0].target.getAttribute('data-stage') as Stage | null;
          if (next) setStage(next);
        }
      },
      { threshold: [0.4, 0.6, 0.8] }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Scroll progress for ribbon
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const pct = total > 0 ? (h.scrollTop / total) * 100 : 0;
      setScrollPct(pct);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Theme toggle — radial reveal from click
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

  // Lang toggle — view-transition cross-fade
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

  const flameSize = FLAME_PROFILES[stage].size;
  const flameOpacity = FLAME_PROFILES[stage].opac;
  const filter = flameFilter(stage);
  const halo = haloBackground(stage);

  // Localized strings — emphasis is wrapped via inline <em> with var(--ember)
  const t = (en: React.ReactNode, ko: React.ReactNode) => (isKo ? ko : en);

  return (
    <div data-landing-page className={styles.root}>
      {/* Top-left mark + DITO wordmark */}
      <div className={styles.top}>
        <Link
          href="/"
          aria-label="DITO home"
          className="flex items-center gap-2.5 text-current"
        >
          <span className={styles.mark}>
            {/* Use <img> directly — mix-blend-mode interacts poorly with next/image's wrapping */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ember-logo.png" alt="" />
          </span>
          <span className={styles.wm}>DITO</span>
        </Link>
      </div>

      {/* Top-right controls: Portal · theme · language */}
      <div className={styles.topRight}>
        <Link
          href="/auth"
          className={`${styles.ctrl} ${styles.ctrlPortal}`}
          aria-label={isKo ? '포털 진입' : 'Enter Portal'}
        >
          <span className={styles.ctrlPortalDot} aria-hidden />
          <span>{isKo ? '포털 진입' : 'Enter Portal'}</span>
        </Link>
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

      {/* Right-edge progress ribbon */}
      <div className={styles.ribbon} aria-hidden>
        <div
          className={styles.ribbonFill}
          style={{ height: `${scrollPct}%` }}
        />
      </div>

      {/* Sticky flame */}
      <div className={styles.flameStage} aria-hidden>
        <div className={styles.halo} style={{ background: halo }} />
        <div
          className={styles.flame}
          style={{ width: flameSize, height: flameSize }}
        >
          {/* Plain <img> — same artwork the design uses, reactive to filter */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ember-logo.png"
            alt=""
            style={{ filter, opacity: flameOpacity }}
          />
        </div>
      </div>

      <main className={styles.main}>
        {/* 00 — cold open */}
        <section
          ref={(el) => { sceneRefs.current[0] = el; }}
          className={styles.coldOpen}
          data-stage="dormant"
        >
          <h1>
            {t(
              <>
                Do you really think
                <br />
                you’ve found <em>your&nbsp;gift</em>?
              </>,
              <>
                너는 진짜 너의
                <br />
                <em>재능</em>을 찾았다고 생각해?
              </>
            )}
          </h1>
          <p className={styles.coldSub}>
            {t(
              <>
                The aptitude tests you took
                <br />
                were never built to find it.
              </>,
              <>
                틀에 박힌 적성 검사들은
                <br />
                진짜 너를 찾을 수 있을까?
              </>
            )}
          </p>
          <div className={styles.scrollHint}>
            <span className={styles.scrollHintDot} />
            {isKo ? '우리 얘기를 들어봐' : 'listen to us.'}
          </div>
          <Link href="/auth" className={styles.skipPortal}>
            <span className={styles.ctrlPortalDot} aria-hidden />
            <span>{isKo ? '건너뛰고 포털로 진입 →' : 'Skip to the portal →'}</span>
          </Link>
        </section>

        {/* 01 — Dargonne · hidden flame */}
        <section
          ref={(el) => { sceneRefs.current[1] = el; }}
          className={styles.scene}
          data-stage="sparked"
        >
          <div className={`${styles.beat} ${styles.dargonneLine}`}>
            <p className={styles.line}>
              {t(
                <>
                  You have
                  <br />a <em>hidden flame</em>.
                </>,
                <>
                  너에게는
                  <br />
                  숨겨진 <em>불꽃</em>이 있어.
                </>
              )}
            </p>
            <p className={styles.sub}>
              {t(
                <>
                  Everyone does. Most people just walk past it. I won’t — and I’ll
                  help you grow the smallest spark into something only you could
                  have lit.
                </>,
                <>
                  인간들에게는 각자 다른 잠재력이 있어. 다만 너희들이 알아채지
                  못하는 것일 뿐. 우리는 너의 작은 불꽃을 피울 거야.
                </>
              )}
            </p>
          </div>
        </section>

        {/* 02 — Reason 01: irreplaceable */}
        <section
          ref={(el) => { sceneRefs.current[2] = el; }}
          className={styles.scene}
          data-stage="sparked"
        >
          <div className={styles.beat}>
            <div className={styles.kicker}>Reason 01</div>
            <p className={styles.line}>
              {t(
                <>
                  Your gift
                  <br />
                  is <em>irreplaceable</em>.
                </>,
                <>
                  너의 재능은
                  <br />
                  절대 <em>대체될 수 없어</em>.
                </>
              )}
            </p>
            <p className={styles.sub}>
              {t(
                <>
                  Ember talks with you, finds the gift only you carry, and seals
                  every step you take. The record can’t be copied or rewritten.
                </>,
                <>
                  Ember와의 대화로 너만의 재능을 찾고, 합의된 발자취를 봉인해. 그
                  기록은 복제되거나 조작될 수 없어.
                </>
              )}
            </p>
          </div>
        </section>

        {/* 03 — Reason 02: don't fit a category */}
        <section
          ref={(el) => { sceneRefs.current[3] = el; }}
          className={styles.scene}
          data-stage="burning"
        >
          <div className={styles.beat}>
            <div className={styles.kicker}>Reason 02</div>
            <p className={styles.line}>
              {t(
                <>
                  Don’t assume a gift
                  <br />
                  has to <em>fit a category</em>.
                </>,
                <>
                  재능의 영역이
                  <br />
                  <em>정해져 있다고</em> 단정하지 마.
                </>
              )}
            </p>
            <p className={styles.sub}>
              {t(
                <>
                  Inside our six realms, you customize the gift you’ll grow.
                  Break the mold — raise something that’s only yours. One rule:
                  nothing illegal.
                </>,
                <>
                  우리가 정한 6가지 카테고리 안에서 네가 성장시킬 재능을 자유롭게
                  커스텀 할 수 있어. 고정관념을 깨고 너만의 재능을 키워봐.
                </>
              )}
            </p>
          </div>
        </section>

        {/* 04 — Reason 03: record can't be faked */}
        <section
          ref={(el) => { sceneRefs.current[4] = el; }}
          className={styles.scene}
          data-stage="burning"
        >
          <div className={styles.beat}>
            <div className={styles.kicker}>Reason 03</div>
            <p className={styles.line}>
              {t(
                <>
                  The record <em>can’t be faked</em>.
                </>,
                <>
                  기록은 <em>조작될 수 없어</em>.
                </>
              )}
            </p>
            <p className={styles.sub}>
              {t(
                <>
                  Once a day is logged, it’s sealed. No edits, no backdating, no
                  rewriting yesterday into something it wasn’t. And every word
                  you share with Ember stays private — only what actually
                  happened becomes proof.
                </>,
                <>
                  매일의 기록은 봉인돼. 수정도, 지우기도, 어제를 다른 것으로 바꾸는
                  것도 안 돼. 그리고 Ember와 나눈 모든 대화는 철저히 비밀로
                  관리되니 안심해도 돼 — 실제로 일어난 것만 증거로 남아.
                </>
              )}
            </p>
          </div>
        </section>

        {/* 05 — daily trace */}
        <section
          ref={(el) => { sceneRefs.current[5] = el; }}
          className={styles.scene}
          data-stage="burning"
        >
          <div className={styles.beat}>
            <div className={styles.kicker}>
              {isKo ? '하루 중 언제든' : 'Whenever it happens'}
            </div>
            <p className={styles.line}>
              {t(
                <>
                  One day.
                  <br />
                  One <em>trace</em>.
                  <br />
                  That’s enough.
                </>,
                <>
                  하루에
                  <br />
                  <em>한 개</em>의
                  <br />
                  흔적.
                </>
              )}
            </p>
            <p className={styles.sub}>
              {t(
                <>
                  Once you’ve named your gift, leave a trace each day — one
                  honest line about what you did with it. That trace feeds your
                  ember. Nothing else does.
                </>,
                <>
                  너의 재능을 정했다면 매일의 기록을 통해 흔적을 남겨. 그 한 줄이
                  너의 Ember를 키워. 다른 것은 그 역할을 대신할 수 없어.
                </>
              )}
            </p>
          </div>
        </section>

        {/* 06 — in time */}
        <section
          ref={(el) => { sceneRefs.current[6] = el; }}
          className={styles.scene}
          data-stage="blazing"
        >
          <div className={styles.beat}>
            <div className={styles.kicker}>
              {isKo ? '시간이 쌓이면' : 'In time'}
            </div>
            <p className={styles.line}>
              {t(
                <>
                  The ember you tended
                  <br />
                  becomes your <em>most</em>
                  <br />
                  <em>precious</em> thing.
                </>,
                <>
                  네가 살린 Ember는
                  <br />
                  너의 <em>가장</em>
                  <br />
                  <em>소중한</em> 자산이 돼.
                </>
              )}
            </p>
            <p className={styles.sub}>
              {t(
                <>
                  Day 10. Day 47. Day 112. The trace stacks up, and what you’ve
                  grown stops being a hobby. It becomes proof — the kind no
                  resume can carry.
                </>,
                <>
                  10일, 47일, 112일 — 흔적이 쌓이면 네가 키운 것은 더 이상 취미가
                  아니야. 이력서가 담을 수 없는 증거가 돼.
                </>
              )}
            </p>
          </div>
        </section>

        {/* 07 — Dargonne · journey begins */}
        <section
          ref={(el) => { sceneRefs.current[7] = el; }}
          className={styles.scene}
          data-stage="blazing"
        >
          <div className={`${styles.beat} ${styles.dargonneLine}`}>
            <p className={styles.line}>
              {t(
                <>
                  And our story
                  <br />
                  <em>begins here</em>.
                </>,
                <>
                  그리고 우리의 모험은
                  <br />
                  <em>이제부터</em>야.
                </>
              )}
            </p>
            <p className={styles.sub}>
              {t(
                <>
                  When enough Embers gather, the real adventures begin — Arenas,
                  Agents, kingdoms we’re already preparing for you. If you want
                  to walk this journey with us, step into the Portal now.
                </>,
                <>
                  여러 Ember들이 모이게 되면 앞으로 펼쳐질 재미있는 모험들을
                  준비하고 있어. 우리의 여정을 함께하고 싶다면 지금 바로 포털에
                  들어와.
                </>
              )}
            </p>
          </div>
        </section>

        {/* 08 — hearth */}
        <section
          ref={(el) => { sceneRefs.current[8] = el; }}
          className={styles.scene}
          data-stage="radiant"
        >
          <div className={styles.beat}>
            <div className={styles.kicker}>
              {isKo ? '시간이 흘러' : 'Over years'}
            </div>
            <p className={styles.line}>
              {t(
                <>
                  A shelf of <em>embers</em>.
                  <br />A record of <em>who you became</em>.
                </>,
                <>
                  Ember의 선반.
                  <br />
                  <em>네가 되어간 사람</em>의 기록.
                </>
              )}
            </p>
            <p className={styles.sub}>
              {t(
                <>
                  Each fire you kept alive — sealed, with its weight intact. A
                  long, undeniable trail of the gifts you actually grew, in the
                  order you grew them.
                </>,
                <>
                  네가 살린 모든 불은 그 무게 그대로 봉인돼. 네가 진짜로 키워낸
                  재능들의 길고 부인할 수 없는 자취가 돼.
                </>
              )}
            </p>
          </div>
        </section>

        {/* 09 — finale + footer */}
        <section
          ref={(el) => { sceneRefs.current[9] = el; }}
          className={styles.end}
          data-stage="eternal"
        >
          <div className={styles.endInner}>
            <div className={styles.kicker}>
              {isKo ? '준비가 되었다면' : 'When you’re ready'}
            </div>
            <h2>
              {t(
                <>
                  Summon <em>your ember</em>.
                  <br />
                  Prove you <em>exist</em>.
                </>,
                <>
                  <em>너의 Ember</em>를 소환하고
                  <br />
                  너의 <em>존재</em>를 증명해봐.
                </>
              )}
            </h2>
            <div className={styles.ctaRow}>
              <Link href="/auth" className={styles.cta}>
                {isKo ? '포털 진입 →' : 'Enter the Portal →'}
              </Link>
            </div>
          </div>

          <footer className={styles.footer}>
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
              <span className={styles.legal}>
                <Link href="/privacy">Privacy</Link>
                <span className={styles.dot}>·</span>
                <Link href="/terms">Terms</Link>
              </span>
              <span className={styles.copy}>© 2026 DIGI PLANET</span>
            </span>
          </footer>
        </section>
      </main>
    </div>
  );
}

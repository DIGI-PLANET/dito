'use client';

import Link from 'next/link';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { store } from '@/lib/store';
import { SoulCard } from '@/lib/types';
import { getWalletCookie } from '@/lib/wallet-cookie';

/* ───── Ember Counter Hook ───── */
/* ───── shared hooks ───── */

function useScrollAnim() {
  const observe = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.15 }
    );
    el.querySelectorAll('.anim-fade-up, .anim-slide-left, .anim-scale-in').forEach((child) => {
      observer.observe(child);
    });
    return () => observer.disconnect();
  }, []);
  return observe;
}

/* ───── Dashboard Sub-components ───── */

const BURNING_FEED = [
  { name: 'MusicLover_92', emoji: '🎵', quote: { en: '2 hours of guitar practice today!', ko: '오늘 기타 연습 2시간!' }, stage: 'burning', streak: 23 },
  { name: 'SilentBrush', emoji: '🎨', quote: { en: 'Finished my first digital drawing', ko: '첫 디지털 드로잉 완성' }, stage: 'sparked', streak: 5 },
  { name: 'CodeNinja', emoji: '🎮', quote: { en: 'Game prototype done!', ko: '게임 프로토타입 완성!' }, stage: 'blazing', streak: 45 },
  { name: 'RunnerHigh', emoji: '🏃', quote: { en: '5K personal best today', ko: '오늘 5K 개인 최고기록' }, stage: 'burning', streak: 12 },
];

const STAGE_BADGES: Record<string, string> = { sparked: '⚡', burning: '🔥', blazing: '🔥🔥' };

function EmberIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return <span className={`inline-block ${className}`} style={{ fontSize: size * 0.8 }}>🔥</span>;
}

function StageBadge({ stage }: { stage: string }) {
  if (stage === 'burning') return <EmberIcon size={16} />;
  if (stage === 'blazing') return <><EmberIcon size={16} /><EmberIcon size={16} /></>;
  return <>{STAGE_BADGES[stage] ?? stage}</>;
}

const DAILY_CHALLENGES = [
  { en: 'Write down 3 things you\'re naturally good at', ko: '자연스럽게 잘하는 것 3가지 적어보기' },
  { en: 'Spend 30 minutes on your talent without distractions', ko: '30분 동안 방해 없이 재능에 집중하기' },
  { en: 'Teach someone one thing you know well', ko: '잘 아는 것 하나를 누군가에게 가르쳐보기' },
  { en: 'Record a 1-minute video of your progress', ko: '1분짜리 성장 영상 기록하기' },
  { en: 'Find one person doing what you want to do, study them', ko: '하고 싶은 일을 하는 사람 1명 찾아서 연구하기' },
  { en: 'Try your talent in a completely new way', ko: '재능을 완전히 새로운 방식으로 시도하기' },
  { en: 'Write a letter to your future self about your journey', ko: '미래의 나에게 여정에 대한 편지 쓰기' },
];

function BurningNowFeed() {
  const { t, lang } = useI18n();
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">🔥 {t('home.burning')}</h2>
      <div className="flex flex-col gap-2">
        {BURNING_FEED.map((user, i) => (
          <div key={i} className="bg-card/50 border border-border/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{user.emoji} {user.name}</span>
              <span className="text-xs text-muted-foreground">
                <StageBadge stage={user.stage} /> {user.streak}{t('home.streakDays')}
              </span>
            </div>
            <p className="text-sm italic text-muted-foreground">
              &ldquo;{lang === 'ko' ? user.quote.ko : user.quote.en}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TodaysChallenge() {
  const { t, lang } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const init = () => {
      setMounted(true);
      const todayKey = `dito-chal-${new Date().toISOString().slice(0, 10)}`;
      setDone(document.cookie.includes(todayKey));
    };
    init();
  }, []);

  const dayIndex = mounted ? new Date().getDay() : 0;
  const challenge = DAILY_CHALLENGES[dayIndex];

  const toggleDone = () => {
    const todayKey = `dito-chal-${new Date().toISOString().slice(0, 10)}`;
    const next = !done;
    setDone(next);
    if (next) document.cookie = `${todayKey}=1; path=/; max-age=${24*60*60}; SameSite=Strict`;
    else document.cookie = `${todayKey}=; path=/; max-age=0`;
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">🎯 {t('home.challenge')}</h2>
      <div className="bg-gradient-to-r from-[#ff6b35]/10 to-transparent border border-[#ff6b35]/30 rounded-xl p-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium flex-1">
          {lang === 'ko' ? challenge.ko : challenge.en}
        </p>
        <button
          onClick={toggleDone}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0 ${
            done
              ? 'bg-[#ff6b35] text-white border-[#ff6b35]'
              : 'border-[#ff6b35]/50 text-[#ff6b35] hover:bg-[#ff6b35]/10'
          }`}
        >
          {t('home.challengeDone')}
        </button>
      </div>
    </div>
  );
}

/* ───── Dashboard ───── */

function Dashboard() {
  const { t } = useI18n();
  const [profile, setProfile] = useState(store.getProfile());
  const [souls, setSouls] = useState<SoulCard[]>([]);
  const [todayDone, setTodayDone] = useState(false);
  const [diaryDates, setDiaryDates] = useState<string[]>([]);

  const wallet = getWalletCookie();
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!wallet) return;
    store.getProfileAsync().then(setProfile);
    store.getSoulsAsync().then(setSouls);
    store.getDiaryDatesAsync().then((dates) => {
      setDiaryDates(dates);
      setTodayDone(dates.includes(today));
    });
  }, [wallet, today]);

  const name = profile.display_name || 'Explorer';
  const current_talent = profile.current_talent;
  const streak = (() => {
    if (diaryDates.length === 0) return 0;
    let count = 0;
    const d = new Date();
    // Check if today has entry; if not, start from yesterday
    const todayStr = d.toISOString().slice(0, 10);
    const dateSet = new Set(diaryDates);
    if (!dateSet.has(todayStr)) {
      d.setDate(d.getDate() - 1);
    }
    while (true) {
      const ds = d.toISOString().slice(0, 10);
      if (dateSet.has(ds)) {
        count++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  })();

  // Weekly activity
  const weekCount = (() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const cutoff = weekAgo.toISOString().slice(0, 10);
    return diaryDates.filter((d) => d >= cutoff).length;
  })();

  // Days since discovery (use first diary date as proxy)
  const [daysSince, setDaysSince] = useState(0);
  
  useEffect(() => {
    if (diaryDates.length > 0) {
      const days = Math.floor((Date.now() - new Date(diaryDates[0]).getTime()) / 86400000);
      setDaysSince(days);
    } else {
      setDaysSince(0);
    }
  }, [diaryDates]);

  const stageLabel: Record<string, string> = {
    sparked: '🌱 Sparked',
    burning: '🔥 Burning',
    blazing: '⚡ Blazing',
    radiant: '✨ Radiant',
    eternal: '💎 Eternal',
  };

  return (
    <div className="min-h-[100dvh] overflow-y-auto px-4 py-6 flex flex-col gap-4">
      {/* Greeting */}
      <h1 className="text-2xl font-bold">
        👋 {t('home.greeting').replace('{{name}}', name)}
      </h1>

      {/* Current Talent Card */}
      {current_talent ? (
        <div className="bg-card/50 border-2 border-[#ff6b35]/40 rounded-xl p-4 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">{t('home.current_talent')}</p>
          <p className="text-lg font-semibold">🎯 {current_talent}</p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{profile.ember_stage ? (stageLabel[profile.ember_stage] ?? profile.ember_stage) : 'sparked'}</span>
            {daysSince > 0 && <span>· {daysSince}d</span>}
          </div>
          <p className={`text-sm ${todayDone ? 'text-green-500' : 'text-muted-foreground'}`}>
            {todayDone ? t('home.todayDone') : t('home.todayPending')}
          </p>
          <Link href="/discovery">
            <Button className="w-full mt-1 bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-xl h-10">
              {t('home.goWrite')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-card/50 border border-border/50 rounded-xl p-4 flex flex-col gap-2 items-center">
          <p className="text-lg font-semibold">{t('home.noTalent')}</p>
          <Link href="/discovery">
            <Button className="bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-xl h-10 px-6">
              {t('home.goDiary')}
            </Button>
          </Link>
        </div>
      )}

      {/* Soul Portfolio Mini */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{t('home.portfolio')}</h2>
          {souls.length > 0 && (
            <Link href="/soul" className="text-sm text-[#ff6b35]">{t('home.seeAll')}</Link>
          )}
        </div>
        {souls.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('home.noSouls')}</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {souls.map((soul, i) => (
              <Link key={i} href="/soul" className="flex-shrink-0">
                <div className="w-20 bg-card/50 border border-border/50 rounded-xl p-2 flex flex-col items-center gap-1 text-center hover:border-[#ff6b35]/30 transition-colors">
                  <EmberIcon size={20} />
                  <span className="text-xs font-medium truncate w-full">{soul.talentLabel}</span>
                  <span className="text-[10px] text-muted-foreground">{stageLabel[soul.stage] ?? soul.stage}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Streak */}
      <div className="text-center py-2">
        {streak > 0 ? (
          <p className="text-lg font-bold text-[#ff6b35]">
            {t('home.streak').replace('{{count}}', String(streak))}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{t('home.noStreak')}</p>
        )}
      </div>

      {/* Weekly Activity */}
      <div className="text-center text-sm text-muted-foreground">
        📊 {t('home.weekActivity').replace('{{count}}', String(weekCount))}
      </div>

      {/* Burning Now Feed */}
      <BurningNowFeed />

      {/* Today's Challenge */}
      <TodaysChallenge />
    </div>
  );
}

/* ───── Landing (original) ───── */

function ScrollArrow({ direction, labelKey }: { direction: 'up' | 'down'; labelKey?: 'scroll.up' | 'scroll.down' | 'scroll.learn' }) {
  const { t } = useI18n();
  const isUp = direction === 'up';
  const label = labelKey ? t(labelKey) : t(isUp ? 'scroll.up' : 'scroll.down');
  return (
    <div className={`absolute ${isUp ? 'top-3' : 'bottom-6'} left-1/2 -translate-x-1/2 z-10 animate-bounce`}>
      <button
        onClick={() => {
          const container = document.querySelector('.snap-container');
          if (container) container.scrollBy({ top: isUp ? -container.clientHeight : container.clientHeight, behavior: 'smooth' });
        }}
        className="flex flex-col items-center gap-1 text-[#ff6b35] hover:text-[#ff8c5a] transition-colors drop-shadow-[0_0_8px_rgba(255,107,53,0.6)]"
      >
        {isUp && (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
            <span className="text-xs font-medium">{label}</span>
          </>
        )}
        {!isUp && (
          <>
            {labelKey === 'scroll.learn' && <EmberIcon size={18} />}
            <span className="text-xs font-medium">{label}</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}

function Landing() {
  const { t } = useI18n();
  const cardsRef = useRef<HTMLDivElement>(null);
  const setupAnim = useScrollAnim();

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    [cardsRef.current].forEach((el) => {
      if (el) {
        const cleanup = setupAnim(el);
        if (cleanup) cleanups.push(cleanup);
      }
    });
    return () => cleanups.forEach((fn) => fn());
  }, [setupAnim]);

  useEffect(() => {
    const sections = document.querySelectorAll('.snap-section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('in-view');
          const idx = Array.from(sections).indexOf(entry.target);
          if (idx === 1) {
            window.dispatchEvent(new CustomEvent('landing-section-change', {
              detail: { onSecond: entry.isIntersecting },
            }));
          }
        });
      },
      { threshold: 0.3 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="snap-container page-enter">
      {/* Hero Section */}
      <section className="snap-section relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#ff6b35]/20 rounded-full blur-[100px] animate-ember-glow" />
        <div className="absolute top-1/3 left-1/3 w-48 h-48 bg-[#ff6b35]/10 rounded-full blur-[80px] animate-ember-glow" style={{ animationDelay: '1.5s' }} />
        <div className="relative z-10 text-center w-full px-4">
          <h1 className="hero-title text-3xl sm:text-4xl font-bold mb-4 leading-tight whitespace-pre-line">
            {t('hero2.title')}
          </h1>
          <p className="hero-sub text-base sm:text-lg text-muted-foreground mb-4 leading-relaxed whitespace-pre-line">
            {t('hero2.sub')}
          </p>
          <p className="hero-hook text-lg sm:text-xl font-semibold mb-6">
            {t('hero2.hook').split(/\{\{|\}\}/).map((part, i) =>
              i % 2 === 1 ? <span key={i} className="text-[#ff6b35]">{part}</span> : <span key={i}>{part}</span>
            )}
          </p>
          <Link href="/auth">
            <Button className="hero-cta cta-pulse btn-interactive bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white text-base px-8 h-11 rounded-xl shadow-lg shadow-[#ff6b35]/25 w-full max-w-[280px]">
              {t('hero2.cta')}
            </Button>
          </Link>
          <div className="flex items-center gap-3 mt-3 mb-1 w-full max-w-[280px] mx-auto">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-[10px] text-muted-foreground">{t('hero2.divider')}</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <Link href="/auth" className="hero-connect flex justify-center">
            <Button variant="outline" className="btn-interactive border-[#ff6b35]/40 text-[#ff6b35] hover:bg-[#ff6b35]/10 text-sm px-8 h-10 rounded-xl w-full max-w-[280px]">
              {t('hero2.connect')}
            </Button>
          </Link>
        </div>
        <ScrollArrow direction="down" labelKey="scroll.learn" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-[#ff6b35] rounded-full opacity-60"
              style={{
                left: `${10 + i * 11}%`,
                bottom: '-10px',
                animation: `float-up ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.6}s`,
              }}
            />
          ))}
        </div>
      </section>

      {/* What is DITO */}
      <section
        className="snap-section relative"
        style={{ justifyContent: 'flex-start', overflowY: 'auto', paddingBottom: '40px' }}
        ref={cardsRef}
      >
        {/* DITO가 뭐야? */}
        <h2 className="anim-fade-up text-xl font-bold text-center w-full mb-8 px-4">{t('what.title')}</h2>

        {/* 소개 1 & 2 */}
        <div className="anim-fade-up anim-delay-1 text-center px-4 mb-8 space-y-5">
          <p className="text-sm text-muted-foreground leading-loose whitespace-pre-line">
            {t('what.intro1').split('\n').map((line, i) =>
              i === 0
                ? <span key={i} className="block text-[#ff6b35] font-semibold">{line}</span>
                : <span key={i} className="block">{line}</span>
            )}
          </p>
          <p className="text-sm text-muted-foreground leading-loose whitespace-pre-line">
            {t('what.intro2').split('\n').map((line, i) =>
              i === 0
                ? <span key={i} className="block text-[#ff6b35] font-semibold">{line}</span>
                : <span key={i} className="block">{line}</span>
            )}
          </p>
        </div>

        {/* 카테고리 카드 */}
        <div className="grid grid-cols-3 gap-2 w-full px-4 mb-8">
          {(['creative', 'physical', 'intellectual', 'social', 'technical', 'hybrid'] as const).map((key, i) => (
            <div key={key} className={`anim-fade-up anim-delay-${i + 2} bg-card/50 border border-border/50 rounded-xl p-3 transition-colors hover:border-[#ff6b35]/30 cursor-pointer`}>
              <div className="text-xl mb-1">{t(`cat.${key}.icon`)}</div>
              <div className="text-xs font-semibold">{t(`cat.${key}.name`)}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{t(`cat.${key}.ex`)}</div>
            </div>
          ))}
        </div>

        {/* 아직도 재능 없다고 생각해? */}
        <p className="anim-fade-up anim-delay-5 text-base font-bold text-center px-4 mb-3">{t('closing.title')}</p>

        {/* 버튼 (gap 0.5) */}
        <div className="anim-fade-up flex justify-center px-4 mb-8">
          <Link href="/auth">
            <Button className="cta-pulse btn-interactive bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white text-base px-8 h-11 rounded-xl shadow-lg shadow-[#ff6b35]/25">
              {t('closing.cta')}
            </Button>
          </Link>
        </div>

        {/* 소셜 링크 */}
        <div className="flex items-center justify-center gap-6">
          <a href="https://x.com/0xDARGONNE" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="X">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="https://discord.gg/6Cjn2sJZrV" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Discord">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
          </a>
          <a href="https://t.me/ditoguru" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Telegram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          </a>
          <a href="https://www.reddit.com/r/DITOGURU" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Reddit">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
          </a>
        </div>
      </section>
    </div>
  );
}

/* ───── Page Entry ───── */

export default function LandingPage() {
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const init = () => setMounted(true);
    init();
  }, []);

  if (!mounted) return null;
  if (connected) return <Dashboard />;
  return <Landing />;
}

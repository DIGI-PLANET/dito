'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Share2,
  Flame,
  Sparkles,
  Calendar,
  Clock,
  TrendingUp,
  Gem,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';

// ---------------------------------------------------------------------------
// Types & stub data
// ---------------------------------------------------------------------------

type Stage = 'sparked' | 'burning' | 'blazing' | 'radiant' | 'eternal';

interface StoredSoul {
  soul_id?: string;
  id?: string;
  label?: string;
  talentLabel?: string;
  traits?: string[];
  description?: string;
  stage?: Stage;
  mintDate?: string;
  mintTxHash?: string;
  mintAddress?: string;
  daysActive?: number;
  cycle?: { current: number; total: number; elapsed: number; remaining: number };
}

interface TimelineEvent {
  id: string;
  icon: string;
  titleEn: string;
  titleKo: string;
  bodyEn: string;
  bodyKo: string;
  whenEn: string;
  whenKo: string;
  amber?: boolean;
}

interface CyclePoint {
  label: string;
  value: number;
}

const STAGE_META: Record<
  Stage,
  { labelEn: string; labelKo: string; chip: string; order: number }
> = {
  sparked: { labelEn: 'Stage 1: Sparked', labelKo: '1단계: 점화', chip: 'Sparked', order: 1 },
  burning: { labelEn: 'Stage 2: Ignition', labelKo: '2단계: 불꽃', chip: 'Ignition', order: 2 },
  blazing: { labelEn: 'Stage 3: Blazing', labelKo: '3단계: 타오름', chip: 'Blazing', order: 3 },
  radiant: { labelEn: 'Stage 4: Radiant', labelKo: '4단계: 광휘', chip: 'Radiant', order: 4 },
  eternal: { labelEn: 'Stage 5: Eternal', labelKo: '5단계: 영원', chip: 'Eternal', order: 5 },
};

const FALLBACK_EVENTS: TimelineEvent[] = [
  {
    id: 'cycle-2',
    icon: '✨',
    titleEn: 'Cycle 2 Initiated',
    titleKo: '사이클 2 시작',
    bodyEn:
      'Ember responded positively to recent interactions, triggering a cycle advancement.',
    bodyKo: 'Ember가 최근 상호작용에 긍정적으로 반응하여 사이클이 진행되었습니다.',
    whenEn: '2 days ago',
    whenKo: '2일 전',
    amber: true,
  },
  {
    id: 'bond',
    icon: '🔥',
    titleEn: 'Bond Strengthened',
    titleKo: '유대 강화',
    bodyEn: 'Consistent daily check-ins have solidified the connection base.',
    bodyKo: '꾸준한 일일 체크인이 연결의 토대를 단단히 했습니다.',
    whenEn: '1 week ago',
    whenKo: '1주 전',
  },
  {
    id: 'stage-up',
    icon: '⬆️',
    titleEn: 'Advanced to Ignition',
    titleKo: '불꽃 단계 도달',
    bodyEn: 'Sparked graduated into Ignition after 14 days of steady practice.',
    bodyKo: '14일간의 꾸준한 수련으로 점화에서 불꽃 단계로 성장했습니다.',
    whenEn: '3 weeks ago',
    whenKo: '3주 전',
  },
  {
    id: 'mint',
    icon: '💎',
    titleEn: 'Soul Minted',
    titleKo: 'Soul 발행',
    bodyEn: 'The moment this Soul was forged on-chain and bound to your wallet.',
    bodyKo: '이 Soul이 온체인에서 주조되어 지갑에 결속된 순간입니다.',
    whenEn: 'Apr 17, 2026',
    whenKo: '2026년 4월 17일',
  },
];

const FALLBACK_CYCLES: CyclePoint[] = [
  { label: 'Cycle 1', value: 58 },
  { label: 'Cycle 2', value: 82 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readStoredSoul(id: string): StoredSoul | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('dito.souls.v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSoul[] | Record<string, StoredSoul>;
    if (Array.isArray(parsed)) {
      return (
        parsed.find(
          (s) => s.soul_id === id || s.id === id || (s.label && s.label === id),
        ) || null
      );
    }
    if (parsed && typeof parsed === 'object') {
      return (parsed as Record<string, StoredSoul>)[id] || null;
    }
    return null;
  } catch {
    return null;
  }
}

function buildMock(id: string): StoredSoul {
  return {
    soul_id: id,
    talentLabel: 'Ember Blaze',
    label: 'Ember Blaze',
    traits: ['Focused', 'Resilient', 'Curious'],
    description: 'A steady flame that learns by showing up every day.',
    stage: 'burning',
    mintDate: 'Apr 17, 2026',
    daysActive: 42,
    cycle: { current: 2, total: 3, elapsed: 28, remaining: 14 },
    mintAddress: id,
  };
}

function shortAddr(addr?: string): string {
  if (!addr) return '';
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SoulDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || '';
  const { t, lang } = useI18n();
  const isKo = lang === 'ko';

  const [mounted, setMounted] = useState(false);
  const [soul, setSoul] = useState<StoredSoul | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOlder, setShowOlder] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (!id) {
      setNotFound(true);
      return;
    }
    const stored = readStoredSoul(id);
    if (stored) {
      setSoul({ ...buildMock(id), ...stored });
    } else {
      // Fall back to a minimal mock so the page still renders (per spec).
      setSoul(buildMock(id));
    }
  }, [id]);

  useEffect(() => {
    if (!shareOpen) return;
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [shareOpen]);

  const derived = useMemo(() => {
    if (!soul) return null;
    const stage = (soul.stage || 'burning') as Stage;
    const meta = STAGE_META[stage];
    const cycle = soul.cycle || { current: 2, total: 3, elapsed: 28, remaining: 14 };
    const cycleTotalDays = Math.max(1, cycle.elapsed + cycle.remaining);
    const cyclePct = Math.round((cycle.elapsed / cycleTotalDays) * 100);
    const resonance = 82; // stubbed latest cycle score
    const solscan = soul.mintTxHash
      ? `https://solscan.io/tx/${soul.mintTxHash}`
      : soul.mintAddress
        ? `https://solscan.io/token/${soul.mintAddress}`
        : `https://solscan.io/account/${id}`;
    return {
      talent: soul.talentLabel || soul.label || (isKo ? '이름 없는 Soul' : 'Unnamed Soul'),
      stage,
      meta,
      mintDate: soul.mintDate || 'Apr 17, 2026',
      daysActive: soul.daysActive ?? 42,
      cycle,
      cyclePct,
      resonance,
      solscan,
    };
  }, [soul, id, isKo]);

  // ---------- early states ----------
  if (!mounted) return null;

  if (notFound || !derived) {
    return (
      <div
        data-landing-page
        className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 text-center text-foreground"
      >
        <Gem className="mb-4 h-10 w-10 text-[var(--ember)]" />
        <h1 className="mb-2 text-lg font-semibold">
          {isKo ? 'Soul을 찾을 수 없어요' : 'Soul not found'}
        </h1>
        <p className="mb-6 max-w-xs text-sm text-muted-foreground">
          {isKo
            ? '이 주소에는 Soul이 없거나 접근할 수 없습니다.'
            : 'There is no Soul at this address, or you cannot access it.'}
        </p>
        <Link
          href="/ember"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-foreground/5"
        >
          <ArrowLeft className="h-4 w-4" />
          {isKo ? '내 Soul 목록' : 'Back to Souls'}
        </Link>
      </div>
    );
  }

  // ---------- share handlers ----------
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/ember/${id}`
      : `https://dito.guru/ember/${id}`;
  const shareText = isKo
    ? `${derived.talent}과(와) 함께하는 여정을 공유합니다.`
    : `Sharing my journey with ${derived.talent}.`;

  const handleNativeShare = async () => {
    setShareOpen(false);
    try {
      await (navigator as Navigator).share?.({
        title: derived.talent,
        text: shareText,
        url: shareUrl,
      });
    } catch {
      /* cancelled */
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShareOpen(false);
      }, 1200);
    } catch {
      /* ignore */
    }
  };

  // ---------- ring gauge geometry (cycle progress) ----------
  const ringSize = 72;
  const ringStroke = 6;
  const ringR = (ringSize - ringStroke) / 2;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC - (derived.cyclePct / 100) * ringC;

  // ---------- line chart (resonance trend) ----------
  // Sample points for the sparkline. Last point = resonance.
  const chartPoints = [32, 45, 41, 58, 67, 61, 74, derived.resonance];
  const chartW = 280;
  const chartH = 120;
  const padX = 8;
  const padY = 14;
  const maxV = 100;
  const stepX = (chartW - padX * 2) / (chartPoints.length - 1);
  const pathD = chartPoints
    .map((v, i) => {
      const x = padX + i * stepX;
      const y = chartH - padY - (v / maxV) * (chartH - padY * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const lastX = padX + (chartPoints.length - 1) * stepX;
  const lastY =
    chartH - padY - (chartPoints[chartPoints.length - 1] / maxV) * (chartH - padY * 2);

  // ---------- timeline ----------
  const events = FALLBACK_EVENTS;
  const shownEvents = showOlder ? events : events.slice(0, 2);

  return (
    <div
      data-landing-page
      className="relative flex min-h-[100dvh] flex-col bg-background text-foreground"
    >
      {/* ------------------------------------------------------- Top bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-[56px] w-full max-w-[640px] items-center gap-3 px-4">
          <Link
            href="/ember"
            aria-label={isKo ? 'Soul 목록으로' : 'Back to Souls'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition hover:bg-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ember)]/15 ring-1 ring-[var(--ember)]/30">
              <Flame className="h-3.5 w-3.5 text-[var(--ember)]" />
            </div>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-[14px] font-semibold">
                {isKo ? 'Ember 탤런트' : 'Ember Talent'}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {shortAddr(id)}
              </span>
            </div>
          </div>
          <div className="relative" ref={shareRef}>
            <button
              onClick={() => setShareOpen((s) => !s)}
              aria-label={isKo ? '공유' : 'Share'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition hover:bg-foreground/10"
            >
              <Share2 className="h-5 w-5" />
            </button>
            {shareOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                {typeof navigator !== 'undefined' && !!navigator.share && (
                  <button
                    onClick={handleNativeShare}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-foreground/5"
                  >
                    <Share2 className="h-4 w-4" />
                    {isKo ? '공유하기…' : 'Share…'}
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-foreground/5"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-[var(--ember)]" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied
                    ? isKo
                      ? '복사됨'
                      : 'Copied'
                    : isKo
                      ? '링크 복사'
                      : 'Copy link'}
                </button>
                <a
                  href={derived.solscan}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShareOpen(false)}
                  className="flex w-full items-center gap-2 border-t border-border/60 px-4 py-3 text-left text-sm hover:bg-foreground/5"
                >
                  <ExternalLink className="h-4 w-4" />
                  {isKo ? 'Solscan에서 보기' : 'View on Solscan'}
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------- Body */}
      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 pb-28 pt-6">
        {/* ============ Hero ============ */}
        <section className="relative flex flex-col items-center pt-4 pb-8 text-center">
          {/* soft amber glow */}
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-48 w-48 rounded-full bg-[var(--ember)]/20 blur-[72px]" />

          {/* Gem — gentle rotate */}
          <div className="relative">
            <div
              className="flex h-[140px] w-[140px] items-center justify-center rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0a] ring-1 ring-[var(--ember)]/40 shadow-[0_12px_40px_rgba(250,175,46,0.25)]"
              style={{
                animation: 'souldetail-spin 18s linear infinite',
              }}
            >
              <Gem className="h-14 w-14 text-[var(--ember)] drop-shadow-[0_0_24px_rgba(250,175,46,0.6)]" />
            </div>

            {/* Ring gauge, bottom-right anchored */}
            <div className="absolute -bottom-2 -right-2 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-background/90 ring-1 ring-border">
              <svg width={ringSize} height={ringSize} className="-rotate-90">
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringR}
                  stroke="currentColor"
                  strokeOpacity="0.12"
                  strokeWidth={ringStroke}
                  fill="transparent"
                  className="text-foreground"
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringR}
                  stroke="var(--ember)"
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={ringC}
                  strokeDashoffset={ringOffset}
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[13px] font-semibold text-[var(--ember)]">
                  {derived.cyclePct}%
                </span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="mt-6 text-[28px] font-bold tracking-tight">
            {derived.talent}
          </h1>

          {/* Stage badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--ember)]/15 px-3 py-1 text-[12px] font-semibold text-[var(--fg-on-ember)] ring-1 ring-[var(--ember)]/40 dark:text-[var(--ember)]">
            <Sparkles className="h-3 w-3" />
            {isKo ? derived.meta.labelKo : derived.meta.labelEn}
          </div>

          {/* Meta row */}
          <p className="mt-4 text-[13px] text-muted-foreground">
            {isKo
              ? `${derived.mintDate} 발행 · 활동 ${derived.daysActive}일 · 사이클 ${derived.cycle.current} / ${derived.cycle.total}`
              : `Minted ${derived.mintDate} · ${derived.daysActive} days active · Cycle ${derived.cycle.current} of ${derived.cycle.total}`}
          </p>

          {/* Actions */}
          <div className="mt-6 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/chat?talent=${encodeURIComponent(id)}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ember)] px-6 text-[15px] font-semibold text-[var(--fg-on-ember)] shadow-[0_8px_24px_rgba(250,175,46,0.35)] transition hover:brightness-105 active:scale-[0.99] sm:min-w-[260px]"
            >
              <Flame className="h-4 w-4" />
              {isKo ? 'Ember와 계속하기' : 'Continue with Ember'}
            </Link>
            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 text-[15px] font-medium text-foreground transition hover:bg-foreground/5"
            >
              <Share2 className="h-4 w-4" />
              {isKo ? '공유' : 'Share'}
            </button>
          </div>
        </section>

        {/* ============ Stats strip ============ */}
        <section className="mt-2 grid grid-cols-3 overflow-hidden rounded-2xl border border-border bg-card">
          <StatCell
            icon={<Calendar className="h-4 w-4 text-[var(--ember)]" />}
            label={isKo ? '발행' : 'Minted'}
            value={derived.mintDate}
          />
          <StatCell
            icon={<Clock className="h-4 w-4 text-[var(--ember)]" />}
            label={isKo ? '활동 기간' : 'Active Duration'}
            value={isKo ? `${derived.daysActive}일` : `${derived.daysActive} days`}
            border
          />
          <StatCell
            icon={<TrendingUp className="h-4 w-4 text-[var(--ember)]" />}
            label={isKo ? '현재 사이클' : 'Current Cycle'}
            value={`${derived.cycle.current} / ${derived.cycle.total}`}
          />
        </section>

        {/* ============ Progress Analytics ============ */}
        <section className="mt-8">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[18px] font-semibold tracking-tight">
              {isKo ? '성장 분석' : 'Progress Analytics'}
            </h2>
            <span className="text-[12px] text-muted-foreground">
              {isKo
                ? `사이클 ${derived.cycle.current}`
                : `Cycle ${derived.cycle.current}`}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            {/* Resonance Trend (line chart) */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:col-span-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-medium text-muted-foreground">
                  {isKo ? '공명 추이' : 'Resonance Trend'}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {isKo ? '100점 만점' : 'out of 100'}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] font-bold leading-none text-foreground">
                  {derived.resonance}
                </span>
                <span className="text-[12px] text-muted-foreground">/ 100</span>
              </div>
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="mt-3 h-[120px] w-full"
                role="img"
                aria-label={isKo ? '공명 추이 차트' : 'Resonance trend chart'}
              >
                <defs>
                  <linearGradient id="ember-line" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--ember)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--ember)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* fill under line */}
                <path
                  d={`${pathD} L${lastX.toFixed(1)},${chartH - padY} L${padX},${chartH - padY} Z`}
                  fill="url(#ember-line)"
                />
                {/* line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="var(--ember)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* dots */}
                {chartPoints.map((v, i) => {
                  const x = padX + i * stepX;
                  const y = chartH - padY - (v / maxV) * (chartH - padY * 2);
                  const isLast = i === chartPoints.length - 1;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={isLast ? 4 : 2.5}
                      fill={isLast ? 'var(--ember)' : 'var(--ember)'}
                      stroke={isLast ? 'var(--background, #fff)' : 'none'}
                      strokeWidth={isLast ? 2 : 0}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Ring gauge card (Cycle Completion) */}
            <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-4 sm:col-span-2">
              <span className="self-start text-[12px] font-medium text-muted-foreground">
                {isKo ? '사이클 완료율' : 'Cycle Completion'}
              </span>
              <div className="relative mt-2">
                <svg width={108} height={108} className="-rotate-90">
                  <circle
                    cx={54}
                    cy={54}
                    r={48}
                    stroke="currentColor"
                    strokeOpacity="0.12"
                    strokeWidth={8}
                    fill="transparent"
                    className="text-foreground"
                  />
                  <circle
                    cx={54}
                    cy={54}
                    r={48}
                    stroke="var(--ember)"
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={
                      2 * Math.PI * 48 - (derived.cyclePct / 100) * 2 * Math.PI * 48
                    }
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[22px] font-bold text-foreground">
                    {derived.cyclePct}%
                  </span>
                </div>
              </div>
              <div className="mt-3 text-center text-[12px] leading-tight text-muted-foreground">
                <div>
                  {isKo
                    ? `${derived.cycle.elapsed}일 경과`
                    : `${derived.cycle.elapsed} days elapsed`}
                </div>
                <div>
                  {isKo
                    ? `사이클 종료까지 ${derived.cycle.remaining}일`
                    : `${derived.cycle.remaining} days remaining in cycle`}
                </div>
              </div>
            </div>
          </div>

          {/* per-cycle achievement (simple bars) */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            {FALLBACK_CYCLES.map((c) => (
              <div
                key={c.label}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-[12px] text-muted-foreground">
                    {isKo ? c.label.replace('Cycle', '사이클') : c.label}
                  </span>
                  <span className="text-[14px] font-semibold text-foreground">
                    {c.value}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full bg-[var(--ember)]"
                    style={{ width: `${c.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ Soul Journey (Timeline) ============ */}
        <section className="mt-8">
          <h2 className="mb-3 text-[18px] font-semibold tracking-tight">
            {isKo ? 'Soul 여정' : 'Soul Journey'}
          </h2>
          <div className="relative rounded-2xl border border-border bg-card p-4">
            {/* Amber thread */}
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-8 left-[26px] top-6 w-px bg-gradient-to-b from-[var(--ember)]/80 via-[var(--ember)]/40 to-transparent"
            />
            <ul className="flex flex-col gap-4">
              {shownEvents.map((e, idx) => (
                <li key={e.id} className="relative flex items-start gap-3">
                  <div
                    className={`relative z-10 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full text-[12px] ring-1 ${
                      idx === 0 || e.amber
                        ? 'bg-[var(--ember)] text-[var(--fg-on-ember)] ring-[var(--ember)]/60 shadow-[0_0_0_4px_rgba(250,175,46,0.15)]'
                        : 'bg-foreground/10 text-foreground ring-border'
                    }`}
                  >
                    <span aria-hidden>{e.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[14px] font-semibold text-foreground">
                        {isKo ? e.titleKo : e.titleEn}
                      </span>
                      <span className="flex-none text-[11px] uppercase tracking-wider text-muted-foreground">
                        {isKo ? e.whenKo : e.whenEn}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
                      {isKo ? e.bodyKo : e.bodyEn}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {events.length > 2 && (
              <button
                onClick={() => setShowOlder((v) => !v)}
                className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg py-2 text-[13px] text-muted-foreground transition hover:bg-foreground/5"
              >
                {showOlder ? (
                  <>
                    {isKo ? '접기' : 'Hide older events'}
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    {isKo ? '이전 이벤트 보기' : 'View older events'}
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </section>

        {/* ============ Stats strip: days at each stage ============ */}
        <section className="mt-8">
          <h2 className="mb-3 text-[18px] font-semibold tracking-tight">
            {isKo ? '단계별 체류' : 'Days at Each Stage'}
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {(['sparked', 'burning', 'blazing', 'radiant', 'eternal'] as Stage[]).map(
              (s) => {
                const current = STAGE_META[derived.stage].order;
                const order = STAGE_META[s].order;
                const reached = order <= current;
                // Stubbed distribution
                const days =
                  s === 'sparked' ? 14 : s === 'burning' ? 28 : s === 'blazing' ? 0 : 0;
                return (
                  <div
                    key={s}
                    className={`flex flex-col items-center rounded-xl border p-2 text-center ${
                      reached
                        ? 'border-[var(--ember)]/40 bg-[var(--ember)]/10'
                        : 'border-border bg-card opacity-60'
                    }`}
                  >
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {STAGE_META[s].chip}
                    </span>
                    <span
                      className={`mt-1 text-[14px] font-bold ${
                        reached ? 'text-[var(--fg-on-ember)] dark:text-[var(--ember)]' : 'text-foreground'
                      }`}
                    >
                      {days > 0 ? (isKo ? `${days}일` : `${days}d`) : '—'}
                    </span>
                  </div>
                );
              },
            )}
          </div>
        </section>

        {/* ============ On-chain link ============ */}
        <section className="mt-8">
          <a
            href={derived.solscan}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-sm transition hover:bg-foreground/5"
          >
            <div className="flex items-center gap-2">
              <Gem className="h-4 w-4 text-[var(--ember)]" />
              <span className="font-medium">
                {isKo ? 'Solscan에서 확인' : 'View on Solscan'}
              </span>
              <span className="text-muted-foreground">· {shortAddr(id)}</span>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
          <p className="mx-auto mt-3 max-w-sm text-center text-[11px] leading-relaxed text-muted-foreground">
            {t('share.disclaimer' as never) ||
              (isKo
                ? '이 Soul은 Solana 지갑에 결속된 Soulbound Token 입니다.'
                : 'This Soul is a Soulbound Token bound to your Solana wallet.')}
          </p>
        </section>
      </main>

      {/* keyframes for gentle gem rotation */}
      <style jsx>{`
        @keyframes souldetail-spin {
          0% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(6deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small components
// ---------------------------------------------------------------------------

function StatCell({
  icon,
  label,
  value,
  border,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  border?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-3 py-4 text-center ${
        border ? 'border-x border-border' : ''
      }`}
    >
      <div className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-[13px] font-semibold text-foreground">{value}</div>
    </div>
  );
}

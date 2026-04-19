'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gem, Sparkles, ExternalLink, Flame } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { useDiscoveryGate } from '@/hooks/useDiscoveryGate';
import { Button } from '@/components/ui/button';
import { store } from '@/lib/store';
import { SoulCard, EmberStage } from '@/lib/types';

type FilterKey = 'all' | 'awakened' | 'evolving' | 'luminous';

// Map ember stages onto the three Figma filter buckets
const STAGE_BUCKET: Record<EmberStage, Exclude<FilterKey, 'all'>> = {
  sparked: 'awakened',
  burning: 'evolving',
  blazing: 'evolving',
  radiant: 'luminous',
  eternal: 'luminous',
};

// Visual stage tier (1-based) used for the stage pill + gauge richness
const STAGE_TIER: Record<EmberStage, number> = {
  sparked: 1,
  burning: 2,
  blazing: 3,
  radiant: 4,
  eternal: 5,
};

const STAGE_LABEL_EN: Record<EmberStage, string> = {
  sparked: 'Sparked',
  burning: 'Burning',
  blazing: 'Blazing',
  radiant: 'Radiant',
  eternal: 'Eternal',
};

const STAGE_LABEL_KO: Record<EmberStage, string> = {
  sparked: '점화',
  burning: '타오름',
  blazing: '작열',
  radiant: '광휘',
  eternal: '영원',
};

// Simple deterministic hash → 0-100 for mocked ring gauge when store doesn't provide one
function progressFromSoul(soul: SoulCard): number {
  const s = `${soul.soul_id || ''}${soul.talentLabel || soul.label}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const tier = STAGE_TIER[soul.stage];
  // Higher stage → higher baseline progress
  const base = 10 + (tier - 1) * 18;
  return Math.min(99, base + (h % 20));
}

export default function SoulPage() {
  const { isChecking } = useDiscoveryGate();
  const router = useRouter();
  const { lang } = useI18n();
  const isKo = lang === 'ko';

  const [souls, setSouls] = useState<SoulCard[]>([]);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    setMounted(true);
    store.getSoulsAsync().then(setSouls);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return souls;
    return souls.filter((s) => STAGE_BUCKET[s.stage] === filter);
  }, [souls, filter]);

  const counts = useMemo(() => {
    const active = souls.filter((s) => STAGE_TIER[s.stage] >= 2).length;
    const blazing = souls.filter((s) => STAGE_TIER[s.stage] >= 3).length;
    return { total: souls.length, active, blazing };
  }, [souls]);

  if (isChecking) {
    return (
      <div
        data-landing-page
        className="relative flex min-h-dvh w-full items-center justify-center bg-background text-foreground"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#faaf2e] border-t-transparent" />
          <p className="text-sm text-muted-foreground">{isKo ? '불러오는 중...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!mounted) return null;

  // ── Empty state ────────────────────────────────────────────────
  if (souls.length === 0) {
    return (
      <div
        data-landing-page
        className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-background px-6 text-center text-foreground"
      >
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#faaf2e]/10 blur-[90px]" />
        <div className="relative z-10 flex flex-col items-center">
          <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/3 shadow-[0_0_40px_rgba(250,175,46,0.15)]">
            <Gem className="h-9 w-9 text-muted-foreground/60" strokeWidth={1.5} />
          </span>
          <h2 className="mb-2 text-[20px] font-bold tracking-tight">
            {isKo ? '아직 Soul이 없어요.' : 'No Souls yet.'}
          </h2>
          <p className="mb-7 max-w-[260px] text-[14px] leading-relaxed text-muted-foreground">
            {isKo ? '첫 재능에 몰입해 불씨를 지펴보세요.' : 'Commit to your first talent.'}
          </p>
          <Button
            onClick={() => router.push('/discovery')}
            className="h-12 w-full max-w-[280px] rounded-[10px] bg-[#faaf2e] text-[15px] font-semibold text-[#4b3002] shadow-[0_10px_24px_rgba(250,175,46,0.3)] hover:bg-[#e8a129]"
          >
            <Flame className="mr-1.5 h-4 w-4" />
            {isKo ? '재능 찾으러 가기' : 'Find your spark'}
          </Button>
        </div>
      </div>
    );
  }

  // ── Main gallery ───────────────────────────────────────────────
  const cycleLabel = isKo ? '사이클 3' : 'Cycle 3';
  const collectedLabel = isKo
    ? `${counts.total}개 Soul 수집`
    : `${counts.total} Soul${counts.total === 1 ? '' : 's'} Collected`;

  const sublineParts = [
    `${counts.total} ${isKo ? 'Soul' : counts.total === 1 ? 'Soul' : 'Souls'}`,
    `${counts.active} ${isKo ? '활성' : 'active'}`,
    `${counts.blazing} ${isKo ? '작열' : 'Blazing'}`,
  ];

  const filterTabs: { key: FilterKey; label: string }[] = [
    { key: 'all', label: isKo ? '전체' : 'All' },
    { key: 'awakened', label: isKo ? '각성' : 'Awakened' },
    { key: 'evolving', label: isKo ? '진화' : 'Evolving' },
    { key: 'luminous', label: isKo ? '광휘' : 'Luminous' },
  ];

  return (
    <div
      data-landing-page
      className="relative min-h-dvh w-full bg-background text-foreground"
    >
      {/* ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-[-60px] h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-[#faaf2e]/10 blur-[100px]" />

      <div className="relative z-10 mx-auto w-full max-w-[1120px] px-5 pb-24 pt-8 md:px-8 md:pt-10">
        {/* Header ─────────────────────────────────── */}
        <header className="mb-6 md:mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#faaf2e]" />
            <h1 className="text-[22px] font-bold tracking-tight md:text-[28px]">
              {isKo ? '내 Soul.' : 'Your Souls.'}
            </h1>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[#faaf2e]/25 bg-[#faaf2e]/8 px-3 py-1.5">
              <Gem className="h-3.5 w-3.5 text-[#faaf2e]" />
              <span className="text-[12px] font-medium text-[#faaf2e]">{collectedLabel}</span>
            </div>
            <span className="rounded-full border border-white/10 bg-white/3 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
              {cycleLabel}
            </span>
          </div>

          <p className="mt-3 text-[12.5px] text-muted-foreground">
            {sublineParts.join(' · ')}
          </p>
        </header>

        {/* Filter chips ────────────────────────────── */}
        <div className="mb-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filterTabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-semibold transition ${
                  active
                    ? 'bg-[#faaf2e] text-[#4b3002] shadow-[0_6px_18px_rgba(250,175,46,0.35)]'
                    : 'border border-white/10 bg-white/3 text-muted-foreground hover:border-white/20 hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Grid ──────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 px-6 py-14 text-center">
            <Gem className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
            <p className="text-[13px] text-muted-foreground">
              {isKo ? '이 필터에 해당하는 Soul이 없어요.' : 'No souls match this filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {filtered.map((soul, idx) => (
              <SoulGalleryCard
                key={soul.soul_id || idx}
                soul={soul}
                isKo={isKo}
                progress={progressFromSoul(soul)}
              />
            ))}
          </div>
        )}

        {/* New discovery CTA */}
        <div className="mx-auto mt-8 max-w-md">
          <Button
            variant="outline"
            onClick={() => {
              const profile = store.getProfile();
              const updated = { ...profile, current_talent: undefined, minted: false };
              store.setProfile(updated);
              store.saveProfileAsync(updated).catch(() => {});
              router.push('/discovery');
            }}
            className="h-12 w-full rounded-[10px] border-[#faaf2e]/30 bg-transparent text-[14px] font-semibold text-[#faaf2e] hover:bg-[#faaf2e]/10"
          >
            <Flame className="mr-1.5 h-4 w-4" />
            {isKo ? '새로운 불씨 찾기' : 'Find a new spark'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Card
// ──────────────────────────────────────────────────────────────
function SoulGalleryCard({
  soul,
  isKo,
  progress,
}: {
  soul: SoulCard;
  isKo: boolean;
  progress: number;
}) {
  const tier = STAGE_TIER[soul.stage];
  const stageLabel = isKo ? STAGE_LABEL_KO[soul.stage] : STAGE_LABEL_EN[soul.stage];
  const mintedLabel = isKo ? `민팅 · ${soul.mintDate}` : `Minted ${soul.mintDate}`;
  const href = soul.soul_id ? `/soul/${soul.soul_id}` : '/soul';
  const solscanHref = soul.soul_id
    ? `https://solscan.io/token/${soul.soul_id}`
    : 'https://solscan.io';

  // Ring gauge
  const R = 16;
  const CIRC = 2 * Math.PI * R;
  const dash = (progress / 100) * CIRC;

  // Higher-stage richness
  const glowIntensity = 0.12 + tier * 0.06; // 0.18..0.42
  const showSparkles = tier >= 3;

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-[#12131a] p-4 transition-all hover:-translate-y-0.5 hover:border-[#faaf2e]/40 hover:shadow-[0_14px_34px_rgba(250,175,46,0.18)]"
    >
      {/* ambient tint, stronger for higher stages */}
      <div
        className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full blur-[50px]"
        style={{ background: `rgba(250,175,46,${glowIntensity})` }}
      />
      {showSparkles && (
        <>
          <div className="pointer-events-none absolute right-4 top-4 h-1 w-1 rounded-full bg-[#faaf2e] opacity-70 animate-[pulse_2.4s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute right-10 top-8 h-1.5 w-1.5 rounded-full bg-[#faaf2e]/60 opacity-60 animate-[pulse_3s_ease-in-out_infinite_200ms]" />
        </>
      )}

      <div className="relative flex items-start gap-3">
        {/* Gem visual */}
        <div
          className="relative flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#faaf2e]/30 bg-linear-to-br from-[#1a1a2a] to-[#0a0a12]"
          style={{
            boxShadow: `inset 0 0 22px rgba(250,175,46,${Math.min(0.45, glowIntensity + 0.1)})`,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 55%, rgba(250,175,46,${
                0.18 + tier * 0.05
              }) 0%, transparent 65%)`,
            }}
          />
          <Gem
            className="relative h-8 w-8 text-[#faaf2e] drop-shadow-[0_0_10px_rgba(250,175,46,0.55)]"
            strokeWidth={1.5}
          />
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-[#faaf2e]/30 bg-[#faaf2e]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#faaf2e]">
              {isKo ? `${tier}단계` : `Stage ${tier}`}
            </span>
            <span className="truncate text-[10.5px] text-muted-foreground">{stageLabel}</span>
          </div>

          <h3 className="truncate text-[16px] font-bold text-foreground">
            {soul.talentLabel || soul.label}
          </h3>

          <div className="mt-2 h-px w-full bg-white/5" />

          <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
            <span className="truncate text-muted-foreground">{mintedLabel}</span>
            <a
              href={solscanHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex shrink-0 items-center gap-0.5 font-medium text-[#faaf2e] transition hover:text-[#e8a129]"
            >
              Solscan
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Ring gauge */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
          <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90">
            <circle cx="20" cy="20" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <circle
              cx="20"
              cy="20"
              r={R}
              fill="none"
              stroke="#faaf2e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRC}`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9.5px] font-bold text-[#faaf2e]">
            {progress}%
          </span>
        </div>
      </div>
    </Link>
  );
}

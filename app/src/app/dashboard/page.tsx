'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Flame,
  Plus,
  Sparkles,
  Flag,
  Calendar,
  ChevronRight,
  Trophy,
  Link as LinkIcon,
  Activity,
} from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { agentStore } from '@/lib/store-agent';
import type { UserProfile, Talent } from '@/lib/store-agent';
import { cn } from '@/lib/utils';
import { FlameShape } from '@/components/ember/flame-shape';

interface PulseEntry {
  id: string;
  message: string;
  timeAgo: string;
}

const STAGE_LABEL: Record<string, string> = {
  sparked: 'Spark',
  burning: 'Flame',
  blazing: 'Blaze',
  radiant: 'Inferno',
  eternal: 'Eternal',
};

const TALENT_STAGE_COPY: Record<string, { en: string; ko: string }> = {
  discovered: { en: 'Stage 1 • Observer', ko: '1단계 • 관찰자' },
  in_progress: { en: 'Stage 2 • Observer', ko: '2단계 • 관찰자' },
  completed: { en: 'Stage 4 • Spark', ko: '4단계 • 스파크' },
};

export default function DashboardPage() {
  const { lang } = useI18n();
  const isKo = lang === 'ko';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [emberBalance, setEmberBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [apiHealthy, setApiHealthy] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        setLoading(true);
        const healthy = await agentStore.checkAPIHealth();
        if (cancelled) return;
        setApiHealthy(healthy);

        if (healthy) {
          const userProfile = await agentStore.loadProfileAsync();
          if (cancelled) return;
          setProfile(userProfile);

          const userTalents = await agentStore.getTalentsAsync();
          if (cancelled) return;
          setTalents(userTalents);

          const balance = await agentStore.getEmberBalanceAsync();
          if (cancelled) return;
          setEmberBalance(balance);
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const dailyProgress = useMemo(() => {
    if (!talents.length) return 60;
    const avg =
      talents.reduce((sum, t) => sum + (t.progress || 0), 0) / talents.length;
    return Math.max(10, Math.min(100, Math.round(avg)));
  }, [talents]);

  const activeTalentCount = talents.length || 3;
  const dayStreak = profile?.challenges_completed || 14;
  const totalEmber = emberBalance || profile?.ember_balance || 8400;

  const pulseFeed: PulseEntry[] = useMemo(
    () => [
      {
        id: 'p1',
        message: isKo
          ? '서울에서 누군가 Tier 3 Soul을 깨웠습니다.'
          : 'Someone awakened a Tier 3 Soul in Seoul.',
        timeAgo: isKo ? '2분 전' : '2m ago',
      },
      {
        id: 'p2',
        message: isKo
          ? '새 Seeker가 네트워크에 합류했습니다.'
          : 'A new Seeker just joined the network.',
        timeAgo: isKo ? '15분 전' : '15m ago',
      },
      {
        id: 'p3',
        message: isKo
          ? '10,000 Ember 일일 마일스톤이 달성되었습니다.'
          : '10,000 Ember daily milestone reached globally.',
        timeAgo: isKo ? '1시간 전' : '1h ago',
      },
    ],
    [isKo]
  );

  const triumphs = useMemo(
    () => [
      {
        id: 'first-mint',
        icon: Trophy,
        label: isKo ? '첫 민트' : 'First Mint',
      },
      {
        id: 'streak',
        icon: Flame,
        label: isKo ? '7일 연속' : '7 Day Streak',
      },
      {
        id: 'soul-link',
        icon: LinkIcon,
        label: isKo ? 'Soul Link' : 'Soul Link',
      },
    ],
    [isKo]
  );

  if (loading) {
    return (
      <div
        data-landing-page
        className="min-h-dvh flex items-center justify-center px-4 py-6 bg-background text-foreground"
        style={{ fontFamily: 'Pretendard, Manrope, system-ui, sans-serif' }}
      >
        <div className="text-center">
          <Flame className="mx-auto h-10 w-10 text-[var(--ember)] animate-pulse" />
          <p className="mt-4 text-base font-semibold">
            {isKo ? 'DITO 대시보드 로딩 중...' : 'Loading DITO Dashboard...'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isKo ? 'Agent API 연결 중...' : 'Connecting to Agent API...'}
          </p>
        </div>
      </div>
    );
  }

  if (!apiHealthy) {
    return (
      <div
        data-landing-page
        className="min-h-dvh flex items-center justify-center px-4 py-6 bg-background text-foreground"
        style={{ fontFamily: 'Pretendard, Manrope, system-ui, sans-serif' }}
      >
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ember)]/15 text-[var(--ember)]">
            <Activity className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold mb-2">
            {isKo ? 'API 연결 실패' : 'API Connection Failed'}
          </h1>
          <p className="text-sm text-muted-foreground mb-5">
            {isKo
              ? 'DITO Agent API에 연결할 수 없습니다.'
              : 'Unable to connect to DITO Agent API.'}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[var(--ember)] text-[var(--fg-on-ember)] hover:bg-[var(--ember)]/90"
          >
            {isKo ? '다시 시도' : 'Retry Connection'}
          </Button>
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || profile?.username || 'Alex';

  return (
    <div
      data-landing-page
      className="min-h-dvh bg-background text-foreground pb-24"
      style={{ fontFamily: 'Pretendard, Manrope, system-ui, sans-serif' }}
    >
      <div className="mx-auto w-full max-w-md md:max-w-3xl lg:max-w-5xl px-4 pt-6 md:pt-10">
        {/* Top bar: greeting + ember pill */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ember)]/20 text-lg">
              <span role="img" aria-label="wave">
                👋
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground leading-tight">
                {isKo ? '다시 만나서 반가워요,' : 'Welcome back,'}
              </p>
              <p className="text-base font-semibold truncate">
                {displayName}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-[var(--ember)]/30 bg-[var(--ember)]/10 px-3 py-1.5">
              <Flame className="h-3.5 w-3.5 text-[var(--ember)]" />
              <span className="text-sm font-semibold tracking-tight">
                {totalEmber.toLocaleString()}{' '}
                <span className="text-[var(--ember)]">Ɛ</span>
              </span>
            </div>
            <button
              type="button"
              aria-label="Add"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:bg-foreground/5"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Quick stats */}
        <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={<Sparkles className="h-4 w-4 text-[var(--ember)]" />}
            value={String(activeTalentCount)}
            label={isKo ? '활성 Soul' : 'Active Souls'}
          />
          <StatCard
            icon={<Flame className="h-4 w-4 text-[var(--ember)]" />}
            value={String(dayStreak)}
            label={isKo ? '연속 일수' : 'Day Streak'}
          />
          <StatCard
            icon={<Flag className="h-4 w-4 text-[var(--ember)]" />}
            value={formatCompact(totalEmber)}
            label={isKo ? '총 Ember' : 'Total Ember'}
          />
          <StatCard
            icon={<Calendar className="h-4 w-4 text-[var(--ember)]" />}
            value={`${dailyProgress}%`}
            label={isKo ? '오늘의 주기' : "Today's Cycle"}
          />
        </section>

        {/* Today ritual entry card */}
        <section className="mt-5">
          <Link
            href="/today"
            className="group relative block overflow-hidden rounded-2xl p-5 transition"
            style={{
              background:
                'linear-gradient(135deg, var(--bg-2) 0%, var(--bg-1) 100%)',
              border: '1px solid var(--ember-soft)',
              boxShadow: '0 0 40px -10px var(--ember-glow)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span
                  className="font-mono text-[10px] uppercase"
                  style={{ letterSpacing: '0.24em', color: 'var(--ember)' }}
                >
                  — {isKo ? '오늘의 불꽃' : "today's ember"}
                </span>
                <h2
                  className="mt-2 font-display text-[22px]"
                  style={{
                    letterSpacing: '-0.025em',
                    color: 'var(--fg)',
                    lineHeight: 1.2,
                  }}
                >
                  {isKo
                    ? `${displayName}아, 오늘은 어땠어.`
                    : `${displayName}, how was today.`}
                </h2>
                <p
                  className="mt-1.5 font-display text-[13.5px]"
                  style={{ color: 'var(--fg-dim)' }}
                >
                  {isKo ? '한 줄이면 돼. 수정도, 삭제도 없이.' : 'One line. No edits. No deletes.'}
                </p>
              </div>
              <div className="shrink-0">
                <FlameShape stage="burning" size={72} breathe />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <span
                className="font-mono text-[10px] uppercase"
                style={{ letterSpacing: '0.22em', color: 'var(--fg-dimmer)' }}
              >
                {isKo ? '탭해서 시작' : 'tap to begin'}
              </span>
              <ChevronRight
                className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                style={{ color: 'var(--ember)' }}
              />
            </div>
          </Link>
        </section>

        {/* Active talents */}
        <section className="mt-7">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {isKo ? '활성 재능' : 'Active Talents'}
            </h3>
            <Link
              href="/ember"
              className="flex items-center gap-1 text-xs font-medium text-[var(--ember)] hover:text-[var(--ember)]/80"
            >
              {isKo ? '갤러리 보기' : 'View Gallery'}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {(talents.length ? talents : FALLBACK_TALENTS).map(
              (talent, idx) => (
                <TalentRow
                  key={talent.id}
                  talent={talent}
                  tint={idx % 2 === 0 ? 'amber' : 'blue'}
                  isKo={isKo}
                />
              )
            )}
          </div>
        </section>

        {/* Recent triumphs */}
        <section className="mt-7">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
            {isKo ? '최근 성취' : 'Recent Triumphs'}
          </h3>
          <div className="-mx-4 px-4 overflow-x-auto">
            <div className="flex gap-3 pb-2 min-w-max">
              {triumphs.map(({ id, icon: Icon, label }) => (
                <div
                  key={id}
                  className="flex flex-col items-center justify-center gap-2 min-w-[92px] rounded-xl border border-border/50 bg-card/40 px-4 py-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ember)]/15 text-[var(--ember)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-[11px] font-medium text-center">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Community pulse */}
        <section className="mt-7">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-3.5 w-3.5 text-[var(--ember)]" />
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {isKo ? '커뮤니티 맥박' : 'Community Pulse'}
            </h3>
          </div>
          <ul className="divide-y divide-border/50 rounded-xl border border-border/50 bg-card/30 overflow-hidden">
            {pulseFeed.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start gap-3 px-4 py-3 text-xs"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ember)]" />
                <p className="flex-1 text-foreground/80 leading-relaxed">
                  {entry.message}
                </p>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {entry.timeAgo}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/* ───────────── subcomponents ───────────── */

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 px-3 py-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-xl font-bold leading-tight">{value}</p>
    </div>
  );
}

function RingGauge({ percent }: { percent: number }) {
  const size = 128;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (percent / 100) * circ;

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      aria-label={`${percent}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(250,175,46,0.15)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--ember)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          fill="none"
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-[#faf6ed]">{percent}%</span>
      </div>
    </div>
  );
}

function TalentRow({
  talent,
  tint,
  isKo,
}: {
  talent: Talent;
  tint: 'amber' | 'blue';
  isKo: boolean;
}) {
  const tintBg =
    tint === 'amber'
      ? 'bg-[var(--ember)]/15 text-[var(--ember)]'
      : 'bg-sky-500/15 text-sky-400';
  const tintRing = tint === 'amber' ? 'var(--ember)' : '#38bdf8';
  const stageCopy = TALENT_STAGE_COPY[talent.stage] || {
    en: STAGE_LABEL[talent.stage] || talent.stage,
    ko: STAGE_LABEL[talent.stage] || talent.stage,
  };

  return (
    <Link
      href="/ember"
      className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 px-3 py-3 transition hover:border-[var(--ember)]/40 hover:bg-card/60"
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          tintBg
        )}
      >
        <MiniRing percent={talent.progress || 60} color={tintRing} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{talent.label}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {isKo ? stageCopy.ko : stageCopy.en}
        </p>
      </div>
      <span className="shrink-0 text-xs font-medium text-[var(--ember)]">
        {isKo ? '열기' : 'Open'}
      </span>
    </Link>
  );
}

function MiniRing({ percent, color }: { percent: number; color: string }) {
  const size = 28;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (percent / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="currentColor"
        strokeOpacity={0.25}
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        fill="none"
      />
    </svg>
  );
}

function formatCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

const FALLBACK_TALENTS: Talent[] = [
  {
    id: 'lumin',
    label: 'Lumin',
    description: 'Observer talent — notice patterns in people.',
    category: 'social',
    stage: 'in_progress',
    progress: 45,
  },
  {
    id: 'ignis',
    label: 'Ignis',
    description: 'Spark talent — ignite action in moments.',
    category: 'creative',
    stage: 'completed',
    progress: 80,
  },
];

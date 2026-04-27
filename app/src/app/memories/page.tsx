'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { store } from '@/lib/store';
import { getWalletCookie } from '@/lib/wallet-cookie';
import { FlameShape, EmberStage } from '@/components/ember/flame-shape';
import { Eyebrow } from '@/components/ember/eyebrow';

type Tab = 'journal' | 'chat' | 'discovery' | 'stage' | 'mint' | 'capsule';

type TimelineItem = {
  id: string;
  tab: Tab;
  date: string;
  title: string;
  snippet?: string;
  state?: EmberStage;
  detailHref?: string;
  meta?: string;
  locked?: boolean;
  unlocksAt?: string;
};

const TAB_META: Record<Tab, { en: string; ko: string }> = {
  journal: { en: 'Journal', ko: '일기' },
  chat: { en: 'Ember chat', ko: 'Ember 대화' },
  discovery: { en: 'Discovery', ko: '재능 탐색' },
  stage: { en: 'Stage shifts', ko: '단계 전환' },
  mint: { en: 'Mint', ko: '민팅' },
  capsule: { en: 'Timecapsule', ko: '타임캡슐' },
};

export default function MemoriesPage() {
  const router = useRouter();
  const { lang } = useI18n();
  const isKo = lang === 'ko';

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>('journal');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Record<Tab, TimelineItem[]>>({
    journal: [],
    chat: [],
    discovery: [],
    stage: [],
    mint: [],
    capsule: [],
  });
  const [daysKept, setDaysKept] = useState(0);
  const [surfacing, setSurfacing] = useState<
    { id: string; content: string; state?: EmberStage; daysAgo: number; date: string }[]
  >([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const profile = store.getProfile();
    const wallet = getWalletCookie();
    const email = profile.email || (wallet ? `${wallet}@wallet.local` : null);

    if (!email) {
      setLoading(false);
      return;
    }

    // Journal tab — committed diary entries
    fetch(`/api/diary?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        const entries = data.entries || [];
        const committed: TimelineItem[] = entries
          .filter((e: { committed_at?: string }) => e.committed_at)
          .map((e: {
            id: string;
            content: string;
            date: string;
            state?: string;
            unlocks_at?: string;
          }) => {
            const locked =
              !!e.unlocks_at && new Date(e.unlocks_at) > new Date();
            return {
              id: e.id,
              tab: 'journal' as const,
              date: e.date,
              title: firstLine(e.content),
              snippet:
                e.content.length > 120 ? e.content.slice(0, 120) + '…' : e.content,
              state: (e.state as EmberStage) || undefined,
              detailHref: `/memories/${e.id}`,
              locked,
              unlocksAt: e.unlocks_at,
            };
          });

        const capsules: TimelineItem[] = entries
          .filter((e: { unlocks_at?: string }) => e.unlocks_at)
          .map((e: {
            id: string;
            content: string;
            date: string;
            state?: string;
            unlocks_at: string;
          }) => ({
            id: e.id,
            tab: 'capsule' as const,
            date: e.unlocks_at,
            title: isKo
              ? new Date(e.unlocks_at) > new Date()
                ? '아직 잠김'
                : '열린 캡슐'
              : new Date(e.unlocks_at) > new Date()
              ? 'Still sealed'
              : 'Unlocked',
            snippet: new Date(e.unlocks_at) > new Date() ? undefined : firstLine(e.content),
            detailHref: `/memories/${e.id}`,
            meta: isKo
              ? `${e.date} → ${e.unlocks_at}`
              : `${e.date} → ${e.unlocks_at}`,
            locked: new Date(e.unlocks_at) > new Date(),
            unlocksAt: e.unlocks_at,
          }));

        setItems((prev) => ({
          ...prev,
          journal: committed,
          capsule: capsules,
        }));
        setDaysKept(committed.length);
      })
      .catch(() => {
        /* silent */
      });

    // Chat + Mint tabs from unified /api/memories
    Promise.all(
      (['chat', 'mint'] as const).map((t) =>
        fetch(
          `/api/memories?tab=${t}&email=${encodeURIComponent(email)}`
        )
          .then((r) => r.json())
          .then((data) => {
            const list = (data.items || []) as Array<{
              id: string;
              date?: string;
              content?: string;
              role?: string;
              talent?: string;
              mint_tx?: string;
            }>;
            if (t === 'chat') {
              const chatItems: TimelineItem[] = list.map((c) => ({
                id: c.id,
                tab: 'chat' as const,
                date: c.date || '',
                title:
                  c.role === 'assistant'
                    ? isKo
                      ? 'Ember'
                      : 'Ember'
                    : isKo
                    ? '나'
                    : 'me',
                snippet:
                  (c.content || '').length > 120
                    ? (c.content || '').slice(0, 120) + '…'
                    : c.content,
                meta: c.role,
              }));
              setItems((prev) => ({ ...prev, chat: chatItems }));
            } else {
              const mintItems: TimelineItem[] = list.map((m) => ({
                id: m.id,
                tab: 'mint' as const,
                date: m.date || '',
                title: m.talent || (isKo ? '민팅됨' : 'Minted'),
                meta: m.mint_tx ? `tx: ${m.mint_tx.slice(0, 8)}…` : undefined,
              }));
              setItems((prev) => ({ ...prev, mint: mintItems }));
            }
          })
          .catch(() => {
            /* silent */
          })
      )
    );

    // Discovery tab — from ember record
    fetch(`/api/ember?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        const ember = data.ember;
        if (!ember?.discovery_conversation) return;
        const conv = Array.isArray(ember.discovery_conversation)
          ? ember.discovery_conversation
          : [];
        const discoveryItems: TimelineItem[] = conv.map(
          (c: { key?: string; content?: string; role?: string }, i: number) => ({
            id: `disc-${i}`,
            tab: 'discovery',
            date: ember.created_at?.slice(0, 10) || '',
            title: c.key || (isKo ? '대답' : 'answer'),
            snippet: c.content,
            meta: c.role,
          })
        );
        const stageItems: TimelineItem[] = ember.ember_stage
          ? [
              {
                id: 'stage-current',
                tab: 'stage' as const,
                date: ember.updated_at?.slice(0, 10) || '',
                title: isKo ? `현재: ${ember.ember_stage}` : `Current: ${ember.ember_stage}`,
                state: ember.ember_stage as EmberStage,
                meta: isKo ? '활성 Ember' : 'Active Ember',
              },
            ]
          : [];
        setItems((prev) => ({ ...prev, discovery: discoveryItems, stage: stageItems }));
      })
      .catch(() => {
        /* silent */
      })
      .finally(() => setLoading(false));

    // Backward timecapsule: "N days ago today" — try 180/365/1095 and take whichever returns
    (async () => {
      for (const days of [180, 365, 1095]) {
        try {
          const r = await fetch(
            `/api/timecapsule?mode=surfacing&days=${days}&email=${encodeURIComponent(email)}`
          );
          const d = await r.json();
          if (d?.entries?.length) {
            const d0 = new Date();
            d0.setDate(d0.getDate() - days);
            setSurfacing(
              d.entries.map((e: {
                id: string;
                content: string;
                state?: string;
                date: string;
              }) => ({
                id: e.id,
                content: e.content,
                state: e.state as EmberStage | undefined,
                daysAgo: days,
                date: e.date,
              }))
            );
            break;
          }
        } catch {
          /* try next */
        }
      }
    })();
  }, [isKo]);

  const activeItems = useMemo(() => items[tab] || [], [items, tab]);

  if (!mounted) return null;

  return (
    <div
      className="relative flex min-h-dvh flex-col"
      style={{ backgroundColor: 'var(--bg-0)', color: 'var(--fg)' }}
    >
      {/* Sticky header with days-kept count */}
      <header
        className="sticky top-0 z-30 border-b px-5 py-4"
        style={{
          borderColor: 'var(--rule)',
          backgroundColor: 'color-mix(in oklab, var(--bg-0) 90%, transparent)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ color: 'var(--fg-dim)' }}
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <Eyebrow spacing="wide">— {isKo ? '추억' : 'memories'}</Eyebrow>
            <p
              className="mt-0.5 font-display text-[15px]"
              style={{ color: 'var(--fg)', letterSpacing: '-0.005em' }}
            >
              {isKo ? `${daysKept}일 지켜옴` : `${daysKept} days kept`}
            </p>
          </div>
        </div>

        {/* Tab strip */}
        <div
          className="mt-4 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {(Object.keys(TAB_META) as Tab[]).map((key) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="shrink-0 rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase transition"
                style={{
                  letterSpacing: '0.2em',
                  backgroundColor: active ? 'var(--ember)' : 'transparent',
                  color: active ? 'var(--fg-on-ember)' : 'var(--fg-dim)',
                  border: `1px solid ${active ? 'var(--ember)' : 'var(--rule-strong)'}`,
                }}
              >
                {isKo ? TAB_META[key].ko : TAB_META[key].en}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 px-5 py-6">
        {surfacing.length > 0 && (
          <section
            className="mb-6 rounded-lg p-4"
            style={{
              backgroundColor: 'var(--teal-soft)',
              border: '1px solid var(--teal)',
            }}
          >
            <Eyebrow spacing="wide" tone="teal">
              — {isKo
                ? `${surfacingLabel(surfacing[0].daysAgo, true)} 전 오늘`
                : `${surfacingLabel(surfacing[0].daysAgo, false)} ago today`}
            </Eyebrow>
            <div className="mt-3 space-y-3">
              {surfacing.slice(0, 2).map((s) => (
                <Link
                  key={s.id}
                  href={`/memories/${s.id}`}
                  className="flex items-start gap-3"
                >
                  {s.state && (
                    <div className="shrink-0 pt-0.5">
                      <FlameShape
                        stage={s.state}
                        size={36}
                        rare={s.state === 'eternal'}
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className="font-display text-[14.5px]"
                      style={{
                        color: 'var(--fg)',
                        letterSpacing: '-0.005em',
                        lineHeight: 1.5,
                      }}
                    >
                      {s.content.length > 120
                        ? s.content.slice(0, 120) + '…'
                        : s.content}
                    </p>
                    <span
                      className="mt-1 inline-block font-mono text-[9.5px] uppercase"
                      style={{ letterSpacing: '0.22em', color: 'var(--teal)' }}
                    >
                      {s.date}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {loading && (
          <div className="py-20 text-center">
            <span
              className="font-mono text-[10px] uppercase"
              style={{ letterSpacing: '0.24em', color: 'var(--fg-dimmer)' }}
            >
              loading…
            </span>
          </div>
        )}

        {!loading && activeItems.length === 0 && (
          <div className="py-20 text-center">
            <FlameShape stage="dormant" size={80} />
            <p
              className="mt-4 font-display text-[15px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              {isKo ? '아직 비어 있어.' : 'Nothing here yet.'}
            </p>
          </div>
        )}

        {!loading && activeItems.length > 0 && (
          <ul className="space-y-2.5">
            {activeItems.map((item) => (
              <MemoryRow key={item.id} item={item} isKo={isKo} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function firstLine(text: string): string {
  const first = text.split('\n')[0].trim();
  if (first.length <= 60) return first;
  return first.slice(0, 60) + '…';
}

function surfacingLabel(days: number, isKo: boolean): string {
  if (days >= 365) {
    const y = Math.floor(days / 365);
    return isKo ? `${y}년` : `${y} year${y === 1 ? '' : 's'}`;
  }
  if (days >= 30) {
    const m = Math.round(days / 30);
    return isKo ? `${m}개월` : `${m} month${m === 1 ? '' : 's'}`;
  }
  return isKo ? `${days}일` : `${days} day${days === 1 ? '' : 's'}`;
}

function MemoryRow({ item, isKo }: { item: TimelineItem; isKo: boolean }) {
  const Inner = (
    <div
      className="flex w-full items-start gap-3 rounded-lg px-4 py-3.5 text-left transition"
      style={{
        backgroundColor: 'var(--bg-1)',
        border: '1px solid var(--rule)',
      }}
    >
      <div className="shrink-0 pt-0.5">
        {item.state ? (
          <FlameShape stage={item.state} size={40} rare={item.state === 'eternal'} />
        ) : (
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              backgroundColor: 'var(--bg-2)',
              color: 'var(--fg-dim)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
            }}
          >
            ·
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-[9.5px] uppercase"
            style={{ letterSpacing: '0.22em', color: 'var(--fg-dimmer)' }}
          >
            {item.date}
          </span>
          {item.meta && (
            <span
              className="font-mono text-[9.5px] uppercase"
              style={{ letterSpacing: '0.18em', color: 'var(--fg-dimmer)' }}
            >
              · {item.meta}
            </span>
          )}
          {item.locked && (
            <span
              className="font-mono text-[9.5px] uppercase"
              style={{ letterSpacing: '0.18em', color: 'var(--teal)' }}
            >
              · {isKo ? '잠김' : 'locked'}
            </span>
          )}
        </div>
        <p
          className="mt-1 font-display text-[15px]"
          style={{
            color: 'var(--fg)',
            letterSpacing: '-0.005em',
            lineHeight: 1.4,
          }}
        >
          {item.locked && !item.snippet
            ? isKo
              ? `${item.unlocksAt}에 열림`
              : `Opens on ${item.unlocksAt}`
            : item.title}
        </p>
        {item.snippet && !item.locked && item.snippet !== item.title && (
          <p
            className="mt-1 font-display text-[13px]"
            style={{ color: 'var(--fg-dim)', lineHeight: 1.45 }}
          >
            {item.snippet}
          </p>
        )}
      </div>
      {item.detailHref && !item.locked && (
        <ChevronRight
          className="mt-1 h-4 w-4 shrink-0"
          style={{ color: 'var(--fg-dimmer)' }}
        />
      )}
    </div>
  );

  if (item.detailHref && !item.locked) {
    return (
      <li>
        <Link href={item.detailHref} className="block">
          {Inner}
        </Link>
      </li>
    );
  }
  return <li>{Inner}</li>;
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Send } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { store } from '@/lib/store';
import { getWalletCookie } from '@/lib/wallet-cookie';
import { FlameShape, EmberStage } from '@/components/ember/flame-shape';
import { Eyebrow } from '@/components/ember/eyebrow';
import { EmberLine } from '@/components/ember/ember-line';
import { TimecapsuleSchedule } from '@/components/ember/timecapsule-schedule';

type Entry = {
  id: string;
  content: string;
  date: string;
  state?: EmberStage;
  committed_at?: string;
  unlocks_at?: string;
};

const STATE_LINE: Record<EmberStage, { en: string; ko: string }> = {
  dormant: {
    en: "Nothing moved today. It's still part of the fire.",
    ko: '오늘은 움직이지 않았어. 그래도 불의 일부야.',
  },
  sparked: {
    en: 'The smallest spark counts. You did not let it go.',
    ko: '가장 작은 불씨도 중요해. 놓지 않았잖아.',
  },
  burning: {
    en: 'The habit held. That is a long sentence.',
    ko: '습관이 버텼어. 그건 긴 문장이야.',
  },
  blazing: {
    en: 'Someone saw this. That is the gift of going visible.',
    ko: '누군가는 봤어. 드러냄의 선물이야.',
  },
  radiant: {
    en: 'You gave it forward. That is how it keeps living.',
    ko: '네가 전했어. 그렇게 계속 살아남아.',
  },
  eternal: {
    en: 'This one is yours now, forever.',
    ko: '이건 이제 영원히 너의 것이야.',
  },
};

export default function MemoryDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { lang } = useI18n();
  const isKo = lang === 'ko';

  const [mounted, setMounted] = useState(false);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [capsuleOpen, setCapsuleOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const profile = store.getProfile();
    const wallet = getWalletCookie();
    const resolvedEmail = profile.email || (wallet ? `${wallet}@wallet.local` : null);
    setEmail(resolvedEmail);
    const email = resolvedEmail;
    if (!email || !params.id) {
      setLoading(false);
      return;
    }
    // No dedicated /api/diary/[id] yet — fetch user's entries and pick the one
    fetch(`/api/diary?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        const found = (data.entries || []).find(
          (e: { id: string }) => e.id === params.id
        );
        setEntry(found || null);
      })
      .catch(() => setEntry(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center"
        style={{ backgroundColor: 'var(--bg-0)', color: 'var(--fg-dim)' }}
      >
        <span
          className="font-mono text-[10px] uppercase"
          style={{ letterSpacing: '0.24em' }}
        >
          loading…
        </span>
      </div>
    );
  }

  if (!entry) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ backgroundColor: 'var(--bg-0)', color: 'var(--fg)' }}
      >
        <FlameShape stage="dormant" size={80} />
        <h1 className="font-display text-[22px]" style={{ letterSpacing: '-0.02em' }}>
          {isKo ? '이 기록을 찾을 수 없어.' : 'Entry not found.'}
        </h1>
        <Link
          href="/memories"
          className="mt-2 rounded-full px-5 py-2.5 font-mono text-[11px] uppercase"
          style={{
            letterSpacing: '0.22em',
            border: '1px solid var(--rule-strong)',
            color: 'var(--fg)',
          }}
        >
          {isKo ? '추억으로' : 'Back to memories'}
        </Link>
      </div>
    );
  }

  const state = (entry.state || 'burning') as EmberStage;
  const locked =
    !!entry.unlocks_at && new Date(entry.unlocks_at) > new Date();

  return (
    <div
      className="relative flex min-h-dvh flex-col"
      style={{ backgroundColor: 'var(--bg-0)', color: 'var(--fg)' }}
    >
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 py-4"
        style={{
          backgroundColor: 'color-mix(in oklab, var(--bg-0) 90%, transparent)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--rule)',
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ color: 'var(--fg-dim)' }}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Eyebrow spacing="wide">{entry.date}</Eyebrow>
        <div className="w-9" />
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-10">
        <FlameShape
          stage={locked ? 'dormant' : state}
          size={180}
          breathe={!locked}
          rare={state === 'eternal' && !locked}
        />

        {locked ? (
          <div className="mt-10 flex max-w-95 flex-col items-center text-center">
            <Eyebrow spacing="wide" tone="teal">
              — {isKo ? '아직 잠긴 캡슐' : 'sealed capsule'}
            </Eyebrow>
            <h1
              className="mt-3 font-display"
              style={{
                fontSize: 'clamp(22px, 5.5vw, 28px)',
                letterSpacing: '-0.025em',
                color: 'var(--fg)',
                lineHeight: 1.25,
              }}
            >
              {isKo ? '아직 열리지 않았어.' : "This hasn't opened yet."}
            </h1>
            <div
              className="mt-5 flex items-center gap-2 rounded-md px-4 py-2.5 font-mono text-[11px] uppercase"
              style={{
                letterSpacing: '0.2em',
                color: 'var(--teal)',
                border: '1px solid var(--teal-soft)',
                backgroundColor: 'var(--teal-soft)',
              }}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>
                {isKo ? `${entry.unlocks_at}에 열림` : `Opens on ${entry.unlocks_at}`}
              </span>
            </div>
            <p
              className="mt-6 font-display text-[14px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              {isKo
                ? '미래의 네가 이걸 받게 될 거야.'
                : 'Your future self will open this.'}
            </p>
          </div>
        ) : (
          <>
            <div className="mt-10 w-full max-w-140">
              <Eyebrow spacing="wide" tone="ember">
                — {isKo ? '남아있는 한 줄' : 'what was kept'}
              </Eyebrow>
              <blockquote
                className="mt-4 rounded-lg p-5"
                style={{
                  backgroundColor: 'var(--bg-1)',
                  border: '1px solid var(--rule)',
                }}
              >
                <p
                  className="whitespace-pre-wrap font-display"
                  style={{
                    fontSize: 'clamp(17px, 2.4vw, 19px)',
                    lineHeight: 1.55,
                    letterSpacing: '-0.005em',
                    color: 'var(--fg)',
                  }}
                >
                  {entry.content}
                </p>
              </blockquote>
            </div>

            <div className="mt-8 w-full max-w-140">
              <EmberLine
                quote={isKo ? STATE_LINE[state].ko : STATE_LINE[state].en}
                translation={isKo ? STATE_LINE[state].en : STATE_LINE[state].ko}
                small
                accent={state === 'eternal' ? 'ember' : 'teal'}
              />
            </div>

            {entry.committed_at && (
              <p
                className="mt-6 font-mono text-[10px] uppercase"
                style={{ letterSpacing: '0.24em', color: 'var(--fg-dimmer)' }}
              >
                {isKo ? '영원히 남음 · ' : 'kept forever · '}
                {new Date(entry.committed_at).toLocaleDateString()}
              </p>
            )}

            {email && entry.id !== 'local' && (
              <button
                onClick={() => setCapsuleOpen(true)}
                className="mt-8 flex items-center gap-2 rounded-full px-5 py-2.5 font-mono text-[11px] uppercase transition"
                style={{
                  letterSpacing: '0.22em',
                  color: 'var(--teal)',
                  border: '1px solid var(--teal-soft)',
                  backgroundColor: 'var(--teal-soft)',
                }}
              >
                <Send className="h-3.5 w-3.5" />
                {isKo ? '미래의 나에게 보내기' : 'Send to future me'}
              </button>
            )}
          </>
        )}

        <Link
          href="/memories"
          className="mt-10 rounded-full px-6 py-3 font-mono text-[11px] uppercase transition"
          style={{
            letterSpacing: '0.22em',
            border: '1px solid var(--rule-strong)',
            color: 'var(--fg)',
          }}
        >
          {isKo ? '추억으로 돌아가기' : 'Back to memories'}
        </Link>
      </main>

      {capsuleOpen && email && entry && (
        <TimecapsuleSchedule
          entryId={entry.id}
          email={email}
          currentUnlocksAt={entry.unlocks_at}
          onScheduled={(unlocksAt) => {
            setEntry((prev) => (prev ? { ...prev, unlocks_at: unlocksAt } : prev));
            setCapsuleOpen(false);
          }}
          onClose={() => setCapsuleOpen(false)}
        />
      )}
    </div>
  );
}

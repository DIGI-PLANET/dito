'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { store } from '@/lib/store';
import { getWalletCookie } from '@/lib/wallet-cookie';
import { FlameShape, EmberStage, EMBER_STAGES } from '@/components/ember/flame-shape';
import { Eyebrow } from '@/components/ember/eyebrow';
import { EmberLine } from '@/components/ember/ember-line';
import { PermanenceGate } from '@/components/ember/permanence-gate';

type Mode = 'ask' | 'write' | 'review' | 'pick' | 'commit' | 'done' | 'locked';

type ExistingEntry = {
  id: string;
  content: string;
  state: EmberStage | null;
  committed_at: string | null;
  date: string;
};

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const STATE_LABELS: Record<EmberStage, { en: string; ko: string; sub: { en: string; ko: string } }> = {
  dormant: {
    en: 'Dormant',
    ko: '잠듦',
    sub: { en: 'nothing moved today.', ko: '오늘은 아무것도 움직이지 않았어.' },
  },
  sparked: {
    en: 'Sparked',
    ko: '점화',
    sub: { en: 'the smallest spark.', ko: '가장 작은 불씨.' },
  },
  burning: {
    en: 'Burning',
    ko: '타오름',
    sub: { en: 'the habit held.', ko: '습관이 버텼어.' },
  },
  blazing: {
    en: 'Blazing',
    ko: '작열',
    sub: { en: 'visible to others today.', ko: '오늘은 남들도 볼 만했어.' },
  },
  radiant: {
    en: 'Radiant',
    ko: '광휘',
    sub: { en: 'taught or led, quietly.', ko: '조용히 가르치거나 이끌었어.' },
  },
  eternal: {
    en: 'Eternal',
    ko: '영원',
    sub: { en: 'this one stays — for good.', ko: '이건 영원히 남을 거야.' },
  },
};

export default function TodayPage() {
  const router = useRouter();
  const { lang } = useI18n();
  const isKo = lang === 'ko';

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>('ask');
  const [entry, setEntry] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [picked, setPicked] = useState<EmberStage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<ExistingEntry | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>('');
  const [talent, setTalent] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    const profile = store.getProfile();
    const wallet = getWalletCookie();
    const email = profile.email || (wallet ? `${wallet}@wallet.local` : null);
    setProfileEmail(email);
    setProfileName(profile.display_name || '');
    setTalent(profile.current_talent || '');

    if (!email) return;

    // Check today's entry
    const key = todayKey();
    fetch(`/api/diary?email=${encodeURIComponent(email)}&date=${key}`)
      .then((r) => r.json())
      .then((data) => {
        const entries: ExistingEntry[] = data.entries || [];
        const committed = entries.find((e) => e.committed_at);
        if (committed) {
          setExisting(committed);
          setMode('locked');
        }
      })
      .catch(() => {
        /* silent: treat as no entry */
      });
  }, []);

  useEffect(() => {
    if (mode === 'write') {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [mode]);

  // Auto-advance commit → done
  useEffect(() => {
    if (mode === 'commit') {
      const t = setTimeout(() => setMode('done'), 2800);
      return () => clearTimeout(t);
    }
  }, [mode]);

  const handleCommit = useCallback(async () => {
    if (submitting || !picked || !profileEmail) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profileEmail,
          content: entry.trim(),
          date: todayKey(),
          state: picked,
          committed: true,
        }),
      });
      const data = await res.json();
      if (data?.entry) {
        setExisting({
          id: data.entry.id,
          content: entry.trim(),
          state: picked,
          committed_at: new Date().toISOString(),
          date: todayKey(),
        });
      }
      setMode('commit');
    } catch {
      // Still advance — local UX is the primary truth in this flow
      setExisting({
        id: 'local',
        content: entry.trim(),
        state: picked,
        committed_at: new Date().toISOString(),
        date: todayKey(),
      });
      setMode('commit');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, picked, profileEmail, entry]);

  const wordCount = useMemo(
    () => entry.trim().split(/\s+/).filter(Boolean).length,
    [entry]
  );

  if (!mounted) return null;

  // No talent yet → nudge to onboarding
  if (!talent) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: 'var(--bg-0)', color: 'var(--fg)' }}
      >
        <FlameShape stage="dormant" size={120} />
        <h1
          className="mt-6 font-display"
          style={{
            fontSize: 'clamp(22px, 5vw, 28px)',
            letterSpacing: '-0.025em',
            color: 'var(--fg)',
          }}
        >
          {isKo ? '아직 너의 불꽃이 없어.' : "You haven't lit an ember yet."}
        </h1>
        <p
          className="mt-3 max-w-[32ch] font-display text-[15px]"
          style={{ color: 'var(--fg-dim)' }}
        >
          {isKo
            ? '먼저 돌볼 재능을 하나 정해야 해. 금방이야.'
            : 'First, choose one talent to tend. It’s quick.'}
        </p>
        <Link
          href="/onboarding"
          className="mt-8 rounded-full px-6 py-3 font-mono text-[11px] uppercase"
          style={{
            letterSpacing: '0.24em',
            backgroundColor: 'var(--ember)',
            color: 'var(--fg-on-ember)',
            boxShadow: '0 6px 18px rgba(201,80,45,0.3)',
          }}
        >
          {isKo ? '불꽃 켜기' : 'Light one'}
        </Link>
      </div>
    );
  }

  // ─── LOCKED — already committed today ───
  if (mode === 'locked') {
    const state = (existing?.state || 'burning') as EmberStage;
    return (
      <div
        className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-10 text-center"
        style={{ backgroundColor: 'var(--bg-0)', color: 'var(--fg)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2"
          style={{
            background: 'radial-gradient(circle, var(--ember-glow) 0%, transparent 55%)',
          }}
        />
        <div className="relative">
          <FlameShape stage={state} size={160} breathe rare={state === 'eternal'} />
        </div>
        <div className="relative mt-8">
          <Eyebrow spacing="wide" tone="ember">
            — {isKo ? '오늘은 봉인됨' : "today is sealed"}
          </Eyebrow>
          <h1
            className="mt-3 font-display"
            style={{
              fontSize: 'clamp(22px, 5vw, 28px)',
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              color: 'var(--fg)',
            }}
          >
            {isKo ? '오늘 불꽃은 이미 남겼어.' : "You already lit today's ember."}
          </h1>
          <p
            className="mt-3 max-w-[40ch] font-display text-[15px]"
            style={{ color: 'var(--fg-dim)' }}
          >
            {isKo ? '내일 다시 와.' : 'Come back tomorrow.'}
          </p>
        </div>
        {existing?.content && (
          <blockquote
            className="relative mt-7 max-w-105 rounded-md px-4 py-3 text-left"
            style={{
              backgroundColor: 'var(--bg-1)',
              borderLeft: '2px solid var(--ember)',
              color: 'var(--fg)',
            }}
          >
            <p
              className="font-display text-[15.5px]"
              style={{ lineHeight: 1.55, letterSpacing: '-0.005em' }}
            >
              {existing.content}
            </p>
          </blockquote>
        )}
        <div className="relative mt-8 flex flex-col gap-2 w-full max-w-80">
          <Link
            href="/memories"
            className="rounded-full px-6 py-3 font-mono text-[11px] uppercase transition"
            style={{
              letterSpacing: '0.22em',
              border: '1px solid var(--rule-strong)',
              color: 'var(--fg)',
            }}
          >
            {isKo ? '추억 보기' : 'See memories'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-dvh flex-col"
      style={{ backgroundColor: 'var(--bg-0)', color: 'var(--fg)' }}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-4"
        style={{ backgroundColor: 'color-mix(in oklab, var(--bg-0) 85%, transparent)', backdropFilter: 'blur(12px)' }}
      >
        <button
          onClick={() => (mode === 'ask' ? router.back() : setMode('ask'))}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ color: 'var(--fg-dim)' }}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-col items-center">
          <Eyebrow spacing="wide" tone="dim">
            {isKo ? '오늘' : 'today'}
          </Eyebrow>
          <span
            className="mt-0.5 font-display text-[14px]"
            style={{ color: 'var(--fg-dim)', letterSpacing: '-0.005em' }}
          >
            {talent}
          </span>
        </div>
        <div className="w-9" />
      </header>

      <main className="relative flex flex-1 flex-col items-center px-6 pb-10 pt-6">
        {/* ── ASK ── */}
        {mode === 'ask' && (
          <div className="flex w-full max-w-105 flex-1 flex-col items-center justify-center text-center">
            <FlameShape stage="burning" size={140} breathe />
            <div className="mt-10 w-full">
              <EmberLine
                quote={
                  isKo
                    ? `${profileName || '너'}아, 오늘은 어땠어. 정말로.`
                    : `${profileName || 'friend'}, how was today. honestly.`
                }
                translation={isKo ? 'honestly.' : '정말로.'}
                accent="ember"
              />
            </div>
            <button
              onClick={() => setMode('write')}
              className="mt-10 w-full rounded-full py-4 font-mono text-[12px] uppercase transition"
              style={{
                letterSpacing: '0.22em',
                backgroundColor: 'var(--ember)',
                color: 'var(--fg-on-ember)',
                boxShadow: '0 6px 18px rgba(201,80,45,0.3)',
              }}
            >
              {isKo ? '답하기' : 'Answer'}
            </button>
          </div>
        )}

        {/* ── WRITE ── */}
        {mode === 'write' && (
          <div className="flex w-full max-w-140 flex-1 flex-col">
            <div className="mb-3">
              <Eyebrow spacing="wide">— {isKo ? '한 줄만.' : 'just one line.'}</Eyebrow>
            </div>
            <textarea
              ref={textareaRef}
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder={
                isKo
                  ? '꾸밀 필요는 없어.'
                  : "You don't have to dress it up."
              }
              className="min-h-[280px] w-full flex-1 resize-none bg-transparent font-display outline-none"
              style={{
                fontSize: 'clamp(18px, 3vw, 22px)',
                lineHeight: 1.55,
                letterSpacing: '-0.01em',
                color: 'var(--fg)',
              }}
            />
            <div className="mt-4 flex items-center justify-between">
              <span
                className="font-mono text-[10px] uppercase"
                style={{ letterSpacing: '0.22em', color: 'var(--fg-dimmer)' }}
              >
                {wordCount} {isKo ? '단어' : 'words'}
              </span>
              <button
                onClick={() => setMode('review')}
                disabled={entry.trim().length < 2}
                className="rounded-full px-5 py-2.5 font-mono text-[11px] uppercase transition disabled:opacity-40"
                style={{
                  letterSpacing: '0.22em',
                  border: '1px solid var(--rule-strong)',
                  color: 'var(--fg)',
                }}
              >
                {isKo ? '검토 →' : 'Review →'}
              </button>
            </div>
          </div>
        )}

        {/* ── REVIEW ── */}
        {mode === 'review' && (
          <div className="flex w-full max-w-120 flex-1 flex-col">
            <div className="mb-4">
              <Eyebrow spacing="wide">— {isKo ? '봉인 전 한 번 더' : 'before you seal it'}</Eyebrow>
            </div>
            <div
              className="rounded-lg p-5"
              style={{
                backgroundColor: 'var(--bg-1)',
                border: '1px solid var(--rule)',
              }}
            >
              <p
                className="whitespace-pre-wrap font-display"
                style={{
                  fontSize: '17.5px',
                  lineHeight: 1.55,
                  letterSpacing: '-0.005em',
                  color: 'var(--fg)',
                }}
              >
                {entry}
              </p>
            </div>
            <div className="mt-5">
              <PermanenceGate
                checked={acknowledged}
                onChange={setAcknowledged}
                label={isKo ? '이걸 수정하거나 삭제할 수 없다는 걸 알아.' : "I know I can't edit or delete this."}
              />
            </div>
            <div className="mt-auto flex gap-2.5 pt-6">
              <button
                onClick={() => setMode('write')}
                className="flex-1 rounded-full py-3.5 font-mono text-[11px] uppercase transition"
                style={{
                  letterSpacing: '0.22em',
                  border: '1px solid var(--rule-strong)',
                  color: 'var(--fg)',
                }}
              >
                {isKo ? '← 고치기' : '← Edit'}
              </button>
              <button
                onClick={() => setMode('pick')}
                disabled={!acknowledged}
                className="flex-1 rounded-full py-3.5 font-mono text-[11px] uppercase transition disabled:opacity-40"
                style={{
                  letterSpacing: '0.22em',
                  backgroundColor: acknowledged ? 'var(--ember)' : 'var(--bg-2)',
                  color: acknowledged ? 'var(--fg-on-ember)' : 'var(--fg-dim)',
                }}
              >
                {isKo ? '상태 고르기 →' : 'Pick state →'}
              </button>
            </div>
          </div>
        )}

        {/* ── PICK ── */}
        {mode === 'pick' && (
          <div className="flex w-full max-w-120 flex-1 flex-col">
            <div className="mb-3">
              <Eyebrow spacing="wide">
                — {isKo ? '오늘의 ember는 어디에 있어?' : "where is today's ember?"}
              </Eyebrow>
            </div>
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(22px, 5vw, 26px)',
                lineHeight: 1.2,
                letterSpacing: '-0.025em',
                color: 'var(--fg)',
              }}
            >
              {isKo ? '하나만 골라.' : 'Pick one.'}
            </h2>
            <div className="mt-6 space-y-2.5">
              {EMBER_STAGES.map((s) => {
                const active = picked === s.id;
                const l = STATE_LABELS[s.id];
                return (
                  <button
                    key={s.id}
                    onClick={() => setPicked(s.id)}
                    className="flex w-full items-center gap-4 rounded-lg px-3.5 py-3 text-left transition"
                    style={{
                      backgroundColor: active ? 'var(--ember-soft)' : 'var(--bg-1)',
                      border: `1px solid ${active ? 'var(--ember)' : 'var(--rule)'}`,
                    }}
                  >
                    <div className="shrink-0">
                      <FlameShape stage={s.id} size={44} rare={s.id === 'eternal'} />
                    </div>
                    <div className="flex-1">
                      <p
                        className="font-display text-[15.5px]"
                        style={{ color: 'var(--fg)', letterSpacing: '-0.01em' }}
                      >
                        {isKo ? l.ko : l.en}
                      </p>
                      <p
                        className="font-display text-[12.5px]"
                        style={{ color: 'var(--fg-dim)', marginTop: 2 }}
                      >
                        {isKo ? l.sub.ko : l.sub.en}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleCommit}
              disabled={!picked || submitting}
              className="mt-6 w-full rounded-full py-4 font-mono text-[12px] uppercase transition disabled:opacity-40"
              style={{
                letterSpacing: '0.22em',
                backgroundColor: 'var(--ember)',
                color: 'var(--fg-on-ember)',
                boxShadow: '0 6px 18px rgba(201,80,45,0.3)',
              }}
            >
              {submitting && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}
              {isKo ? '오늘을 봉인한다' : 'Seal today'}
            </button>
          </div>
        )}

        {/* ── COMMIT (ceremony) ── */}
        {mode === 'commit' && (
          <div className="flex w-full flex-1 flex-col items-center justify-center text-center">
            <div className="relative">
              {/* expanding rings */}
              {[0, 0.4, 0.8].map((delay, i) => (
                <span
                  key={i}
                  aria-hidden
                  className="absolute left-1/2 top-1/2 rounded-full"
                  style={{
                    width: 240,
                    height: 240,
                    marginLeft: -120,
                    marginTop: -120,
                    border: '1.5px solid var(--ember)',
                    opacity: 0,
                    animation: `ember-commit-ring 2.4s ease-out ${delay}s forwards`,
                  }}
                />
              ))}
              <div
                style={{
                  opacity: 0,
                  animation: 'ember-commit-grow 900ms cubic-bezier(.2,.8,.2,1) forwards',
                }}
              >
                <FlameShape
                  stage={picked || 'blazing'}
                  size={200}
                  breathe
                  rare={picked === 'eternal'}
                />
              </div>
            </div>
            <div
              className="mt-10"
              style={{
                opacity: 0,
                animation: 'ember-commit-text 900ms ease-out 800ms forwards',
              }}
            >
              <Eyebrow spacing="wide" tone="ember">
                — {isKo ? '영원히 남음' : 'kept forever'}
              </Eyebrow>
              <h2
                className="mt-3 font-display"
                style={{
                  fontSize: 'clamp(24px, 5.5vw, 30px)',
                  letterSpacing: '-0.025em',
                  color: 'var(--fg)',
                }}
              >
                {isKo ? '오늘은 봉인됨.' : 'Today is sealed.'}
              </h2>
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {mode === 'done' && (
          <div className="flex w-full max-w-105 flex-1 flex-col items-center justify-center text-center">
            <FlameShape
              stage={picked || 'blazing'}
              size={160}
              breathe
              rare={picked === 'eternal'}
            />
            <div className="mt-8 w-full">
              <EmberLine
                quote={
                  isKo
                    ? '그런 날도 있지. 그것도 오늘이야.'
                    : 'Some days are just like that. Still counts.'
                }
                translation={isKo ? 'still counts.' : '그것도 오늘이야.'}
                accent="ember"
              />
            </div>
            <div className="mt-8 flex w-full flex-col gap-2">
              <Link
                href="/memories"
                className="rounded-full px-6 py-3.5 text-center font-mono text-[11px] uppercase transition"
                style={{
                  letterSpacing: '0.22em',
                  backgroundColor: 'var(--ember)',
                  color: 'var(--fg-on-ember)',
                  boxShadow: '0 6px 18px rgba(201,80,45,0.3)',
                }}
              >
                {isKo ? '추억 보러 가기' : 'See memories'}
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full px-6 py-3.5 text-center font-mono text-[11px] uppercase transition"
                style={{
                  letterSpacing: '0.22em',
                  border: '1px solid var(--rule-strong)',
                  color: 'var(--fg)',
                }}
              >
                {isKo ? '홈으로' : 'Home'}
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

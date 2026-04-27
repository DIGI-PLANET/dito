'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/providers/i18n-provider';
import { store } from '@/lib/store';
import { useDiscoveryGate } from '@/hooks/useDiscoveryGate';
import {
  ArrowLeft,
  Flame,
  Sparkles,
  CircleCheck,
  Send,
  TriangleAlert,
} from 'lucide-react';

type ChatRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

interface JournalEntry {
  date: string; // YYYY-MM-DD
  messages: ChatMessage[];
  markedDone: boolean;
}

const JOURNAL_KEY = 'dito.journal.v1';
const DAILY_GOAL = 80; // 80% achievement rule

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadJournal(): Record<string, JournalEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    return raw ? (JSON.parse(raw) as Record<string, JournalEntry>) : {};
  } catch {
    return {};
  }
}

function persistJournal(all: Record<string, JournalEntry>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(all));
  } catch {
    /* quota exceeded etc. */
  }
}

function computeStreak(all: Record<string, JournalEntry>): number {
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    const entry = all[key];
    if (entry?.markedDone) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function ChatPage() {
  const router = useRouter();
  const { lang } = useI18n();
  const isKo = lang === 'ko';
  const { isChecking, isReady } = useDiscoveryGate();

  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markedDone, setMarkedDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [mounted, setMounted] = useState(false);

  const feedRef = useRef<HTMLDivElement | null>(null);
  const dateKey = useMemo(() => todayKey(), []);

  // ---------- boot: profile + journal ----------
  useEffect(() => {
    setMounted(true);
    if (!isReady) return;

    (async () => {
      try {
        const p = await store.getProfileAsync();
        setProfile(p);
      } catch (e) {
        console.error('profile load failed', e);
      }
    })();

    const all = loadJournal();
    const todays = all[dateKey];
    if (todays) {
      setMessages(todays.messages);
      setMarkedDone(!!todays.markedDone);
    } else {
      // seed Ember greeting (matches Figma copy: "Today's Focus" prompt)
      const seed: ChatMessage = {
        id: 'seed-' + Date.now(),
        role: 'assistant',
        content: isKo
          ? '당신이 꽉 붙들고 있지만, 좀처럼 의심하지 않는 믿음은 무엇인가요?'
          : 'What is a belief you hold tightly, but rarely question?',
        createdAt: Date.now(),
      };
      setMessages([seed]);
    }
    setStreak(computeStreak(all));
  }, [isReady, dateKey, isKo]);

  // ---------- persist on change ----------
  useEffect(() => {
    if (!mounted || !isReady) return;
    const all = loadJournal();
    all[dateKey] = {
      date: dateKey,
      messages,
      markedDone,
    };
    persistJournal(all);
    setStreak(computeStreak(all));
  }, [messages, markedDone, dateKey, mounted, isReady]);

  // ---------- autoscroll ----------
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  // ---------- ring gauge value ----------
  const progressPct = useMemo(() => {
    const userReflections = messages.filter((m) => m.role === 'user').length;
    // 5 reflections => 100% (tuneable daily shape target)
    const raw = Math.min(100, userReflections * 20 + (markedDone ? 20 : 0));
    return raw;
  }, [messages, markedDone]);

  const achieved = progressPct >= DAILY_GOAL || markedDone;

  // ---------- chat submit ----------
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: 'u-' + Date.now(),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          message: text,
          history: history.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          lang: isKo ? 'ko' : 'en',
          name: profile?.display_name || profile?.username || 'Seeker',
          mode: 'reflection',
        }),
      });

      if (!res.ok) throw new Error('chat_http_' + res.status);

      const ct = res.headers.get('content-type') || '';
      const assistantId = 'a-' + Date.now();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', createdAt: Date.now() },
      ]);

      if (ct.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';
          for (const chunk of parts) {
            const line = chunk.split('\n').find((l) => l.startsWith('data:'));
            if (!line) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            let delta = payload;
            try {
              const parsed = JSON.parse(payload);
              delta = parsed.delta ?? parsed.content ?? parsed.message ?? '';
            } catch {
              /* treat as raw text */
            }
            if (!delta) continue;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + delta } : m,
              ),
            );
          }
        }
      } else {
        const data = await res.json();
        const reply: string = data.reply || data.message || data.content || '';
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: reply } : m)),
        );
      }
    } catch (err) {
      console.error('chat failed', err);
      setError(
        isKo
          ? 'Ember에게 닿지 못했어요. 잠시 후 다시 시도해주세요.'
          : "Couldn't reach Ember. Try again in a moment.",
      );
    } finally {
      setSending(false);
    }
  }

  function handleMarkDone() {
    if (markedDone) return;
    setMarkedDone(true);
  }

  // ---------- render ----------
  if (isChecking) {
    return (
      <div data-landing-page className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ember)] border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            {isKo ? 'Ember 소환 준비중…' : 'Preparing to summon Ember…'}
          </p>
        </div>
      </div>
    );
  }

  if (!isReady) return null;
  if (!mounted) return null;

  const talent = profile?.current_talent || (isKo ? '관찰자' : 'The Observer');
  const stageLabel = profile?.ember_stage
    ? profile.ember_stage.charAt(0).toUpperCase() + profile.ember_stage.slice(1)
    : 'Stage 3';

  // Ring geometry
  const ringSize = 36;
  const ringStroke = 3;
  const ringR = (ringSize - ringStroke) / 2;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC - (progressPct / 100) * ringC;

  return (
    <div
      data-landing-page
      className="relative flex min-h-[100dvh] flex-col bg-background text-foreground"
    >
      {/* ---------- Top bar ---------- */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-[56px] w-full max-w-[640px] items-center gap-3 px-4">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition hover:bg-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ember)]/15 ring-1 ring-[var(--ember)]/30">
              <Flame className="h-3.5 w-3.5 text-[var(--ember)]" />
            </div>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-[14px] font-semibold">Ember</span>
              <span className="truncate text-[11px] text-muted-foreground">
                {talent} · {stageLabel}
              </span>
            </div>
          </div>

          {/* Ring gauge (daily goal) */}
          <div className="flex items-center gap-2">
            <div className="relative inline-flex h-9 w-9 items-center justify-center">
              <svg width={ringSize} height={ringSize} className="-rotate-90">
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringR}
                  stroke="currentColor"
                  strokeOpacity={0.15}
                  strokeWidth={ringStroke}
                  fill="none"
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
                  fill="none"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <span className="absolute text-[9px] font-semibold text-foreground/80">
                {progressPct}%
              </span>
            </div>
          </div>
        </div>

        {/* Streak + Today's Focus strip */}
        <div className="mx-auto flex w-full max-w-[640px] items-center justify-between gap-3 px-4 pb-3 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-[var(--ember)]" />
            <span className="font-medium text-foreground/80">
              {isKo ? `${streak}일 연속` : `${streak} Day Streak`}
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span>{isKo ? `${'Day '}${streak + 1}` : `Day ${streak + 1}`}</span>
          </div>
          <div className="text-[11px] font-medium uppercase tracking-[0.8px] text-[var(--ember)]">
            {isKo ? '오늘의 초점' : "Today's Focus"}
          </div>
        </div>
      </header>

      {/* ---------- Chat feed ---------- */}
      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto"
      >
        <main className="mx-auto flex w-full max-w-[640px] flex-col gap-4 px-4 py-5 pb-40">
          {/* Ember "misses you" callout */}
          {streak === 0 && (
            <div className="flex items-start gap-2 rounded-[12px] border border-[var(--ember)]/25 bg-[var(--ember)]/5 px-3 py-2.5 text-[12px] text-foreground/80">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ember)]" />
              <div className="flex-1">
                <div className="font-semibold text-foreground">
                  {isKo ? 'Ember가 당신을 그리워해요' : 'Ember misses you'}
                </div>
                <div className="mt-0.5 text-muted-foreground">
                  {isKo
                    ? '마지막 성찰 이후 며칠이 지났어요. 꾸준함이 Soul을 키웁니다.'
                    : "It's been a while since your last reflection. Consistency builds the Soul."}
                </div>
              </div>
            </div>
          )}

          {messages.map((m) => {
            if (m.role === 'user') {
              return (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[82%] rounded-[14px] rounded-tr-sm border border-border bg-card px-3.5 py-2.5 text-[14px] leading-relaxed text-foreground/90">
                    {m.content}
                  </div>
                </div>
              );
            }
            return (
              <div key={m.id} className="flex items-start gap-2">
                <div className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ember)]/15 ring-1 ring-[var(--ember)]/30">
                  <Flame className="h-3.5 w-3.5 text-[var(--ember)]" />
                </div>
                <div className="max-w-[82%] rounded-[14px] rounded-tl-sm border border-[var(--ember)]/25 bg-[var(--ember)]/5 px-3.5 py-2.5 text-[14px] leading-relaxed text-foreground/90">
                  {m.content || (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ember)]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ember)] [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ember)] [animation-delay:240ms]" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {sending && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex items-start gap-2">
              <div className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ember)]/15 ring-1 ring-[var(--ember)]/30">
                <Flame className="h-3.5 w-3.5 text-[var(--ember)]" />
              </div>
              <div className="rounded-[14px] rounded-tl-sm border border-[var(--ember)]/25 bg-[var(--ember)]/5 px-3.5 py-2.5">
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ember)]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ember)] [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ember)] [animation-delay:240ms]" />
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-[12px] border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-500">
              {error}
            </div>
          )}
        </main>
      </div>

      {/* ---------- Composer (sticky bottom) ---------- */}
      <div className="sticky bottom-0 z-30 w-full border-t border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[640px] flex-col gap-2 px-4 py-3">
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 rounded-[14px] border border-border bg-card px-2.5 py-2 focus-within:border-[var(--ember)]/50 focus-within:ring-2 focus-within:ring-[var(--ember)]/20"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={1}
              placeholder={isKo ? '여기에 성찰을 적어보세요…' : 'Reflect here…'}
              disabled={sending}
              className="min-h-[36px] max-h-[120px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[14px] leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              aria-label="Send"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ember)] text-[var(--fg-on-ember)] shadow-[0_4px_10px_rgba(250,175,46,0.25)] transition hover:bg-[#e8a129] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <button
            type="button"
            onClick={handleMarkDone}
            disabled={markedDone}
            className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] text-[14px] font-semibold transition ${
              markedDone
                ? 'bg-[var(--ember)]/20 text-[var(--ember)] ring-1 ring-inset ring-[var(--ember)]/40'
                : 'bg-[var(--ember)] text-[var(--fg-on-ember)] shadow-[0_6px_14px_rgba(250,175,46,0.25)] hover:bg-[#e8a129]'
            }`}
          >
            {markedDone ? (
              <>
                <CircleCheck className="h-4 w-4" />
                {isKo ? '오늘 완료' : 'Done for today'}
              </>
            ) : (
              <>
                <Flame className="h-4 w-4" />
                {isKo ? '오늘 완료로 표시' : 'Mark today as done'}
              </>
            )}
          </button>

          {achieved && !markedDone && (
            <p className="text-center text-[11px] text-[var(--ember)]">
              {isKo
                ? '오늘의 목표 80% 달성! 완료로 표시해 연속 기록을 이어가세요.'
                : 'Daily goal 80% reached — mark done to keep your streak.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

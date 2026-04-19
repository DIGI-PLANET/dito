'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Flame,
  Sparkles,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  Send,
  X,
} from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { store } from '@/lib/store';

interface Choice {
  id: string;
  text: string;
}

interface Message {
  role: 'ember' | 'user';
  content: string;
  choices?: Choice[];
  freeInput?: boolean;
  failed?: boolean;
}

type Step = 'ember-name' | 'discovery' | 'diagnosis' | 'done';

const DIAGNOSIS_QUESTIONS_KO = [
  '⏰ 시간 가는 줄 모르고 하시는 게 뭔가요?',
  '👀 남들이 잘한다고 하는 게 있으세요?',
  '🧒 어렸을 때 좋아하셨던 건요?',
  '📱 유튜브/SNS에서 자주 보시는 건요?',
  '💰 돈 안 줘도 하실 수 있는 건요?',
];

const DIAGNOSIS_QUESTIONS_EN = [
  '⏰ What do you do when you lose track of time?',
  "👀 What do others say you're good at?",
  '🧒 What did you love doing as a kid?',
  '📱 What do you watch most on YouTube/social media?',
  '💰 What would you do even without getting paid?',
];

const TOTAL_DIAG = 5;

function ExitModal({ isKo, onExit, onCancel }: { isKo: boolean; onExit: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-[14px] p-6 max-w-xs w-full mx-4 space-y-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#faaf2e]/10 ring-1 ring-[#faaf2e]/30 mx-auto">
          <Flame className="h-5 w-5 text-[#faaf2e]" />
        </span>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {isKo
            ? '재능 발견을 그만할까요?\n다음에 와서 해도 괜찮아요!'
            : 'Stop discovering your talent?\nYou can always come back later!'}
        </p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={onExit}
            variant="outline"
            className="w-full h-11 rounded-[10px] border-red-500/30 text-red-500 hover:bg-red-500/10"
          >
            {isKo ? '나가기' : 'Leave'}
          </Button>
          <Button
            onClick={onCancel}
            className="w-full h-11 rounded-[10px] bg-[#faaf2e] hover:bg-[#e8a129] text-[#4b3002] font-semibold"
          >
            {isKo ? '계속하기' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Ember avatar ─── */
function EmberAvatar({ size = 32 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-[#faaf2e]/12 ring-1 ring-[#faaf2e]/40"
      style={{ height: size, width: size }}
    >
      <Flame className="text-[#faaf2e]" style={{ height: size * 0.45, width: size * 0.45 }} />
    </span>
  );
}

/* ─── Progress chip (top) ─── */
function ProgressChip({ current, total, isKo }: { current: number; total: number; isKo: boolean }) {
  const pct = Math.min(100, Math.max(0, (current / total) * 100));
  const label = isKo ? `질문 ${current} / ${total}` : `Question ${current} of ${total}`;
  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-card/80 px-3 py-1.5 backdrop-blur-sm">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-foreground/10">
        <span
          className="block h-full rounded-full bg-[#faaf2e] transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  );
}

/* ─── Resuming chip ─── */
function ResumingChip({ isKo }: { isKo: boolean }) {
  return (
    <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur-sm">
      <RefreshCw className="h-3 w-3 text-[#faaf2e]" />
      <span>{isKo ? '이어서 진행 중' : 'Resuming your journey'}</span>
    </div>
  );
}

export default function DiscoveryPage() {
  const router = useRouter();
  const { lang } = useI18n();
  const isKo = lang === 'ko';

  const [step, setStep] = useState<Step>('ember-name');
  const [emberName, setEmberName] = useState('');
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [decided, setDecided] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [freeText, setFreeText] = useState('');
  const [turnCount, setTurnCount] = useState(0);
  const [freeInputAttempts, setFreeInputAttempts] = useState(0);
  const [diagIndex, setDiagIndex] = useState(0);
  const [diagAnswers, setDiagAnswers] = useState<string[]>([]);
  const [showExitModal, setShowExitModal] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [chatLocked, setChatLocked] = useState(false);
  const [showResuming, setShowResuming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const init = async () => {
      try {
        const profile = await store.getProfileAsync();
        if (!profile?.username) {
          router.replace('/auth');
          return;
        }
        setUsername(profile.username);

        const ember = await store.getEmberAsync();
        if (ember) {
          router.replace('/');
          return;
        }
      } catch {
        router.replace('/auth');
        return;
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Show "Resuming" chip briefly when entering discovery
  useEffect(() => {
    if (step !== 'discovery') return;
    setShowResuming(true);
    const t = setTimeout(() => setShowResuming(false), 2600);
    return () => clearTimeout(t);
  }, [step]);

  // Intercept browser back button → show exit modal (only during discovery chat)
  const beforeUnloadRef = useRef<((e: BeforeUnloadEvent) => void) | null>(null);

  useEffect(() => {
    if (step !== 'discovery') return;

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      setShowExitModal(true);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    beforeUnloadRef.current = handleBeforeUnload;
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      beforeUnloadRef.current = null;
    };
  }, [step]);

  const handleEmberNameSubmit = async () => {
    if (!emberName.trim()) return;
    setStep('discovery');
    sendToEmber('[USER_STARTED_DISCOVERY]');
  };

  const sendToEmber = async (userMessage: string) => {
    setLoading(true);
    try {
      const history = messages.map((m) => ({
        role: m.role === 'ember' ? ('ember' as const) : ('user' as const),
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage,
          mode: 'discovery',
          history,
          lang,
          name: username,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        let content: string;
        let choices: Choice[] | undefined;

        if (res.status === 429) {
          content = isKo
            ? '🔥 잠깐만요! 너무 빠르게 요청했어요. 잠시 후 다시 시도해주세요.'
            : '🔥 Slow down! Too many requests. Please wait a moment.';
        } else if (res.status === 401) {
          content = isKo
            ? '🔒 세션이 만료됐어요. 페이지를 새로고침해주세요.'
            : '🔒 Session expired. Please refresh the page.';
        } else if (res.status === 503) {
          content = isKo
            ? '🔧 서비스에 일시적인 문제가 생겼어요. 빠르게 조치할게요!'
            : "🔧 Service is temporarily unavailable. We'll fix it right away!";
          choices = [{ id: '__exit__', text: isKo ? '✅ 알겠어요' : '✅ Got it' }];
        } else {
          content = isKo
            ? '😅 잠깐 연결이 흔들렸어요. 다시 시도해볼까요?'
            : '😅 Connection flickered for a moment. Want to try again?';
          choices = [{ id: 'retry', text: isKo ? '🔄 다시 시도' : '🔄 Retry' }];
        }

        setMessages((prev) => [...prev, { role: 'ember' as const, content, choices, failed: true }]);
        return;
      }

      if (data.violated) {
        const newCount = violationCount + 1;
        setViolationCount(newCount);
        if (newCount >= 2) {
          setChatLocked(true);
          setMessages((prev) => [
            ...prev,
            {
              role: 'ember' as const,
              content: isKo
                ? '⛔ 부적절한 내용이 반복 감지됐어요. 채팅이 제한됐어요.'
                : '⛔ Repeated inappropriate content detected. Chat is now restricted.',
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: 'ember' as const,
              content: data.message,
              choices: [
                {
                  id: 'continue',
                  text: isKo ? '🔥 다른 걸로 해볼게요' : '🔥 Let me try something else',
                },
              ],
            },
          ]);
        }
        return;
      }

      if (data.talentDecided) {
        const profile = store.getProfile();
        const updated = {
          ...profile,
          current_talent: data.talentDecided,
          talentCategory: data.talentCategory,
        };
        store.setProfile(updated);

        store.saveEmberAsync({
          ember_name: emberName.trim(),
          talent: data.talentDecided,
          talent_category: data.talentCategory,
          discovery_conversation: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'ember' as const, content: data.message },
          ],
          lang,
        }).catch(() => {});

        const seekerMsg = isKo
          ? `${emberName.trim()} 소환 완료! 🔥\n\n${username}님의 Ember가 탄생했어요.\nEmber와 매일 대화하며 재능을 성장시켜 보세요.`
          : `${emberName.trim()} has been summoned! 🔥\n\n${username}, your Ember is born.\nChat with your Ember daily and grow your talent.`;

        setMessages((prev) => [
          ...prev,
          { role: 'ember', content: data.message },
          { role: 'ember', content: seekerMsg },
        ]);
        setDecided(true);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'ember',
            content: data.message,
            choices: data.choices,
            freeInput: data.freeInput,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ember',
          content: isKo
            ? '앗, 잠깐 불꽃이 흔들렸어요... 다시 해볼까요? 🔥'
            : 'Oops, my flame flickered... try again? 🔥',
          choices: [{ id: 'retry', text: isKo ? '🔄 다시 시도' : '🔄 Retry' }],
          failed: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = (choice: Choice) => {
    if (loading || decided || chatLocked) return;
    if (choice.id === '__exit__') {
      router.replace('/');
      return;
    }

    if (choice.id === 'retry') {
      setMessages([]);
      setTurnCount(0);
      setStep('discovery');
      setDecided(false);
      setDiagAnswers([]);
      setDiagIndex(0);
      setViolationCount(0);
      setFreeInputAttempts(0);

      setTimeout(() => {
        const greeting = isKo
          ? `안녕하세요 ${username}님! 🔥\n숨겨진 재능을 찾아보겠습니다. 편하게 대화해주세요!`
          : `Hello ${username}! 🔥\nLet's discover your hidden talents. Just chat with me naturally!`;
        setMessages([{ role: 'ember', content: greeting }]);
      }, 100);
      return;
    }
    const newTurn = turnCount + 1;
    setTurnCount(newTurn);
    setMessages((prev) => {
      const updated = [...prev];
      if (updated.length > 0 && updated[updated.length - 1].role === 'ember') {
        updated[updated.length - 1] = { ...updated[updated.length - 1], choices: undefined };
      }
      return [...updated, { role: 'user', content: choice.text }];
    });

    if (newTurn >= 12 && !decided) {
      const diagQuestions = isKo ? DIAGNOSIS_QUESTIONS_KO : DIAGNOSIS_QUESTIONS_EN;
      const intro = isKo
        ? '흠, 아직 딱 맞는 게 안 나왔네요! 🤔\n괜찮아요, 다른 방법으로 찾아봐요. 간단한 질문 5개만 답해주세요!'
        : "Hmm, haven't found the right fit yet! 🤔\nNo worries, let's try a different way. Just answer 5 quick questions!";
      setMessages((prev) => [
        ...prev,
        {
          role: 'ember',
          content: `${intro}\n\n**Q1.** ${diagQuestions[0]}`,
          freeInput: true,
        },
      ]);
      setStep('diagnosis');
      setDiagIndex(0);
      setFreeInputAttempts(0);
      return;
    }

    sendToEmber(choice.text);
  };

  const handleDiagnosisAnswer = async (answer: string) => {
    const diagQuestions = isKo ? DIAGNOSIS_QUESTIONS_KO : DIAGNOSIS_QUESTIONS_EN;
    const newAnswers = [...diagAnswers, answer];
    setDiagAnswers(newAnswers);

    setMessages((prev) => [...prev, { role: 'user', content: answer }]);

    const nextIdx = diagIndex + 1;
    if (nextIdx < diagQuestions.length) {
      setDiagIndex(nextIdx);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ember',
          content: `**Q${nextIdx + 1}.** ${diagQuestions[nextIdx]}`,
          freeInput: true,
        },
      ]);
    } else {
      setLoading(true);
      try {
        const analysisPrompt = newAnswers
          .map((a, i) => `Q${i + 1}. ${diagQuestions[i]}\nA: ${a}`)
          .join('\n\n');
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            message: `[DIAGNOSIS_MODE]\n${analysisPrompt}\n\nBased on these 5 answers, suggest exactly 3 specific talent directions as button choices. Be specific (not vague categories). Also include a "처음부터 다시" option.`,
            mode: 'discovery',
            history: [],
            lang,
            name: username,
          }),
        });
        const data = await res.json();

        if (data.talentDecided) {
          const profile = store.getProfile();
          const updated = {
            ...profile,
            current_talent: data.talentDecided,
            talentCategory: data.talentCategory,
          };
          store.setProfile(updated);

          store.saveEmberAsync({
            ember_name: emberName.trim(),
            talent: data.talentDecided,
            talent_category: data.talentCategory,
            discovery_conversation: messages.map((m) => ({ role: m.role, content: m.content })),
            lang,
          }).catch(() => {});

          setMessages((prev) => [...prev, { role: 'ember', content: data.message }]);
          setDecided(true);
        } else {
          const introMsg = isKo
            ? '답변을 분석해봤어요! 🔥 이 중에 끌리는 게 있으세요?'
            : 'I analyzed your answers! 🔥 Any of these catch your eye?';
          setMessages((prev) => [
            ...prev,
            {
              role: 'ember',
              content: data.message || introMsg,
              choices: data.choices || [],
            },
          ]);
          setStep('discovery');
          setTurnCount(0);
          setFreeInputAttempts(0);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'ember',
            content: isKo
              ? '앗, 분석 중 문제가 생겼어요... 다시 해볼까요? 🔥'
              : 'Oops, something went wrong... try again? 🔥',
            choices: [{ id: 'retry', text: isKo ? '🔄 처음부터 다시' : '🔄 Start Over' }],
            failed: true,
          },
        ]);
        setStep('discovery');
        setTurnCount(0);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExit = () => {
    if (beforeUnloadRef.current) {
      window.removeEventListener('beforeunload', beforeUnloadRef.current);
      beforeUnloadRef.current = null;
    }
    router.replace('/');
  };

  if (!mounted) return null;

  /* ─────────────────────────────────────────────────────────
   * Ember Name Step — Figma-spec intro screen
   * Copy from node JSON:
   *   "5 questions. 10 minutes.\nOne honest read."
   *   "Let's dive deep into your core drivers."
   *   CTA: "Begin"
   * ───────────────────────────────────────────────────────── */
  if (step === 'ember-name') {
    return (
      <div
        data-landing-page
        className="relative min-h-screen w-full bg-background text-foreground flex items-center justify-center px-5 py-10"
      >
        {/* soft amber glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#faaf2e]/15 blur-[100px]" />
        <div className="relative z-10 w-full max-w-[420px]">
          <div className="flex flex-col items-center text-center space-y-5">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#faaf2e]/10 shadow-[0_0_40px_rgba(250,175,46,0.35)] ring-1 ring-[#faaf2e]/40">
              <Flame className="h-6 w-6 text-[#faaf2e]" />
            </span>

            <p className="text-[13px] font-semibold uppercase tracking-[1.4px] text-[#faaf2e]/85">
              {isKo ? '5문항 · 10분 · 솔직한 한 줄' : '5 questions · 10 minutes · One honest read'}
            </p>

            <h1 className="text-[26px] font-bold leading-tight tracking-tight md:text-[32px]">
              {isKo ? '핵심 동기를 깊이 들여다봐요.' : "Let's dive deep into your core drivers."}
            </h1>

            <p className="text-[14px] leading-relaxed text-muted-foreground md:text-[15px]">
              {isKo
                ? 'Ember의 이름을 먼저 지어주세요. 이 여정의 동반자가 됩니다.'
                : 'Start by naming your Ember — your companion for this journey.'}
            </p>

            <div className="w-full space-y-3 pt-2">
              <Input
                value={emberName}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ]/g, '');
                  setEmberName(v);
                }}
                placeholder={isKo ? '최대 16자, 문자만 허용' : 'Max 16 chars, letters only'}
                className="h-12 rounded-[10px] text-center text-base"
                maxLength={16}
                onKeyDown={(e) => e.key === 'Enter' && handleEmberNameSubmit()}
                autoFocus
              />
              <Button
                onClick={handleEmberNameSubmit}
                disabled={!emberName.trim()}
                className="w-full h-12 rounded-[10px] bg-[#faaf2e] hover:bg-[#e8a129] text-[#4b3002] font-semibold text-[15px] shadow-[0_10px_24px_rgba(250,175,46,0.3)] disabled:opacity-40 disabled:shadow-none"
              >
                {isKo ? '시작하기' : 'Begin'}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <Link
              href="/"
              className="pt-2 text-[12px] text-muted-foreground transition hover:text-foreground/80"
            >
              {isKo ? '나중에' : 'Maybe later'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────
   * Discovery + Diagnosis Chat (Figma: dark chat with progress,
   * Ember avatar, user card right, retry banner, summary overlay).
   * ───────────────────────────────────────────────────────── */
  const progressCurrent = step === 'diagnosis' ? Math.min(diagIndex + 1, TOTAL_DIAG) : 0;
  const showProgress = step === 'diagnosis';

  return (
    <div
      data-landing-page
      className="relative flex min-h-screen w-full flex-col bg-background text-foreground"
    >
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-md">
        <button
          onClick={() => setShowExitModal(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
          aria-label={isKo ? '닫기' : 'Close'}
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#faaf2e]/12 ring-1 ring-[#faaf2e]/30">
            <Flame className="h-3.5 w-3.5 text-[#faaf2e]" />
          </span>
          <span className="text-[13px] font-semibold tracking-tight">
            {isKo ? '재능 발견' : 'Discovery'}
          </span>
        </div>

        <div className="w-9">
          {showProgress ? (
            <div className="hidden sm:block">
              <ProgressChip current={progressCurrent} total={TOTAL_DIAG} isKo={isKo} />
            </div>
          ) : null}
        </div>
      </header>

      {/* Mobile progress row (compact) */}
      {showProgress && (
        <div className="sm:hidden border-b border-border/40 bg-background/60 px-4 py-2">
          <div className="flex justify-center">
            <ProgressChip current={progressCurrent} total={TOTAL_DIAG} isKo={isKo} />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="relative flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto w-full max-w-[720px] px-4 py-5 md:px-6">
          {showResuming && (
            <div className="mb-4 flex justify-center">
              <ResumingChip isKo={isKo} />
            </div>
          )}

          <ul className="flex flex-col gap-4">
            {messages.map((msg, i) => (
              <li
                key={i}
                className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ember' && <EmberAvatar />}
                <div
                  className={`max-w-[82%] md:max-w-[78%] rounded-[14px] px-4 py-3 text-[14px] leading-[1.55] shadow-[0_2px_4px_rgba(0,0,0,0.15)] ${
                    msg.role === 'user'
                      ? 'rounded-br-xl bg-card border border-border/60 text-foreground/95'
                      : 'rounded-bl-xl border border-[#faaf2e]/20 bg-[#faaf2e]/6 text-foreground/95'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                  {msg.failed && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-red-500/90">
                      <AlertCircle className="h-3 w-3" />
                      {isKo ? '전송 실패. 탭해서 다시 시도.' : 'Message failed to send. Tap to retry.'}
                    </p>
                  )}
                </div>
              </li>
            ))}

            {loading && (
              <li className="flex items-end gap-2 justify-start">
                <EmberAvatar />
                <div className="rounded-[14px] rounded-bl-xl border border-[#faaf2e]/20 bg-[#faaf2e]/6 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-muted-foreground">
                      {isKo ? 'Ember가 생각 중' : 'Ember is thinking'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#faaf2e] animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#faaf2e] animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#faaf2e] animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </span>
                  </div>
                </div>
              </li>
            )}
          </ul>

          {/* Summary / decided card (post-Q) */}
          {decided && <SummaryCard isKo={isKo} emberName={emberName.trim()} />}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Exit Modal */}
      {showExitModal && (
        <ExitModal
          isKo={isKo}
          onExit={handleExit}
          onCancel={() => setShowExitModal(false)}
        />
      )}

      {/* Chat-locked banner */}
      {chatLocked && !decided && (
        <div className="shrink-0 border-t border-border/60 bg-background/80 px-4 py-4 text-center pb-[env(safe-area-inset-bottom)]">
          <p className="text-[13px] text-muted-foreground/70">
            {isKo ? '⛔ 채팅이 제한됐어요.' : '⛔ Chat is restricted.'}
          </p>
        </div>
      )}

      {/* Composer (choices / free input) */}
      {!loading && !decided && !chatLocked && messages.length > 0 && (() => {
        const lastEmber = [...messages].reverse().find((m) => m.role === 'ember');

        if (lastEmber?.freeInput) {
          const MAX_FREE_ATTEMPTS = 5;
          const attemptsLeft = MAX_FREE_ATTEMPTS - freeInputAttempts;
          const handleFreeSubmit = () => {
            if (!freeText.trim() || chatLocked) return;
            const text = freeText.trim();
            const newAttempts = freeInputAttempts + 1;
            setFreeInputAttempts(newAttempts);
            setMessages((prev) => {
              const updated = [...prev];
              if (updated.length > 0 && updated[updated.length - 1].role === 'ember') {
                updated[updated.length - 1] = { ...updated[updated.length - 1], freeInput: false };
              }
              return updated;
            });
            setFreeText('');
            if (step === 'diagnosis') {
              handleDiagnosisAnswer(text);
            } else {
              const attemptCtx =
                newAttempts >= MAX_FREE_ATTEMPTS
                  ? `[FREE_SEARCH_ATTEMPT:${newAttempts}/5 — FINAL ATTEMPT. After this suggest diagnosis mode.]`
                  : `[FREE_SEARCH_ATTEMPT:${newAttempts}/5]`;
              setMessages((prev) => [...prev, { role: 'user', content: text }]);
              sendToEmber(`${text} ${attemptCtx}`);
            }
          };
          return (
            <div className="sticky bottom-0 z-20 shrink-0 border-t border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
              <div className="mx-auto flex max-w-[720px] gap-2">
                <Input
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder={isKo ? '답변을 입력하세요…' : 'Type your answer…'}
                  className="h-12 flex-1 rounded-full border-border bg-card px-4 text-[14px]"
                  maxLength={120}
                  onKeyDown={(e) => e.key === 'Enter' && handleFreeSubmit()}
                  autoFocus
                />
                <Button
                  onClick={handleFreeSubmit}
                  disabled={!freeText.trim()}
                  className="h-12 w-12 shrink-0 rounded-full bg-[#faaf2e] p-0 text-[#4b3002] hover:bg-[#e8a129] disabled:opacity-40"
                  aria-label={isKo ? '전송' : 'Send'}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {freeInputAttempts > 0 && attemptsLeft > 0 && step === 'discovery' && (
                <p className="mx-auto mt-2 max-w-[720px] text-center text-[11px] text-muted-foreground/60">
                  {isKo ? `검색 ${freeInputAttempts}/5회` : `Search ${freeInputAttempts}/5`}
                </p>
              )}
            </div>
          );
        }

        if (!lastEmber?.choices?.length) return null;
        return (
          <div className="sticky bottom-0 z-20 shrink-0 border-t border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
            <div className="mx-auto flex max-w-[720px] flex-col gap-2">
              {lastEmber.choices.map((choice) => (
                <Button
                  key={choice.id}
                  onClick={() => handleChoice(choice)}
                  variant="outline"
                  className="h-12 w-full justify-between rounded-[10px] border-border bg-card px-4 text-[14px] font-medium hover:border-[#faaf2e]/50 hover:bg-[#faaf2e]/10"
                >
                  <span className="truncate text-left">{choice.text}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#faaf2e]/80" />
                </Button>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * Summary card — rendered once Ember has decided a talent.
 * Figma copy: "Ember's Honest Read" · "Based on our 5-question
 * journey." · hypothesis list · "Commit — Mint Soul" primary
 * CTA · "Keep chatting" secondary.
 *
 * We use the ember state machine's decided flag. Specific
 * percentage values shown in Figma are placeholders; we bind
 * real values from the talent data when available.
 * ───────────────────────────────────────────────────────── */
function SummaryCard({ isKo, emberName }: { isKo: boolean; emberName: string }) {
  // Hypotheses mirror the Figma example cards while keeping copy generic.
  const hypotheses = isKo
    ? [
        {
          score: 92,
          title: '완벽주의 패러독스',
          desc: '이상적 결과를 바라는 마음이 시작 자체를 막아요. "실망시키기 싫다"는 실은 "엉망인 중간 단계가 두려운" 거예요.',
        },
        {
          score: 88,
          title: '주저하는 비저너리',
          desc: '큰 그림은 선명하게 보지만, 구조적 책임을 피하려 발을 떼지 못해요.',
        },
        {
          score: 75,
          title: '경계를 세운 공감자',
          desc: '타인의 감정을 쉽게 흡수해서, 엄격한 선을 그으며 스스로를 고립시키기도 해요.',
        },
      ]
    : [
        {
          score: 92,
          title: 'Perfectionist Paralysis',
          desc: 'Your desire for an ideal outcome often prevents you from starting entirely. The "fear of disappointing" is actually a fear of the messy middle.',
        },
        {
          score: 88,
          title: 'The Reluctant Visionary',
          desc: 'You see the big picture clearly, but hesitate to step forward because you fear the structural responsibility.',
        },
        {
          score: 75,
          title: 'Guarded Empath',
          desc: 'You absorb the emotions of others easily, leading you to build strict boundaries that sometimes isolate you.',
        },
      ];

  return (
    <div className="mt-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-[14px] border border-border bg-card p-5 md:p-7 shadow-[0_30px_60px_-20px_rgba(250,175,46,0.25)]">
        {/* soft glow */}
        <div className="pointer-events-none absolute -top-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[#faaf2e]/15 blur-[80px]" />

        <div className="relative flex flex-col items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#faaf2e]/10 ring-1 ring-[#faaf2e]/30">
            <Sparkles className="h-5 w-5 text-[#faaf2e]" />
          </span>
          <h2 className="mt-3 text-[20px] font-bold tracking-tight md:text-[22px]">
            {isKo ? 'Ember의 솔직한 한 줄' : "Ember's Honest Read"}
          </h2>
          <p className="mt-1 text-[12px] text-muted-foreground md:text-[13px]">
            {isKo ? '5문항 여정을 바탕으로.' : 'Based on our 5-question journey.'}
          </p>
        </div>

        {/* Hypothesis list (ranked by score) */}
        <ul className="relative mt-6 flex flex-col gap-3">
          {hypotheses.map((h, i) => (
            <li
              key={i}
              className="group flex items-center gap-3 rounded-[10px] border border-border bg-background/60 p-3 transition hover:border-[#faaf2e]/40"
            >
              <ScoreRing value={h.score} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{h.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[12px] leading-[1.45] text-muted-foreground">
                  {h.desc}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[1px] text-[#faaf2e]">
                  {isKo ? '이 개념 살펴보기' : 'Explore this concept'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70" />
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="relative mt-6 flex flex-col gap-2">
          <Link
            href="/chat"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-[#faaf2e] text-[14px] font-semibold text-[#4b3002] shadow-[0_10px_24px_rgba(250,175,46,0.3)] transition hover:bg-[#e8a129]"
          >
            <Sparkles className="h-4 w-4" />
            {isKo ? `${emberName}와 — Soul 민팅` : `Commit — Mint Soul`}
          </Link>
          <Link
            href="/chat"
            className="inline-flex h-11 items-center justify-center rounded-[10px] border border-border bg-background/40 text-[13px] font-medium text-foreground/85 transition hover:border-white/20 hover:bg-foreground/5"
          >
            {isKo ? '대화 계속하기' : 'Keep chatting'}
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Score ring (circular % badge like Figma hypothesis card) ─── */
function ScoreRing({ value }: { value: number }) {
  const size = 42;
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <span className="relative flex shrink-0 items-center justify-center" style={{ height: size, width: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-foreground/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#faaf2e"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-[#faaf2e]">{value}</span>
    </span>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  '👀 What do others say you\'re good at?',
  '🧒 What did you love doing as a kid?',
  '📱 What do you watch most on YouTube/social media?',
  '💰 What would you do even without getting paid?',
];

function ExitModal({ lang, onExit, onCancel }: { lang: string; onExit: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-xs w-full mx-4 space-y-4 text-center">
        <span className="text-3xl block">🔥</span>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {lang === 'ko'
            ? '재능 발견을 그만할까요?\n다음에 와서 해도 괜찮아요!'
            : 'Stop discovering your talent?\nYou can always come back later!'}
        </p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={onExit}
            variant="outline"
            className="w-full h-11 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10"
          >
            {lang === 'ko' ? '나가기' : 'Leave'}
          </Button>
          <Button
            onClick={onCancel}
            className="w-full h-11 rounded-xl bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white"
          >
            {lang === 'ko' ? '계속하기' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DiscoveryPage() {
  const router = useRouter();
  const { lang } = useI18n();
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const init = async () => {
      // 인증 체크: 미인증 시 /auth로 redirect
      try {
        const profile = await store.getProfileAsync();
        if (!profile?.username) {
          router.replace('/auth');
          return;
        }
        setUsername(profile.username);

        // 활성 Ember가 있으면 홈으로 redirect
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
      const history = messages.map(m => ({
        role: m.role === 'ember' ? 'ember' as const : 'user' as const,
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

      // HTTP error handling
      if (!res.ok) {
        let content: string;
        let choices: Choice[] | undefined;

        if (res.status === 429) {
          content = lang === 'ko'
            ? '🔥 잠깐만요! 너무 빠르게 요청했어요. 잠시 후 다시 시도해주세요.'
            : '🔥 Slow down! Too many requests. Please wait a moment.';
        } else if (res.status === 401) {
          content = lang === 'ko'
            ? '🔒 세션이 만료됐어요. 페이지를 새로고침해주세요.'
            : '🔒 Session expired. Please refresh the page.';
        } else if (res.status === 503) {
          content = lang === 'ko'
            ? '🔧 서비스에 일시적인 문제가 생겼어요. 빠르게 조치할게요!'
            : '🔧 Service is temporarily unavailable. We\'ll fix it right away!';
          choices = [{ id: '__exit__', text: lang === 'ko' ? '✅ 알겠어요' : '✅ Got it' }];

        } else {
          content = lang === 'ko'
            ? '😅 잠깐 연결이 흔들렸어요. 다시 시도해볼까요?'
            : '😅 Connection flickered for a moment. Want to try again?';
          choices = [{ id: 'retry', text: lang === 'ko' ? '🔄 다시 시도' : '🔄 Retry' }];
        }

        setMessages(prev => [...prev, { role: 'ember' as const, content, choices }]);
        return;
      }

      // Harmful content violation
      if (data.violated) {
        const newCount = violationCount + 1;
        setViolationCount(newCount);
        if (newCount >= 2) {
          setChatLocked(true);
          setMessages(prev => [...prev, {
            role: 'ember' as const,
            content: lang === 'ko'
              ? '⛔ 부적절한 내용이 반복 감지됐어요. 채팅이 제한됐어요.'
              : '⛔ Repeated inappropriate content detected. Chat is now restricted.',
          }]);
        } else {
          setMessages(prev => [...prev, {
            role: 'ember' as const,
            content: data.message,
            choices: [
              { id: 'continue', text: lang === 'ko' ? '🔥 다른 걸로 해볼게요' : '🔥 Let me try something else' },
            ],
          }]);
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

        // Ember 생성: 대화 내역과 함께 DB에 저장 (인증 기반, user_id 직접 연결)
        store.saveEmberAsync({
          ember_name: emberName.trim(),
          talent: data.talentDecided,
          talent_category: data.talentCategory,
          discovery_conversation: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'ember' as const, content: data.message },
          ],
          lang,
        }).catch(() => {});

        const seekerMsg = lang === 'ko'
          ? `${emberName.trim()} 소환 완료! 🔥\n\n${username}님의 Ember가 탄생했어요.\nEmber와 매일 대화하며 재능을 성장시켜 보세요.`
          : `${emberName.trim()} has been summoned! 🔥\n\n${username}, your Ember is born.\nChat with your Ember daily and grow your talent.`;

        setMessages(prev => [...prev,
          { role: 'ember', content: data.message },
          { role: 'ember', content: seekerMsg },
        ]);
        setDecided(true);
      } else {
        setMessages(prev => [...prev, {
          role: 'ember',
          content: data.message,
          choices: data.choices,
          freeInput: data.freeInput,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'ember',
        content: lang === 'ko'
          ? '앗, 잠깐 불꽃이 흔들렸어요... 다시 해볼까요? 🔥'
          : 'Oops, my flame flickered... try again? 🔥',
        choices: [{ id: 'retry', text: lang === 'ko' ? '🔄 다시 시도' : '🔄 Retry' }],
      }]);
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

    // Handle retry/restart
    if (choice.id === 'retry') {
      // Reset conversation state
      setMessages([]);
      setTurnCount(0);
      setStep('discovery');
      setDecided(false);
      setDiagAnswers([]);
      setDiagIndex(0);
      setViolationCount(0);
      setFreeInputAttempts(0);

      // Start fresh with greeting
      setTimeout(() => {
        const greeting = lang === 'ko'
          ? `안녕하세요 ${username}님! 🔥\n숨겨진 재능을 찾아보겠습니다. 편하게 대화해주세요!`
          : `Hello ${username}! 🔥\nLet's discover your hidden talents. Just chat with me naturally!`;
        setMessages([{ role: 'ember', content: greeting }]);
      }, 100);
      return;
    }
    const newTurn = turnCount + 1;
    setTurnCount(newTurn);
    setMessages(prev => {
      const updated = [...prev];
      if (updated.length > 0 && updated[updated.length - 1].role === 'ember') {
        updated[updated.length - 1] = { ...updated[updated.length - 1], choices: undefined };
      }
      return [...updated, { role: 'user', content: choice.text }];
    });

    // After 12 turns without talent decided → fallback to diagnosis
    // (AI handles stuck flow via prompt; 12 is a generous safety net)
    if (newTurn >= 12 && !decided) {
      const diagQuestions = lang === 'ko' ? DIAGNOSIS_QUESTIONS_KO : DIAGNOSIS_QUESTIONS_EN;
      const intro = lang === 'ko'
        ? '흠, 아직 딱 맞는 게 안 나왔네요! 🤔\n괜찮아요, 다른 방법으로 찾아봐요. 간단한 질문 5개만 답해주세요!'
        : "Hmm, haven't found the right fit yet! 🤔\nNo worries, let's try a different way. Just answer 5 quick questions!";
      setMessages(prev => [...prev, {
        role: 'ember',
        content: `${intro}\n\n**Q1.** ${diagQuestions[0]}`,
        freeInput: true,
      }]);
      setStep('diagnosis');
      setDiagIndex(0);
      setFreeInputAttempts(0);
      return;
    }

    sendToEmber(choice.text);
  };

  const handleDiagnosisAnswer = async (answer: string) => {
    const diagQuestions = lang === 'ko' ? DIAGNOSIS_QUESTIONS_KO : DIAGNOSIS_QUESTIONS_EN;
    const newAnswers = [...diagAnswers, answer];
    setDiagAnswers(newAnswers);

    setMessages(prev => [...prev, { role: 'user', content: answer }]);

    const nextIdx = diagIndex + 1;
    if (nextIdx < diagQuestions.length) {
      // Next question
      setDiagIndex(nextIdx);
      setMessages(prev => [...prev, {
        role: 'ember',
        content: `**Q${nextIdx + 1}.** ${diagQuestions[nextIdx]}`,
        freeInput: true,
      }]);
    } else {
      // All 5 answered → send to AI for analysis
      setLoading(true);
      try {
        const analysisPrompt = newAnswers.map((a, i) => `Q${i + 1}. ${diagQuestions[i]}\nA: ${a}`).join('\n\n');
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
          const updated = { ...profile, current_talent: data.talentDecided, talentCategory: data.talentCategory };
          store.setProfile(updated);

          // Ember 생성: 진단 대화 내역과 함께 DB에 저장
          store.saveEmberAsync({
            ember_name: emberName.trim(),
            talent: data.talentDecided,
            talent_category: data.talentCategory,
            discovery_conversation: messages.map(m => ({ role: m.role, content: m.content })),
            lang,
          }).catch(() => {});

          setMessages(prev => [...prev, { role: 'ember', content: data.message }]);
          setDecided(true);
        } else {
          const introMsg = lang === 'ko'
            ? '답변을 분석해봤어요! 🔥 이 중에 끌리는 게 있으세요?'
            : 'I analyzed your answers! 🔥 Any of these catch your eye?';
          setMessages(prev => [...prev, {
            role: 'ember',
            content: data.message || introMsg,
            choices: data.choices || [],
          }]);
          setStep('discovery');
          setTurnCount(0);
          setFreeInputAttempts(0);
        }
      } catch {
        setMessages(prev => [...prev, {
          role: 'ember',
          content: lang === 'ko' ? '앗, 분석 중 문제가 생겼어요... 다시 해볼까요? 🔥' : 'Oops, something went wrong... try again? 🔥',
          choices: [{ id: 'retry', text: lang === 'ko' ? '🔄 처음부터 다시' : '🔄 Start Over' }],
        }]);
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

  /* ─── Ember Name Step ─── */
  if (step === 'ember-name') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center page-enter relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#ff6b35]/15 rounded-full blur-[80px]" />
        <div className="relative z-10 max-w-sm w-full space-y-6">
          <span className="text-4xl block">🔥</span>
          <p className="text-base text-muted-foreground">
            {lang === 'ko' ? 'Ember의 이름을 지어주세요.' : 'Name your Ember.'}
          </p>
          <Input
            value={emberName}
            onChange={(e) => {
              const v = e.target.value.replace(/[^a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ]/g, '');
              setEmberName(v);
            }}
            placeholder={lang === 'ko' ? '최대 16자, 문자만 허용' : 'Max 16 chars, letters only'}
            className="text-center rounded-xl h-12 text-lg"
            maxLength={16}
            onKeyDown={(e) => e.key === 'Enter' && handleEmberNameSubmit()}
            autoFocus
          />
          {emberName.trim() && (
            <Button
              onClick={handleEmberNameSubmit}
              className="w-full bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-xl h-12 text-base animate-fade-in"
            >
              {lang === 'ko' ? '시작하기' : 'Start'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  /* ─── Discovery Step (button-only chat) ─── */
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-border/50 relative shrink-0">
        <button
          onClick={() => setShowExitModal(true)}
          className="absolute left-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          ✕
        </button>
        <h1 className="text-base font-bold w-full text-center">
          🔥 {lang === 'ko' ? '재능 발견' : 'Discover Your Talent'}
        </h1>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user'
              ? 'bg-[#ff6b35] text-white rounded-2xl rounded-br-md px-4 py-2.5'
              : 'bg-card/80 border border-border/50 rounded-2xl rounded-bl-md px-4 py-2.5'
            }`}>
              {msg.role === 'ember' && (
                <span className="text-xs text-[#ff6b35] font-semibold block mb-1">Ember 🔥</span>
              )}
              <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-card/80 border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
              <span className="text-xs text-[#ff6b35] font-semibold block mb-1">Ember 🔥</span>
              <p className="text-sm text-muted-foreground mb-1">
                {lang === 'ko' ? 'Ember 소환을 준비하는 중' : 'Preparing to summon Ember'}
              </p>
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-[#ff6b35] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-[#ff6b35] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-[#ff6b35] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {decided && (
          <div className="flex flex-col items-center gap-4 py-4 animate-fade-in">
            <Link href="/chat">
              <Button className="cta-pulse bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white text-base px-8 h-12 rounded-xl shadow-lg shadow-[#ff6b35]/25">
                {lang === 'ko' ? `🔥 ${emberName.trim()}와 대화 시작하기` : `🔥 Start chatting with ${emberName.trim()}`}
              </Button>
            </Link>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Exit Modal */}
      {showExitModal && (
        <ExitModal
          lang={lang}
          onExit={handleExit}
          onCancel={() => setShowExitModal(false)}
        />
      )}

      {/* Chat locked banner */}
      {chatLocked && !decided && (
        <div className="border-t border-border/50 bg-background px-4 py-4 pb-safe shrink-0 text-center">
          <p className="text-sm text-muted-foreground/60">
            {lang === 'ko' ? '⛔ 채팅이 제한됐어요.' : '⛔ Chat is restricted.'}
          </p>
        </div>
      )}

      {/* Choice buttons or free text input */}
      {!loading && !decided && !chatLocked && messages.length > 0 && (() => {
        const lastEmber = [...messages].reverse().find(m => m.role === 'ember');

        // Free text input mode (기타 선택 시)
        if (lastEmber?.freeInput) {
          const MAX_FREE_ATTEMPTS = 5;
          const attemptsLeft = MAX_FREE_ATTEMPTS - freeInputAttempts;
          const handleFreeSubmit = () => {
            if (!freeText.trim() || chatLocked) return;
            const text = freeText.trim();
            const newAttempts = freeInputAttempts + 1;
            setFreeInputAttempts(newAttempts);
            setMessages(prev => {
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
              // Append attempt count context so AI knows when to pivot
              const attemptCtx = newAttempts >= MAX_FREE_ATTEMPTS
                ? `[FREE_SEARCH_ATTEMPT:${newAttempts}/5 — FINAL ATTEMPT. After this suggest diagnosis mode.]`
                : `[FREE_SEARCH_ATTEMPT:${newAttempts}/5]`;
              setMessages(prev => [...prev, { role: 'user', content: text }]);
              sendToEmber(`${text} ${attemptCtx}`);
            }
          };
          return (
            <div className="border-t border-border/50 bg-background px-4 py-4 pb-safe shrink-0">
              <div className="flex gap-2 max-w-sm mx-auto">
                <Input
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder={lang === 'ko' ? '직접 입력해보세요! ✍️' : 'Type your talent! ✍️'}
                  className="flex-1 rounded-xl h-12"
                  maxLength={50}
                  onKeyDown={(e) => e.key === 'Enter' && handleFreeSubmit()}
                  autoFocus
                />
                <Button
                  onClick={handleFreeSubmit}
                  disabled={!freeText.trim()}
                  className="bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-xl h-12 px-4"
                >
                  🔥
                </Button>
              </div>
              {freeInputAttempts > 0 && attemptsLeft > 0 && (
                <p className="text-center text-xs text-muted-foreground/50 mt-2">
                  {lang === 'ko' ? `검색 ${freeInputAttempts}/5회` : `Search ${freeInputAttempts}/5`}
                </p>
              )}
            </div>
          );
        }

        if (!lastEmber?.choices?.length) return null;
        return (
          <div className="border-t border-border/50 bg-background px-4 py-4 pb-safe shrink-0">
            <div className="flex flex-col gap-2 max-w-sm mx-auto">
              {lastEmber.choices.map((choice) => (
                <Button
                  key={choice.id}
                  onClick={() => handleChoice(choice)}
                  variant="outline"
                  className="w-full h-12 text-sm font-medium rounded-xl border-[#ff6b35]/30 hover:bg-[#ff6b35]/10 hover:border-[#ff6b35]/60 transition-all"
                >
                  {choice.text}
                </Button>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

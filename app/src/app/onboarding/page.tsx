'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useModal, usePhantom } from '@phantom/react-sdk';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { store, getSignMessage } from '@/lib/store';
import { getAuthParams } from '@/lib/wallet-auth';
import { getWalletCookie } from '@/lib/wallet-cookie';
import { FlameShape, EmberStage } from '@/components/ember/flame-shape';
import { Wordmark } from '@/components/ember/wordmark';
import { Eyebrow } from '@/components/ember/eyebrow';
import { EmberLine } from '@/components/ember/ember-line';

type Step =
  | 'hook'
  | 'rule'
  | 'wallet'
  | 'name'
  | 'timeLost'
  | 'envy'
  | 'talent'
  | 'ignite';

const STEPS: Step[] = ['hook', 'rule', 'wallet', 'name', 'timeLost', 'envy', 'talent', 'ignite'];

// Flame stage per step — grows dormant → eternal across the flow
const STEP_STAGE: Record<Step, EmberStage> = {
  hook: 'dormant',
  rule: 'dormant',
  wallet: 'sparked',
  name: 'sparked',
  timeLost: 'burning',
  envy: 'burning',
  talent: 'blazing',
  ignite: 'radiant',
};

function StepBars({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((s, i) => {
        const active = i === idx;
        const past = i < idx;
        return (
          <span
            key={s}
            className="h-0.75 rounded-full transition-all duration-500"
            style={{
              width: active ? 28 : 10,
              backgroundColor:
                active || past ? 'var(--ember)' : 'var(--rule-strong)',
              boxShadow: active ? '0 0 6px var(--ember-glow)' : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { lang } = useI18n();
  const isKo = lang === 'ko';

  const { open: openPhantomModal, isOpened: isPhantomOpened } = useModal();
  const { isConnected: phantomConnected, isConnecting: phantomConnecting } = usePhantom();

  const [step, setStep] = useState<Step>('hook');
  const [mounted, setMounted] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Collected data
  const [name, setName] = useState('');
  const [timeLost, setTimeLost] = useState('');
  const [envy, setEnvy] = useState('');
  const [talent, setTalent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Init — soft guard; don't force redirect if wallet cookie is missing,
  // onboarding can still collect data and prompt wallet at the wallet step.
  useEffect(() => {
    setMounted(true);
    const profile = store.getProfile();
    if (profile.display_name && (profile as Record<string, unknown>).current_talent) {
      router.replace('/today');
    }
  }, [router]);

  // Auto-focus name field when entering that step
  useEffect(() => {
    if (step === 'name') setTimeout(() => nameRef.current?.focus(), 50);
  }, [step]);

  const idx = STEPS.indexOf(step);
  const prevStep = useCallback(() => {
    if (idx > 0) setStep(STEPS[idx - 1]);
  }, [idx]);
  const nextStep = useCallback(() => {
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }, [idx]);

  // ── Wallet step ──
  // Phantom SDK manages the modal + provider selection itself. We just open it.
  const handleWalletConnect = useCallback(() => {
    setWalletError(null);
    setWalletConnecting('Phantom');
    openPhantomModal();
  }, [openPhantomModal]);

  // Release the busy lock when modal closes without a connection
  useEffect(() => {
    if (
      walletConnecting &&
      !isPhantomOpened &&
      !phantomConnecting &&
      !phantomConnected
    ) {
      setWalletConnecting(null);
    }
  }, [walletConnecting, isPhantomOpened, phantomConnecting, phantomConnected]);

  useEffect(() => {
    if (step === 'wallet' && phantomConnected) {
      const t = setTimeout(() => nextStep(), 400);
      return () => clearTimeout(t);
    }
  }, [step, phantomConnected, nextStep]);

  // ── Ignite: persist ember ──
  const handleIgnite = useCallback(async () => {
    if (submitting) return;
    if (!talent.trim()) return;
    setSubmitting(true);
    try {
      const wallet = getWalletCookie();
      const profile = store.getProfile();
      const updated = {
        ...profile,
        display_name: name.trim() || profile.display_name || 'friend',
        current_talent: talent.trim(),
      } as typeof profile;
      store.setProfile(updated);

      // Sync profile to server if wallet is present
      if (wallet) {
        try {
          const signMessageFn = getSignMessage();
          if (signMessageFn) {
            const auth = await getAuthParams(wallet, signMessageFn);
            await fetch('/api/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                wallet_address: wallet,
                display_name: name.trim(),
                current_talent: talent.trim(),
                ...auth,
              }),
            });
          }
        } catch {
          /* silent: local cache still holds profile */
        }
      }

      // Create ember record (best-effort; local profile is source of truth until wallet-bound)
      try {
        await fetch('/api/ember', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: (profile as Record<string, unknown>).email || `${wallet}@wallet.local`,
            ember_name: name.trim() || 'Ember',
            talent: talent.trim(),
            talent_category: 'Hybrid',
            discovery_conversation: [
              { role: 'user', key: 'timeLost', content: timeLost.trim() },
              { role: 'user', key: 'envy', content: envy.trim() },
              { role: 'user', key: 'talent', content: talent.trim() },
            ],
            lang: isKo ? 'ko' : 'en',
          }),
        });
      } catch {
        /* silent */
      }

      router.replace('/today');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, talent, name, timeLost, envy, isKo, router]);

  if (!mounted) return null;

  const flameSize = step === 'ignite' ? 200 : step === 'hook' || step === 'rule' ? 120 : 88;
  const breathe = STEP_STAGE[step] !== 'dormant';

  // Per-step CTA label (handoff copy, Ember voice)
  const ctaLabel = {
    hook: isKo ? '좋아, 계속' : 'I’m listening',
    rule: isKo ? '받아들일게' : 'I accept this',
    wallet: isKo ? '건너뛰기' : 'Skip for now',
    name: isKo ? '다음' : 'Continue',
    timeLost: isKo ? '다음' : 'Next',
    envy: isKo ? '다음' : 'Next',
    talent: isKo ? '그거야' : "That’s it",
    ignite: isKo ? '불을 붙이자' : 'Light the ember',
  }[step];

  const ctaDisabled =
    (step === 'name' && name.trim().length < 2) ||
    (step === 'timeLost' && timeLost.trim().length < 2) ||
    (step === 'envy' && envy.trim().length < 2) ||
    (step === 'talent' && talent.trim().length < 2) ||
    (step === 'ignite' && submitting);

  const onCTA = step === 'ignite' ? handleIgnite : step === 'wallet' ? nextStep : nextStep;

  return (
    <div
      data-landing-page
      className="relative flex min-h-dvh w-full flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--bg-0)', color: 'var(--fg)' }}
    >
      {/* Ambient halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[38%] h-130 w-130 -translate-x-1/2 -translate-y-1/2 opacity-60"
        style={{
          background:
            'radial-gradient(circle, var(--ember-glow) 0%, transparent 60%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-5">
        <button
          onClick={idx > 0 ? prevStep : () => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full transition"
          style={{ color: 'var(--fg-dim)' }}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Wordmark size="sm" accent={false} />
        <div className="w-9" />
      </header>

      {/* Step indicator */}
      <div className="relative z-10 flex justify-center pt-1 pb-6">
        <StepBars current={step} />
      </div>

      {/* Scene */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-start px-6 pb-8">
        <div className="mb-8 mt-2">
          <FlameShape
            stage={STEP_STAGE[step]}
            size={flameSize}
            breathe={breathe}
            rare={step === 'ignite'}
          />
        </div>

        <div className="w-full max-w-105">
          {step === 'hook' && (
            <SceneText
              eyebrow={isKo ? '시작' : 'the hook'}
              headline={isKo ? '너 안엔 이미 작은 불꽃 하나가 있어.' : "There’s already one small flame in you."}
              emphasis={isKo ? '같이 찾아보자.' : "Let’s find it."}
            />
          )}

          {step === 'rule' && (
            <>
              <SceneText
                eyebrow={isKo ? '규칙' : 'the rule'}
                headline={isKo ? '세 가지만 약속해.' : 'Only three rules.'}
              />
              <ul className="mt-6 space-y-3">
                {[
                  [isKo ? '하나의 ember.' : 'One ember.', isKo ? '한 번에 한 재능만 돌본다.' : 'One talent at a time.'],
                  [isKo ? '매일 한 줄.' : 'One line a day.', isKo ? '많이도, 길게도 아니게.' : 'Not more. Not longer.'],
                  [isKo ? '쓰면 그대로.' : 'What you write stays.', isKo ? '수정도, 삭제도 없어.' : 'No edits. No deletes.'],
                ].map(([a, b], i) => (
                  <li
                    key={i}
                    className="rounded-md px-4 py-3"
                    style={{
                      backgroundColor: 'var(--bg-1)',
                      border: '1px solid var(--rule)',
                    }}
                  >
                    <p className="font-display text-[15px]" style={{ color: 'var(--fg)' }}>
                      {a}
                    </p>
                    <p className="mt-0.5 text-[12.5px]" style={{ color: 'var(--fg-dim)' }}>
                      {b}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}

          {step === 'wallet' && (
            <>
              <SceneText
                eyebrow={isKo ? '지갑 연결' : 'connect your wallet'}
                headline={isKo ? '너의 불꽃은 온체인에 박힐 거야.' : 'Your ember will live on-chain.'}
                body={
                  isKo
                    ? '나중에 연결해도 돼. 지금은 건너뛸 수 있어.'
                    : 'You can connect later — skip if you prefer.'
                }
              />
              <div className="mt-7 flex flex-col gap-2.5">
                <WalletButton
                  name="Phantom"
                  loading={walletConnecting === 'Phantom' || phantomConnecting}
                  onClick={handleWalletConnect}
                />
              </div>
              {walletError && (
                <p className="mt-3 text-[12.5px]" style={{ color: 'var(--destructive)' }}>
                  {walletError}
                </p>
              )}
              <p className="mt-4 font-mono text-[10px] uppercase" style={{ letterSpacing: '0.24em', color: 'var(--fg-dimmer)' }}>
                {isKo ? '마케팅은 없어. 영원히.' : 'no marketing. ever.'}
              </p>
            </>
          )}

          {step === 'name' && (
            <>
              <SceneText
                eyebrow={isKo ? '이름' : 'your name'}
                headline={isKo ? '널 뭐라고 부르면 좋을까?' : 'What should I call you?'}
              />
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isKo ? '이름' : 'your name'}
                className="mt-6 w-full rounded-md border px-4 py-3.5 font-display text-[17px] outline-none"
                style={{
                  backgroundColor: 'var(--bg-1)',
                  borderColor: 'var(--rule-strong)',
                  color: 'var(--fg)',
                }}
              />
            </>
          )}

          {step === 'timeLost' && (
            <>
              <SceneText
                eyebrow={isKo ? '시간이 사라지는 것' : 'where time disappears'}
                headline={
                  isKo
                    ? `${name || '너'}아, 언제 시간이 사라져?`
                    : `${name || 'you'}, when does time disappear for you?`
                }
              />
              <div className="mt-6">
                <EmberLine
                  quote={'시간이 사라지는 데에는 이유가 있어.'}
                  translation={'Time disappears for a reason.'}
                  small
                  accent="teal"
                />
              </div>
              <textarea
                value={timeLost}
                onChange={(e) => setTimeLost(e.target.value)}
                placeholder={
                  isKo ? '언제 시간이 빠르게 흐르는지 몇 줄로…' : 'a few lines on when time flies…'
                }
                rows={3}
                className="mt-5 w-full resize-none rounded-md border px-4 py-3 font-display text-[15.5px] outline-none"
                style={{
                  backgroundColor: 'var(--bg-1)',
                  borderColor: 'var(--rule-strong)',
                  color: 'var(--fg)',
                }}
              />
            </>
          )}

          {step === 'envy' && (
            <>
              <SceneText
                eyebrow={isKo ? '부러움' : 'quiet envy'}
                headline={
                  isKo
                    ? '누구의 일이 너를 살짝 질투하게 해?'
                    : 'Whose work makes you a little jealous?'
                }
                body={
                  isKo
                    ? '존경하는 사람 말고. 조용히 부러운 사람.'
                    : 'not who you admire. who you quietly envy.'
                }
              />
              <div className="mt-6">
                <EmberLine
                  quote={'부러움은 방향이야. 손가락 같은 거.'}
                  translation={'Envy is a direction. Like a finger pointing.'}
                  small
                  accent="teal"
                />
              </div>
              <textarea
                value={envy}
                onChange={(e) => setEnvy(e.target.value)}
                placeholder={isKo ? '누가, 어떤 일이…' : 'who, and what work…'}
                rows={3}
                className="mt-5 w-full resize-none rounded-md border px-4 py-3 font-display text-[15.5px] outline-none"
                style={{
                  backgroundColor: 'var(--bg-1)',
                  borderColor: 'var(--rule-strong)',
                  color: 'var(--fg)',
                }}
              />
            </>
          )}

          {step === 'talent' && (
            <>
              <SceneText
                eyebrow={isKo ? '하나만' : 'one thing'}
                headline={isKo ? '그럼. 돌보고 싶은 그 하나는?' : 'So. What’s the one thing you want to tend?'}
              />
              {(timeLost || envy) && (
                <div className="mt-5 space-y-2">
                  {timeLost && (
                    <blockquote
                      className="rounded-md px-3 py-2 text-[12.5px]"
                      style={{
                        backgroundColor: 'var(--bg-1)',
                        color: 'var(--fg-dim)',
                        borderLeft: '2px solid var(--teal)',
                      }}
                    >
                      <span className="font-mono uppercase" style={{ letterSpacing: '0.2em', fontSize: 9.5, color: 'var(--fg-dimmer)' }}>
                        {isKo ? '시간이 사라질 때' : 'where time disappears'}
                      </span>
                      <br />
                      {timeLost}
                    </blockquote>
                  )}
                  {envy && (
                    <blockquote
                      className="rounded-md px-3 py-2 text-[12.5px]"
                      style={{
                        backgroundColor: 'var(--bg-1)',
                        color: 'var(--fg-dim)',
                        borderLeft: '2px solid var(--teal)',
                      }}
                    >
                      <span className="font-mono uppercase" style={{ letterSpacing: '0.2em', fontSize: 9.5, color: 'var(--fg-dimmer)' }}>
                        {isKo ? '부러움' : 'envy'}
                      </span>
                      <br />
                      {envy}
                    </blockquote>
                  )}
                </div>
              )}
              <input
                type="text"
                value={talent}
                onChange={(e) => setTalent(e.target.value)}
                placeholder={isKo ? '돌볼 재능 (한 단어나 한 구)' : 'the talent (a word or short phrase)'}
                className="mt-5 w-full rounded-md border px-4 py-3.5 font-display text-[17px] outline-none"
                style={{
                  backgroundColor: 'var(--bg-1)',
                  borderColor: 'var(--rule-strong)',
                  color: 'var(--fg)',
                }}
              />
            </>
          )}

          {step === 'ignite' && (
            <div className="flex flex-col items-center text-center">
              <Eyebrow spacing="wide" tone="ember">
                — {isKo ? '이게 너의 불꽃' : 'this is your flame'}
              </Eyebrow>
              <h1
                className="mt-4 font-display"
                style={{
                  fontSize: 'clamp(26px, 6vw, 32px)',
                  lineHeight: 1.2,
                  letterSpacing: '-0.025em',
                  color: 'var(--fg)',
                }}
              >
                {talent || (isKo ? '너의 재능' : 'your talent')}
              </h1>
              <div className="mt-6 max-w-90">
                <EmberLine
                  quote={
                    isKo
                      ? `${name || '친구'}아, 기회는 준비된 자에게 와. 매일 한 줄씩.`
                      : `${name || 'friend'} — opportunity comes to the ready. One line a day.`
                  }
                  translation={
                    isKo
                      ? 'opportunity comes to the ready.'
                      : '기회는 준비된 자에게 와.'
                  }
                  small
                  accent="ember"
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CTA footer */}
      <footer className="relative z-10 px-6 pb-10 pt-4">
        <button
          onClick={onCTA}
          disabled={ctaDisabled}
          className="relative flex h-14 w-full items-center justify-center gap-2 rounded-full font-mono text-[12px] uppercase transition disabled:opacity-40"
          style={{
            letterSpacing: '0.24em',
            backgroundColor: step === 'ignite' ? 'var(--ember)' : 'var(--bg-2)',
            color: step === 'ignite' ? 'var(--fg-on-ember)' : 'var(--fg)',
            border: step === 'ignite' ? 'none' : '1px solid var(--rule-strong)',
            boxShadow: step === 'ignite' ? '0 6px 18px rgba(201,80,45,0.3)' : 'none',
          }}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{ctaLabel}</span>
        </button>
        {step === 'wallet' && (
          <p
            className="mt-3 text-center font-mono text-[10px] uppercase"
            style={{ letterSpacing: '0.22em', color: 'var(--fg-dimmer)' }}
          >
            {isKo ? '스킵하면 나중에 연결하면 돼' : 'skip now, connect later'}
          </p>
        )}
      </footer>
    </div>
  );
}

function SceneText({
  eyebrow,
  headline,
  emphasis,
  body,
}: {
  eyebrow?: string;
  headline: string;
  emphasis?: string;
  body?: string;
}) {
  return (
    <div>
      {eyebrow && (
        <div className="mb-4">
          <Eyebrow spacing="wide">— {eyebrow}</Eyebrow>
        </div>
      )}
      <h1
        className="font-display"
        style={{
          fontSize: 'clamp(24px, 5.6vw, 32px)',
          lineHeight: 1.2,
          letterSpacing: '-0.025em',
          color: 'var(--fg)',
        }}
      >
        {headline}
        {emphasis && (
          <>
            {' '}
            <em style={{ color: 'var(--ember)', fontStyle: 'normal' }}>{emphasis}</em>
          </>
        )}
      </h1>
      {body && (
        <p
          className="mt-3 font-display"
          style={{
            fontSize: '15.5px',
            lineHeight: 1.55,
            color: 'var(--fg-dim)',
            letterSpacing: '-0.005em',
          }}
        >
          {body}
        </p>
      )}
    </div>
  );
}

function WalletButton({
  name,
  loading,
  onClick,
}: {
  name: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center justify-between rounded-md px-4 py-3.5 transition disabled:opacity-50"
      style={{
        backgroundColor: 'var(--bg-1)',
        border: '1px solid var(--rule-strong)',
        color: 'var(--fg)',
      }}
    >
      <span className="font-display text-[15px]">{name}</span>
      <span className="font-mono text-[10px] uppercase" style={{ letterSpacing: '0.2em', color: 'var(--fg-dim)' }}>
        {loading ? 'connecting…' : 'connect →'}
      </span>
    </button>
  );
}

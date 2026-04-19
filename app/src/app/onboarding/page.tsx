'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Loader2,
  Check,
  Flame,
  Wallet as WalletIcon,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { store, getSignMessage } from '@/lib/store';
import { getAuthParams } from '@/lib/wallet-auth';
import { getWalletCookie } from '@/lib/wallet-cookie';

type Step = 'name' | 'wallet' | 'ready';

const STEPS: Step[] = ['name', 'wallet', 'ready'];

/* ── Step indicator (sticky top) ── */
function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-[420px] items-center justify-center gap-2 px-4">
        {STEPS.map((s, i) => {
          const active = i === idx;
          const done = i < idx;
          return (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                active
                  ? 'w-8 bg-[#faaf2e] shadow-[0_0_8px_rgba(255,176,103,0.5)]'
                  : done
                  ? 'w-3 bg-[#faaf2e]/70'
                  : 'w-3 bg-[#4b3002]/60'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── Ember avatar that brightens across steps ── */
function EmberAvatar({
  intensity,
  size = 108,
}: {
  intensity: number; // 0..1
  size?: number;
}) {
  const glow = Math.max(0.15, intensity);
  const px = `${size}px`;
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: px, height: px }}
    >
      <div
        aria-hidden
        className="absolute inset-0 rounded-full blur-2xl transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle, rgba(250,175,46,${glow}) 0%, rgba(75,48,2,${
            glow * 0.6
          }) 50%, transparent 70%)`,
          opacity: glow,
        }}
      />
      <div
        className="relative flex h-full w-full items-center justify-center rounded-full border transition-all duration-700"
        style={{
          borderColor: `rgba(250,175,46,${0.2 + glow * 0.6})`,
          background: `radial-gradient(circle at 50% 60%, rgba(250,175,46,${
            glow * 0.18
          }) 0%, rgba(17,17,22,0.9) 70%)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <Image
          src="/ember-logo.png"
          alt="Ember"
          width={size}
          height={size}
          className="pointer-events-none select-none object-contain transition-[filter,opacity] duration-700"
          style={{
            opacity: 0.35 + glow * 0.65,
            filter: `brightness(${0.65 + glow * 0.55}) saturate(${0.6 + glow * 0.9})`,
          }}
          priority
        />
      </div>
    </div>
  );
}

/* ── Soft CSS confetti on step 3 arrival ── */
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2 + Math.random() * 1.5,
        size: 4 + Math.random() * 6,
        rot: Math.random() * 360,
        hue: i % 3 === 0 ? '#faaf2e' : i % 3 === 1 ? '#ffd27f' : '#ff9a3c',
      })),
    []
  );
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block rounded-[2px] opacity-80"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.6}px`,
            background: p.hue,
            transform: `rotate(${p.rot}deg)`,
            animation: `ember-confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes ember-confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.9; }
          100% { transform: translateY(110vh) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { lang } = useI18n();
  const isKo = lang === 'ko';

  const { connected, publicKey, select, connect, wallets, disconnect } = useWallet();

  const [step, setStep] = useState<Step>('name');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  /* ── Init: guard for wallet session, skip if already onboarded ── */
  useEffect(() => {
    const init = () => {
      setMounted(true);
      const wallet = getWalletCookie();
      if (!wallet) {
        router.replace('/');
        return;
      }
      const profile = store.getProfile();
      if (profile.display_name) {
        router.replace('/chat');
      }
    };
    init();
  }, [router]);

  /* ── Real-time nickname validation / availability ── */
  const trimmed = nickname.trim();
  const nicknameCount = nickname.length;
  const validation = useMemo(() => {
    if (!trimmed) return { state: 'idle' as const, message: '' };
    if (trimmed.length < 2) {
      return {
        state: 'invalid' as const,
        message: isKo ? '두 글자 이상 입력해 주세요.' : 'At least 2 characters.',
      };
    }
    if (nicknameCount > 20) {
      return {
        state: 'invalid' as const,
        message: isKo ? '최대 20자까지 가능해요.' : 'Max 20 characters.',
      };
    }
    if (!/^[\p{L}\p{N}_.\- ]+$/u.test(trimmed)) {
      return {
        state: 'invalid' as const,
        message: isKo ? '특수문자는 사용할 수 없어요.' : 'No special characters.',
      };
    }
    return {
      state: 'available' as const,
      message: isKo ? '사용할 수 있는 이름이에요' : 'Looks good',
    };
  }, [trimmed, nicknameCount, isKo]);

  /* ── Step 1 → Step 2: persist nickname, then move on ── */
  const handleNameContinue = useCallback(async () => {
    if (validation.state !== 'available' || saving) return;
    setSaving(true);
    try {
      const wallet = getWalletCookie();
      const profile = store.getProfile();
      const updated = { ...profile, display_name: trimmed };
      store.setProfile(updated);

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
                display_name: trimmed,
                ...auth,
              }),
            });
          }
        } catch {
          /* silent: local cache still holds name */
        }
      }

      setStep('wallet');
    } finally {
      setSaving(false);
    }
  }, [trimmed, validation.state, saving]);

  /* ── Step 2: wallet connect or skip ── */
  const phantom = useMemo(
    () => wallets?.find((w) => w.adapter.name === 'Phantom'),
    [wallets]
  );
  const solflare = useMemo(
    () => wallets?.find((w) => w.adapter.name === 'Solflare'),
    [wallets]
  );

  const handleWalletSelect = useCallback(
    async (name: 'Phantom' | 'Solflare') => {
      setWalletError(null);
      const w = wallets?.find((x) => x.adapter.name === name);
      if (!w) {
        setWalletError(isKo ? '지갑을 찾을 수 없어요.' : 'Wallet not found.');
        return;
      }
      if (w.readyState !== 'Installed') {
        setWalletError(
          isKo
            ? `${name} 확장프로그램이 설치되어 있지 않아요.`
            : `${name} extension is not installed.`
        );
        return;
      }
      try {
        setWalletConnecting(name);
        select(name as any);
        await connect();
        // Connection will trigger the useEffect below, which moves to 'ready'
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (/reject|denied|user/i.test(msg)) {
          setWalletError(
            isKo
              ? '지갑 연결이 취소되었어요.'
              : 'Wallet connection was cancelled.'
          );
        } else {
          setWalletError(
            isKo
              ? '지갑 연결 중 문제가 발생했어요.'
              : 'Something went wrong while connecting.'
          );
        }
        try {
          await disconnect();
        } catch {
          /* ignore */
        }
      } finally {
        setWalletConnecting(null);
      }
    },
    [wallets, select, connect, disconnect, isKo]
  );

  // Once a wallet is connected during onboarding, advance to step 3
  useEffect(() => {
    if (step === 'wallet' && connected && publicKey) {
      const t = setTimeout(() => setStep('ready'), 300);
      return () => clearTimeout(t);
    }
  }, [step, connected, publicKey]);

  const handleWalletSkip = useCallback(() => {
    setWalletError(null);
    setStep('ready');
  }, []);

  /* ── Step 3 actions ── */
  const handleStartConversation = useCallback(() => {
    router.push('/discovery');
  }, [router]);

  if (!mounted) return null;

  const intensity = step === 'name' ? 0.25 + Math.min(trimmed.length, 6) / 20 : step === 'wallet' ? 0.65 : 1;

  return (
    <div
      data-landing-page
      className="relative flex min-h-screen w-full flex-col bg-background text-foreground"
    >
      <StepIndicator current={step} />

      {/* Ambient amber glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[22%] h-64 w-64 -translate-x-1/2 rounded-full bg-[#faaf2e]/10 blur-[90px] transition-opacity duration-700"
        style={{ opacity: 0.3 + intensity * 0.6 }}
      />

      <main className="relative flex flex-1 items-start justify-center px-4 pb-10 pt-6 md:pt-10">
        <div className="relative w-full max-w-[420px]">
          {/* ────────── STEP 1: NAME ────────── */}
          {step === 'name' && (
            <section className="flex flex-col items-center text-center page-enter">
              <div className="mt-6 mb-8">
                <EmberAvatar intensity={intensity} size={108} />
              </div>

              <h1 className="text-[24px] font-bold leading-8 tracking-[-0.6px] text-foreground">
                {isKo ? 'Ember이 뭐라고 부를까?' : 'What should Ember call you?'}
              </h1>
              <p className="mt-2 text-[13px] font-medium leading-5 text-muted-foreground">
                {isKo ? 'What should Ember call you?' : 'Ember이 뭐라고 부를까?'}
              </p>

              {/* Nickname input */}
              <div className="mt-8 w-full">
                <div
                  className={`relative flex h-14 w-full items-center rounded-[14px] border bg-card/60 px-4 transition-colors ${
                    validation.state === 'invalid'
                      ? 'border-red-400/50'
                      : validation.state === 'available'
                      ? 'border-[#faaf2e]/60'
                      : 'border-border/70 focus-within:border-[#faaf2e]/60'
                  }`}
                >
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                    placeholder={isKo ? '닉네임을 입력해 주세요' : 'Your nickname'}
                    maxLength={20}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNameContinue();
                    }}
                    className="h-full flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/60"
                  />
                  {validation.state === 'available' && (
                    <Check className="h-4 w-4 text-[#faaf2e]" strokeWidth={2.5} />
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between px-1 text-[12px]">
                  <span
                    className={`transition-colors ${
                      validation.state === 'invalid'
                        ? 'text-red-400'
                        : validation.state === 'available'
                        ? 'text-[#faaf2e]'
                        : 'text-muted-foreground/60'
                    }`}
                  >
                    {validation.message || '\u00A0'}
                  </span>
                  <span className="font-medium text-muted-foreground/70">
                    {nicknameCount}/20
                  </span>
                </div>
              </div>

              {/* Continue CTA (bottom area) */}
              <div className="mt-auto w-full pt-16">
                <button
                  type="button"
                  onClick={handleNameContinue}
                  disabled={validation.state !== 'available' || saving}
                  className={`flex h-14 w-full items-center justify-center rounded-[14px] text-[15px] font-semibold tracking-tight transition-all ${
                    validation.state === 'available' && !saving
                      ? 'bg-[#faaf2e] text-[#4b3002] shadow-[0_0_24px_rgba(250,175,46,0.28)] hover:brightness-110'
                      : 'bg-card/60 text-muted-foreground/60'
                  }`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isKo ? '저장 중…' : 'Saving…'}
                    </>
                  ) : (
                    <>{isKo ? '계속하기' : 'Continue'}</>
                  )}
                </button>
              </div>
            </section>
          )}

          {/* ────────── STEP 2: WALLET ────────── */}
          {step === 'wallet' && (
            <section className="flex flex-col items-center text-center page-enter">
              <div className="mt-6 mb-8">
                <EmberAvatar intensity={intensity} size={108} />
              </div>

              <h1 className="text-[24px] font-bold leading-8 tracking-[-0.6px] text-foreground">
                {isKo ? 'Solana 지갑 연결.' : 'Connect your Solana wallet.'}
              </h1>
              <p className="mt-2 text-[13px] font-medium leading-5 text-muted-foreground">
                {isKo ? 'Connect your Solana wallet.' : 'Solana 지갑 연결.'}
              </p>
              <p className="mt-3 max-w-[300px] text-[13px] leading-[21px] text-muted-foreground">
                {isKo
                  ? '지금은 선택이에요. Soul을 민팅하기 전에 필요해요.'
                  : 'Optional now. Required before minting a Soul.'}
              </p>

              {walletError && (
                <div className="mt-5 flex w-full items-start gap-2 rounded-[10px] border border-[#faaf2e]/40 bg-[#4b3002]/40 p-3 text-left">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#faaf2e]" />
                  <p className="text-[12px] leading-snug text-foreground/90">
                    {walletError}
                  </p>
                </div>
              )}

              {/* Wallet options */}
              <div className="mt-8 flex w-full flex-col gap-3">
                <button
                  type="button"
                  onClick={() => handleWalletSelect('Phantom')}
                  disabled={
                    !phantom ||
                    phantom.readyState !== 'Installed' ||
                    walletConnecting !== null
                  }
                  className="group flex h-[72px] w-full items-center gap-4 rounded-[14px] border border-border bg-card/60 px-4 text-left transition-all hover:border-[#faaf2e]/60 hover:bg-card/80 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-background/60">
                    {phantom?.adapter.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={phantom.adapter.icon}
                        alt="Phantom"
                        className="h-8 w-8 rounded-xl"
                      />
                    ) : (
                      <WalletIcon className="h-5 w-5 text-[#faaf2e]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-[16px] font-semibold tracking-tight text-foreground">
                      Phantom
                    </div>
                    <div className="mt-0.5 text-[11px] font-bold uppercase tracking-[1.5px] text-[#faaf2e]">
                      {isKo ? '추천' : 'Recommended'}
                    </div>
                  </div>
                  {walletConnecting === 'Phantom' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleWalletSelect('Solflare')}
                  disabled={
                    !solflare ||
                    solflare.readyState !== 'Installed' ||
                    walletConnecting !== null
                  }
                  className="group flex h-[72px] w-full items-center gap-4 rounded-[14px] border border-border bg-card/60 px-4 text-left transition-all hover:border-[#faaf2e]/60 hover:bg-card/80 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-background/60">
                    {solflare?.adapter.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={solflare.adapter.icon}
                        alt="Solflare"
                        className="h-8 w-8 rounded-xl"
                      />
                    ) : (
                      <ShieldCheck className="h-5 w-5 text-[#faaf2e]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-[16px] font-semibold tracking-tight text-foreground">
                      Solflare
                    </div>
                  </div>
                  {walletConnecting === 'Solflare' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                  )}
                </button>
              </div>

              {/* Skip */}
              <div className="mt-10 w-full">
                <button
                  type="button"
                  onClick={handleWalletSkip}
                  disabled={walletConnecting !== null}
                  className="mx-auto block text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                >
                  {isKo ? '나중에 할게요' : "I'll do this later"}
                </button>
              </div>
            </section>
          )}

          {/* ────────── STEP 3: READY ────────── */}
          {step === 'ready' && (
            <section className="relative flex flex-col items-center text-center page-enter">
              <Confetti />

              <div className="mt-6 mb-8">
                <EmberAvatar intensity={1} size={160} />
              </div>

              <h1 className="text-[28px] font-bold leading-9 tracking-[-0.7px] text-foreground">
                {isKo ? 'Ember 만날 준비?' : 'Ready for Ember?'}
              </h1>
              <p className="mt-2 text-[14px] font-medium leading-5 text-muted-foreground">
                {isKo ? 'Ready for Ember?' : 'Ember 만날 준비?'}
              </p>

              <div className="mt-auto w-full pt-20">
                <button
                  type="button"
                  onClick={handleStartConversation}
                  className="flex h-16 w-full flex-col items-center justify-center rounded-[14px] bg-[#faaf2e] px-4 font-semibold tracking-tight text-[#4b3002] shadow-[0_0_32px_rgba(250,175,46,0.45)] transition-all hover:brightness-110"
                >
                  <span className="flex items-center gap-2 text-[16px] leading-5">
                    <Flame className="h-4 w-4" strokeWidth={2.5} />
                    {isKo ? '첫 대화 시작' : 'Start the first conversation'}
                  </span>
                  <span className="mt-0.5 text-[12px] font-medium opacity-80">
                    {isKo ? 'Start the first conversation' : '첫 대화 시작'}
                  </span>
                </button>

                <div className="mt-5 flex justify-center">
                  <Link
                    href="/dashboard"
                    className="text-[14px] font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    {isKo ? '대시보드로 이동' : 'Go to dashboard'}
                  </Link>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

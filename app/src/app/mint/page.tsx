'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useModal, usePhantom } from '@phantom/react-sdk';
import {
  ChevronLeft,
  Sparkles,
  CircleCheck,
  Lock,
  Wallet,
  Info,
  TriangleAlert,
  ShieldAlert,
  PenLine,
  Gem,
  Check,
  Copy,
  ExternalLink,
  Share2,
  Twitter,
  Flame,
} from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { store, getSignMessage } from '@/lib/store';
import { useDiscoveryGate } from '@/hooks/useDiscoveryGate';
import { getAuthParams } from '@/lib/wallet-auth';
import { handleSignatureError } from '@/lib/session-logout';

type Step = 'review' | 'confirm' | 'celebration';
type MintPhase = 'idle' | 'stage1' | 'stage2' | 'stage3' | 'done';

const CONFIDENCE = 92;
const COMMIT_DAYS = 25;

export default function MintPage() {
  const { isChecking } = useDiscoveryGate();
  const router = useRouter();
  const { t, lang } = useI18n();
  const isKo = lang === 'ko';
  const { open: openPhantomModal } = useModal();
  const { isConnected: connected, addresses } = usePhantom();
  // addresses[0] is always Solana — Provider was configured with `addressTypes: [AddressType.solana]`
  const publicKey = useMemo(() => addresses?.[0]?.address || null, [addresses]);

  const [step, setStep] = useState<Step>('review');
  const [phase, setPhase] = useState<MintPhase>('idle');
  const [current_talent, setCurrentTalent] = useState<string | undefined>();
  const [talentName, setTalentName] = useState<string>('');
  const [editingName, setEditingName] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ack1, setAck1] = useState(false);
  const [ack2, setAck2] = useState(false);
  const [copied, setCopied] = useState<'tx' | 'link' | null>(null);
  const [mintResult, setMintResult] = useState<{
    signature: string;
    mint_address: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const profile = store.getProfile();
    setCurrentTalent(profile.current_talent);
    setTalentName(profile.current_talent || (isKo ? '끊임없는 혁신가' : 'Relentless Innovator'));
  }, [isKo]);

  const walletShort = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : '—';

  const handleMint = useCallback(async () => {
    if (!connected || !publicKey) {
      setError(isKo ? '지갑을 먼저 연결해주세요' : 'Please connect your wallet first');
      return;
    }

    setError(null);
    setPhase('stage1');

    try {
      const profile = store.getProfile();
      const souls = await store.getSoulsAsync();
      const soul = souls[0] || null;

      const walletAddr = publicKey;
      let authFields: Record<string, unknown> = { wallet_address: walletAddr };
      const signMessageFn = getSignMessage();
      if (signMessageFn) {
        try {
          const auth = await getAuthParams(walletAddr, signMessageFn);
          authFields = { wallet_address: walletAddr, ...auth };
        } catch (e) {
          handleSignatureError(e, false);
        }
      }

      setPhase('stage2');

      const messages = store.getMessages?.() || [];
      const history = messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      }));
      const soulRes = await fetch('/api/soul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...authFields, history }),
      });
      const soulData = await soulRes.json();
      if (!soulRes.ok) throw new Error(soulData.error || 'Soul creation failed');
      const soulId = soulData.soul_id;
      if (!soulId) throw new Error('Soul creation did not return soul_id');

      const res = await fetch('/api/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...authFields, soul_id: soulId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mint failed');

      setPhase('stage3');

      setMintResult({
        signature: data.signature,
        mint_address: data.mint_address,
      });

      const newSoul = {
        label: soul?.label || talentName || 'Ember Soul',
        traits: soul?.traits || [],
        description: soul?.description || '',
        talentLabel: talentName || current_talent || 'Unknown',
        mintDate: new Date().toISOString().split('T')[0],
        stage: profile.ember_stage,
      };

      const wallet = publicKey;
      await store.addSoulAsync(newSoul, wallet);

      const updatedProfile = { ...profile, minted: true, current_talent: talentName };
      store.setProfile(updatedProfile);
      store.saveProfileAsync(updatedProfile);

      setPhase('done');
      setStep('celebration');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Mint failed';
      setError(message);
      setPhase('idle');
    }
  }, [current_talent, talentName, connected, publicKey, isKo]);

  const handleBack = () => {
    if (step === 'review') router.push('/chat');
    else if (step === 'confirm') setStep('review');
    else setStep('confirm');
  };

  const stepNumber = step === 'review' ? 1 : step === 'confirm' ? 2 : 3;
  const stepLabel = step === 'review'
    ? (isKo ? '영혼 검토' : 'Review Soul')
    : step === 'confirm'
      ? (isKo ? '약속 확인' : 'Confirm Commitment')
      : (isKo ? '축하합니다' : 'Celebration');

  const minting = phase !== 'idle' && phase !== 'done';

  const copy = async (val: string, which: 'tx' | 'link') => {
    try {
      await navigator.clipboard.writeText(val);
      setCopied(which);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* noop */
    }
  };

  if (!mounted || isChecking) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--ember)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{isKo ? '불러오는 중...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-landing-page
      className="relative flex min-h-screen w-full flex-col bg-background text-foreground"
    >
      {/* Ambient amber glow */}
      <div className="pointer-events-none absolute left-1/2 top-40 z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-[var(--ember)]/15 blur-[120px]" />

      {/* Sticky header */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-md">
        <button
          onClick={handleBack}
          disabled={minting}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground disabled:opacity-40"
          aria-label={isKo ? '뒤로' : 'Back'}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ember)]/12 ring-1 ring-[var(--ember)]/30">
            <Flame className="h-3.5 w-3.5 text-[var(--ember)]" />
          </span>
          <span className="text-[13px] font-semibold tracking-tight">{stepLabel}</span>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-border bg-card/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
          <span className="text-foreground">{stepNumber}</span>
          <span>/ 3</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-140 px-5 py-6 md:py-8 lg:py-10">
          {/* ────────────── STEP 1 · REVIEW ────────────── */}
          {step === 'review' && (
            <div className="space-y-5">
              {/* Identified trait card */}
              <section className="rounded-[14px] border border-border bg-card p-5">
                <p className="text-[13px] font-medium text-muted-foreground">
                  {isKo ? '발견된 핵심 특성' : 'Identified Core Trait'}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {editingName ? (
                    <Input
                      autoFocus
                      value={talentName}
                      onChange={(e) => setTalentName(e.target.value)}
                      onBlur={() => setEditingName(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingName(false);
                      }}
                      className="h-10 rounded-[10px] border-border bg-background text-[16px] font-semibold text-foreground"
                    />
                  ) : (
                    <>
                      <h2 className="flex-1 text-[18px] font-semibold leading-[22px] text-foreground">
                        {talentName || (isKo ? '끊임없는 혁신가' : 'Relentless Innovator')}
                      </h2>
                      <button
                        onClick={() => setEditingName(true)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
                        aria-label={isKo ? '수정' : 'Edit'}
                      >
                        <PenLine className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
                <p className="mt-3 text-[13px] leading-5 text-muted-foreground">
                  {isKo
                    ? '민팅 전에 이름을 다듬을 수 있어요. 민팅 후에는 체인에 영구적으로 기록됩니다.'
                    : 'You can refine this before minting. It will be permanently etched on-chain.'}
                </p>
              </section>

              {/* Ember confidence */}
              <section className="rounded-[14px] border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ember)]/12 ring-1 ring-[var(--ember)]/30">
                    <Sparkles className="h-4.5 w-4.5 text-[var(--ember)]" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] font-semibold text-foreground">
                        {isKo ? 'Ember의 확신' : "Ember's Confidence"}
                      </p>
                      <p className="text-[18px] font-bold text-[var(--ember)]">{CONFIDENCE}%</p>
                    </div>
                    <p className="mt-1 text-[12px] leading-[18px] text-muted-foreground">
                      {isKo
                        ? '5일간의 발견 여정 응답을 기반으로 한 높은 확신.'
                        : 'High certainty based on your responses over the 5-day discovery journey.'}
                    </p>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                      <div
                        className="h-full rounded-full bg-[var(--ember)] transition-[width] duration-700"
                        style={{ width: `${CONFIDENCE}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Why mint */}
              <section className="space-y-3">
                <p className="text-[13px] font-medium text-muted-foreground">
                  {isKo ? '왜 이 영혼을 민팅하나요?' : 'Why mint this Soul?'}
                </p>
                <div className="space-y-3">
                  <BulletRow
                    icon={<CircleCheck className="h-4 w-4 text-[var(--fg-on-ember)]" />}
                    title={isKo ? '영구 기록' : 'Permanent Record'}
                    desc={
                      isKo
                        ? '발견된 특성이 솔라나 블록체인에 안전하게 저장됩니다.'
                        : 'Your discovered trait securely stored on the Solana blockchain.'
                    }
                  />
                  <BulletRow
                    icon={<Lock className="h-4 w-4 text-[var(--fg-on-ember)]" />}
                    title={isKo ? '양도 불가 (SBT)' : 'Non-Transferable (SBT)'}
                    desc={
                      isKo
                        ? '오직 당신에게만 속하며 거래하거나 판매할 수 없습니다.'
                        : 'It belongs uniquely to you and cannot be traded or sold.'
                    }
                  />
                </div>
              </section>

              {/* Wallet row */}
              <section className="rounded-[14px] border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background ring-1 ring-border">
                    <Wallet className="h-4.5 w-4.5 text-foreground" />
                  </span>
                  <div className="flex-1">
                    <p className="text-[12px] text-muted-foreground">
                      {isKo ? '솔라나 지갑' : 'Solana Wallet'}
                    </p>
                    <p className="font-mono text-[14px] font-semibold text-foreground">
                      {connected ? walletShort : isKo ? '연결되지 않음' : 'Not connected'}
                    </p>
                  </div>
                  {!connected && (
                    <button
                      type="button"
                      onClick={() => openPhantomModal()}
                      className="h-9 rounded-full px-3 text-[12px] font-medium"
                      style={{
                        backgroundColor: 'var(--ember)',
                        color: 'var(--fg-on-ember)',
                      }}
                    >
                      {isKo ? '연결' : 'Connect'}
                    </button>
                  )}
                </div>
              </section>

              {/* Cost panel */}
              <section className="rounded-[14px] border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
                    <Info className="h-4.5 w-4.5 text-foreground" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] font-semibold text-foreground">
                        {isKo ? '민팅 비용' : 'Minting Cost'}
                      </p>
                      <p className="text-[18px] font-bold text-[var(--ember)]">$1.00 USDC</p>
                    </div>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {isKo ? '일회성 비용. 숨겨진 수수료 없음.' : 'One-time. No hidden fees.'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Insufficient / error */}
              {error && (
                <section className="rounded-[14px] border border-red-500/30 bg-red-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold text-red-500">
                        {isKo ? '잔액 부족' : 'Insufficient Balance'}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-[18px] text-red-500/90">{error}</p>
                    </div>
                  </div>
                </section>
              )}

              {/* CTA */}
              <div className="pt-2">
                <Button
                  onClick={() => {
                    if (!connected) {
                      setError(isKo ? '지갑을 먼저 연결해주세요' : 'Please connect your wallet first');
                      return;
                    }
                    setError(null);
                    setStep('confirm');
                  }}
                  disabled={!connected}
                  className="h-12 w-full rounded-full bg-[var(--ember)] text-[15px] font-semibold text-[var(--fg-on-ember)] shadow-[0_6px_18px_-6px_rgba(250,175,46,0.55)] transition hover:bg-[#e8a129] disabled:opacity-50"
                >
                  {isKo ? '약속으로 계속하기' : 'Continue to commit'}
                </Button>
                {!connected && (
                  <p className="mt-3 text-center text-[12px] text-muted-foreground">
                    {isKo ? '계속하려면 지갑을 연결하세요' : 'Connect wallet to continue'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ────────────── STEP 2 · CONFIRM ────────────── */}
          {step === 'confirm' && (
            <div className="space-y-5">
              <section className="rounded-[14px] border border-red-500/30 bg-red-500/8 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-500/30">
                    <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
                  </span>
                  <p className="flex-1 text-[14px] font-medium leading-5 text-foreground">
                    {isKo
                      ? '영혼은 거래할 수 없습니다. 한 번 민팅되면 영원히 당신의 것입니다.'
                      : "A Soul can't be traded. Once minted, it's yours — permanently."}
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <CheckRow
                  checked={ack1}
                  onToggle={() => setAck1((v) => !v)}
                  label={
                    isKo
                      ? '이것이 양도 불가능함을 이해합니다.'
                      : 'I understand this is non-transferable.'
                  }
                />
                <CheckRow
                  checked={ack2}
                  onToggle={() => setAck2((v) => !v)}
                  label={
                    isKo
                      ? `${COMMIT_DAYS}일간의 탐색에 전념하겠습니다.`
                      : `I commit to ${COMMIT_DAYS} days of exploration.`
                  }
                />
              </section>

              <section className="flex items-start gap-2 rounded-[14px] border border-border bg-card p-4">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-[12px] leading-[18px] text-muted-foreground">
                  {isKo
                    ? '확인하면 지갑 앱이 열려 트랜잭션에 서명합니다.'
                    : 'Confirming will open your wallet app to sign the transaction.'}
                </p>
              </section>

              {error && (
                <section className="rounded-[14px] border border-red-500/30 bg-red-500/10 p-4">
                  <p className="text-[13px] text-red-500">{error}</p>
                </section>
              )}

              <div className="pt-2">
                <Button
                  onClick={handleMint}
                  disabled={!ack1 || !ack2 || minting || !connected}
                  className="h-12 w-full rounded-full bg-[var(--ember)] text-[15px] font-semibold text-[var(--fg-on-ember)] shadow-[0_6px_18px_-6px_rgba(250,175,46,0.55)] transition hover:bg-[#e8a129] disabled:opacity-50"
                >
                  {minting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--fg-on-ember)] border-t-transparent" />
                      {phase === 'stage1'
                        ? isKo ? '서명 준비 중...' : 'Preparing signature...'
                        : phase === 'stage2'
                          ? isKo ? '영혼 초안 작성 중...' : 'Drafting soul...'
                          : isKo ? 'NFT 민팅 중...' : 'Minting NFT...'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      {isKo ? '지갑으로 서명' : 'Sign with wallet'}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ────────────── STEP 3 · CELEBRATION ────────────── */}
          {step === 'celebration' && (
            <div className="relative flex flex-col items-center pt-4 pb-2 text-center">
              {/* Particle glow backdrop */}
              <div className="pointer-events-none absolute left-1/2 top-4 h-64 w-64 -translate-x-1/2 rounded-full bg-[var(--ember)]/20 blur-[80px]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
                {Array.from({ length: 14 }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute block h-1 w-1 rounded-full bg-[var(--ember)] animate-soul-particle"
                    style={{
                      left: `calc(50% + ${Math.cos((i / 14) * Math.PI * 2) * 90}px)`,
                      top: `calc(60px + ${Math.sin((i / 14) * Math.PI * 2) * 90}px)`,
                      animationDelay: `${i * 120}ms`,
                      opacity: 0.8,
                    }}
                  />
                ))}
              </div>

              <style jsx>{`
                @keyframes soulMaterialize {
                  0% {
                    opacity: 0;
                    transform: scale(0.4) rotate(-18deg);
                    filter: blur(12px);
                  }
                  60% {
                    opacity: 1;
                    transform: scale(1.1) rotate(3deg);
                    filter: blur(0);
                  }
                  100% {
                    opacity: 1;
                    transform: scale(1) rotate(0deg);
                    filter: blur(0);
                  }
                }
                @keyframes soulPulse {
                  0%, 100% { box-shadow: 0 0 0 0 rgba(250, 175, 46, 0.55); }
                  50% { box-shadow: 0 0 0 18px rgba(250, 175, 46, 0); }
                }
                @keyframes soulParticle {
                  0% { opacity: 0; transform: scale(0.5) translateY(0); }
                  40% { opacity: 0.9; }
                  100% { opacity: 0; transform: scale(1.4) translateY(-24px); }
                }
                .animate-soul-materialize {
                  animation: soulMaterialize 900ms cubic-bezier(0.22, 1, 0.36, 1) both;
                }
                .animate-soul-pulse {
                  animation: soulPulse 2.2s ease-in-out infinite;
                }
                .animate-soul-particle {
                  animation: soulParticle 2.4s ease-out infinite;
                }
              `}</style>

              {/* Gem */}
              <div className="relative animate-soul-materialize">
                <div className="flex h-36 w-36 items-center justify-center rounded-full bg-linear-to-br from-[var(--ember)] via-[#f7c462] to-[var(--fg-on-ember)] animate-soul-pulse">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-background/20 ring-1 ring-white/20 backdrop-blur-sm">
                    <Gem className="h-12 w-12 text-white drop-shadow-[0_2px_12px_rgba(250,175,46,0.8)]" />
                  </div>
                </div>
              </div>

              {/* Trait name */}
              <h1 className="mt-7 text-[26px] font-bold tracking-tight text-foreground">
                {talentName || (isKo ? '회복력 있는 탐험가' : 'Resilient Explorer')}
              </h1>

              {/* Pills */}
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Pill>{isKo ? '민팅 완료' : 'Minted'}</Pill>
                <Pill>{isKo ? '영구적' : 'Permanent'}</Pill>
                <Pill>{isKo ? '당신의 것' : 'Yours'}</Pill>
              </div>

              {/* Transaction card */}
              {mintResult && (
                <section className="mt-6 w-full rounded-[14px] border border-border bg-card p-4 text-left">
                  <p className="text-[12px] text-muted-foreground">
                    {isKo ? '트랜잭션' : 'Transaction'}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <p className="truncate font-mono text-[14px] font-semibold text-foreground">
                      {mintResult.signature.slice(0, 4)}...{mintResult.signature.slice(-4)}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copy(mintResult.signature, 'tx')}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
                        aria-label={isKo ? '복사' : 'Copy'}
                      >
                        {copied === 'tx' ? (
                          <Check className="h-4 w-4 text-[var(--ember)]" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <a
                        href={`https://solscan.io/tx/${mintResult.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
                        aria-label="Solscan"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </section>
              )}

              {/* Actions */}
              <div className="mt-6 w-full space-y-3">
                <Link href="/ember" className="block">
                  <Button className="h-12 w-full rounded-full bg-[var(--ember)] text-[15px] font-semibold text-[var(--fg-on-ember)] shadow-[0_6px_18px_-6px_rgba(250,175,46,0.55)] transition hover:bg-[#e8a129]">
                    {isKo ? '영혼 갤러리에서 보기' : 'View in Soul Gallery'}
                  </Button>
                </Link>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const url = typeof window !== 'undefined' ? window.location.origin + '/ember' : '';
                      const text = isKo
                        ? `방금 나의 영혼을 민팅했어요: ${talentName}`
                        : `I just minted my Soul: ${talentName}`;
                      const href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                      window.open(href, '_blank', 'noopener,noreferrer');
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card text-[13px] font-medium text-foreground transition hover:bg-foreground/5"
                  >
                    <Twitter className="h-4 w-4" />
                    {isKo ? '공유' : 'Share'}
                  </button>
                  <button
                    onClick={() => {
                      const url = typeof window !== 'undefined' ? window.location.origin + '/ember' : '';
                      copy(url, 'link');
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card text-[13px] font-medium text-foreground transition hover:bg-foreground/5"
                  >
                    {copied === 'link' ? (
                      <Check className="h-4 w-4 text-[var(--ember)]" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                    {isKo ? '링크 복사' : 'Copy Link'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─── Sub-components ─── */

function BulletRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[14px] border border-border bg-card p-4">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ember)]">
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-[14px] font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-[12px] leading-[18px] text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function CheckRow({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-start gap-3 rounded-[14px] border p-4 text-left transition ${
        checked
          ? 'border-[var(--ember)]/60 bg-[var(--ember)]/10'
          : 'border-border bg-card hover:bg-foreground/5'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition ${
          checked ? 'border-[var(--ember)] bg-[var(--ember)]' : 'border-border bg-background'
        }`}
      >
        {checked && <Check className="h-3.5 w-3.5 text-[var(--fg-on-ember)]" strokeWidth={3} />}
      </span>
      <span className="flex-1 text-[14px] leading-5 text-foreground">{label}</span>
    </button>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--ember)]/40 bg-[var(--ember)]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ember)]">
      {children}
    </span>
  );
}

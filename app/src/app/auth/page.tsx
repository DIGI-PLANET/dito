'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, Sun, Moon, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useModal, usePhantom } from '@phantom/react-sdk';
import { useI18n } from '@/providers/i18n-provider';
import { FlameShape } from '@/components/ember/flame-shape';
import { Eyebrow } from '@/components/ember/eyebrow';

type Step = 'form' | 'otp';

export default function LoginPage() {
  const { lang, setLang } = useI18n();
  const isKo = lang === 'ko';
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { open: openPhantomModal, isOpened: isPhantomOpened } = useModal();
  const { isConnected: phantomConnected, isConnecting: phantomConnecting } = usePhantom();

  const [step, setStep] = useState<Step>('form');

  // form
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState<null | 'email' | 'wallet'>(null);
  const [error, setError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // otp
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [discoveryComplete, setDiscoveryComplete] = useState(false);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startTimer = (seconds: number) => {
    setTimer(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((p) => {
        if (p <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  };
  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((p) => {
        if (p <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  };

  const canSubmit =
    identifier.trim().length > 0 && password.length >= 6 && !busy;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setBusy('email');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (data.requiresOtp) {
        setResolvedEmail(data.email);
        setDiscoveryComplete(!!data.discoveryComplete);
        setStep('otp');
        startTimer(300);
        startCooldown(60);
      } else {
        router.push(data.discoveryComplete ? '/' : '/discovery');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setBusy(null);
    }
  };

  const handlePhantom = useCallback(() => {
    if (busy) return;
    setError(null);
    setBusy('wallet');
    openPhantomModal();
  }, [busy, openPhantomModal]);

  // Phantom modal closed without connecting → release the busy lock so the
  // user can try again. Once connected, route into discovery.
  useEffect(() => {
    if (busy === 'wallet' && !isPhantomOpened && !phantomConnecting && !phantomConnected) {
      setBusy(null);
    }
  }, [busy, isPhantomOpened, phantomConnecting, phantomConnected]);

  useEffect(() => {
    if (phantomConnected) {
      router.replace('/discovery');
    }
  }, [phantomConnected, router]);

  // ── OTP submit ──
  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setError(isKo ? '6자리 인증코드를 입력해.' : 'Enter the 6-digit code.');
      return;
    }
    setBusy('email');
    setError(null);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resolvedEmail, otp }),
      });
      if (res.ok) {
        router.push(discoveryComplete ? '/' : '/discovery');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Invalid code');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid code';
      setError(msg);
    } finally {
      setBusy(null);
    }
  };

  const resendOtp = async () => {
    if (cooldown > 0 || busy) return;
    setBusy('email');
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Resend failed');
      if (data.requiresOtp) {
        setOtp('');
        startTimer(300);
        startCooldown(60);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isKo ? '재발송에 실패했어.' : 'Failed to resend code.'
      );
    } finally {
      setBusy(null);
    }
  };

  const skipOtp = async () => {
    setBusy('email');
    setError(null);
    try {
      const res = await fetch('/api/auth/skip-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resolvedEmail }),
      });
      if (res.ok) router.push(discoveryComplete ? '/' : '/discovery');
      else throw new Error('Failed to skip OTP');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip OTP');
    } finally {
      setBusy(null);
    }
  };

  const formatTimer = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (!mounted) return null;

  // ──────────────────────────────────────────────────────
  // OTP step
  // ──────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <div
        className="relative flex min-h-full w-full flex-1 flex-col"
        style={{ backgroundColor: 'var(--bg-0)', color: 'var(--fg)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: 'var(--halo)' }}
        />

        <header
          className="sticky top-0 z-30 flex items-center justify-between px-5 pt-6 pb-3"
          style={{
            backgroundColor: 'color-mix(in oklab, var(--bg-0) 82%, transparent)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <button
            onClick={() => setStep('form')}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase"
            style={{ letterSpacing: '0.22em', color: 'var(--fg-dim)' }}
          >
            <ArrowLeft className="h-3 w-3" />
            {isKo ? '돌아가기' : 'Back'}
          </button>
          <div className="w-9" />
        </header>

        <main className="relative z-10 flex flex-1 flex-col items-center px-6 pt-2">
          <div className="mb-5">
            <FlameShape stage="burning" size={60} breathe />
          </div>
          <Eyebrow spacing="wide" tone="ember">
            — {isKo ? '인증 코드' : 'verification code'}
          </Eyebrow>
          <h1
            className="mt-3 font-display"
            style={{
              fontSize: 26,
              letterSpacing: '-0.025em',
              color: 'var(--fg)',
              textAlign: 'center',
            }}
          >
            {isKo ? `${resolvedEmail}로 보낸 6자리 코드` : `6-digit code sent to ${resolvedEmail}`}
          </h1>
          <p
            className="mt-3 font-display text-[13.5px] text-center"
            style={{ color: 'var(--fg-dim)' }}
          >
            {timer > 0
              ? isKo
                ? `${formatTimer(timer)} 안에 입력해.`
                : `Enter within ${formatTimer(timer)}.`
              : isKo ? '코드가 만료됐어. 다시 받아.' : 'Code expired. Resend.'}
          </p>

          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="mt-7 w-full max-w-70 rounded-2xl border text-center font-mono outline-none"
            style={{
              height: 56,
              fontSize: 24,
              letterSpacing: '0.4em',
              backgroundColor: 'var(--bg-1)',
              borderColor: 'var(--rule-strong)',
              color: 'var(--fg)',
              caretColor: 'var(--ember)',
            }}
          />

          {error && (
            <p
              className="mt-3 text-[12px]"
              style={{ color: 'var(--ember-bright)' }}
            >
              {error}
            </p>
          )}

          <button
            onClick={verifyOtp}
            disabled={otp.length !== 6 || !!busy}
            className="mt-6 flex h-13 w-full max-w-[320px] items-center justify-center gap-2 rounded-full font-medium transition disabled:opacity-30"
            style={{
              height: 52,
              backgroundColor: 'var(--ember)',
              color: 'var(--fg-on-ember)',
              fontSize: 14.5,
              letterSpacing: '0.02em',
              boxShadow: otp.length === 6 ? '0 6px 20px rgba(217,88,44,0.3)' : 'none',
            }}
          >
            {busy === 'email' && <Loader2 className="h-4 w-4 animate-spin" />}
            {isKo ? '확인' : 'Verify'}
          </button>

          <div className="mt-5 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={resendOtp}
              disabled={cooldown > 0 || !!busy}
              className="font-mono text-[10.5px] uppercase transition disabled:opacity-40"
              style={{
                letterSpacing: '0.2em',
                color: cooldown > 0 ? 'var(--fg-dimmer)' : 'var(--ember)',
              }}
            >
              {cooldown > 0
                ? `${isKo ? '재발송 가능까지' : 'resend in'} ${cooldown}s`
                : isKo ? '재발송' : 'resend code'}
            </button>
            <button
              type="button"
              onClick={skipOtp}
              disabled={!!busy}
              className="font-mono text-[10.5px] uppercase transition"
              style={{ letterSpacing: '0.2em', color: 'var(--fg-dim)' }}
            >
              {isKo ? '건너뛰고 진행' : 'skip and continue'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────
  // Form step (default)
  // ──────────────────────────────────────────────────────
  return (
    <div
      className="relative flex min-h-full w-full flex-1 flex-col"
      style={{ backgroundColor: 'var(--bg-0)', color: 'var(--fg)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: 'var(--halo)' }}
      />

      {/* Top chrome — sticky so it stays visible while content scrolls */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4.5 pt-6 pb-3"
        style={{
          backgroundColor: 'color-mix(in oklab, var(--bg-0) 82%, transparent)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-1.5 px-2 py-1.5 font-mono text-[9.5px] uppercase"
          style={{ letterSpacing: '0.22em', color: 'var(--fg-dim)' }}
        >
          <ArrowLeft className="h-3 w-3" />
          {isKo ? '돌아가기' : 'Back'}
        </Link>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-(--rule)"
            style={{ color: 'var(--fg-dim)' }}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Moon className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
          <button
            type="button"
            onClick={() => setLang(isKo ? 'en' : 'ko')}
            aria-label={isKo ? 'Switch to English' : '한국어로 변경'}
            className="rounded-full px-3 py-1.5 font-display text-[13px] transition hover:bg-(--rule)"
            style={{
              color: 'var(--fg-dim)',
              letterSpacing: isKo ? '-0.02em' : '-0.01em',
            }}
          >
            {isKo ? 'English' : '한국어'}
          </button>
        </div>
      </div>

      {/* Body */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex flex-1 flex-col px-6.5 pt-5"
      >
        {/* Hero */}
        <div className="mb-5.5 flex flex-col items-center">
          <div className="mb-4 opacity-90">
            <FlameShape stage="burning" size={60} breathe />
          </div>
          <h1
            className="font-display text-center"
            style={{
              fontSize: 26,
              fontWeight: 400,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              color: 'var(--fg)',
              margin: '8px 0 0',
            }}
          >
            {isKo ? '포털 진입' : 'Enter the Portal'}
          </h1>
        </div>

        {/* Identifier */}
        <div className="mb-3.5">
          <div
            className="mb-2 font-mono uppercase"
            style={{
              fontSize: 9.5,
              color: 'var(--fg-dimmer)',
              letterSpacing: '0.22em',
            }}
          >
            {isKo ? '아이디 또는 이메일' : 'Username or email'}
          </div>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@somewhere.com"
            autoComplete="username"
            spellCheck={false}
            className="w-full rounded-2xl border px-3.5 outline-none"
            style={{
              height: 48,
              backgroundColor: 'var(--bg-1)',
              borderColor: 'var(--rule-strong)',
              color: 'var(--fg)',
              fontSize: 15,
              caretColor: 'var(--ember)',
            }}
          />
        </div>

        {/* Password */}
        <div className="mb-2">
          <div
            className="mb-2 font-mono uppercase"
            style={{
              fontSize: 9.5,
              color: 'var(--fg-dimmer)',
              letterSpacing: '0.22em',
            }}
          >
            {isKo ? '비밀번호' : 'Password'}
          </div>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-2xl border outline-none"
              style={{
                height: 48,
                backgroundColor: 'var(--bg-1)',
                borderColor: 'var(--rule-strong)',
                color: 'var(--fg)',
                fontSize: 15,
                padding: '0 52px 0 14px',
                caretColor: 'var(--ember)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg"
              style={{ color: 'var(--fg-dim)' }}
            >
              {showPw ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>

          <div
            className="mt-2.5 font-display"
            style={{
              fontSize: 12,
              color: 'var(--fg-dimmer)',
              lineHeight: 1.5,
            }}
          >
            {isKo ? (
              <>
                비밀번호를 잃어버렸다면{' '}
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="underline"
                  style={{
                    color: 'var(--ember)',
                    textUnderlineOffset: 2,
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                  }}
                >
                  여기를 클릭
                </button>
                해.
              </>
            ) : (
              <>
                Forgot your password?{' '}
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="underline"
                  style={{
                    color: 'var(--ember)',
                    textUnderlineOffset: 2,
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                  }}
                >
                  Click here
                </button>
                .
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-2 text-[12px]" style={{ color: 'var(--ember-bright)' }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-full font-medium transition disabled:opacity-30"
          style={{
            height: 52,
            backgroundColor: 'var(--ember)',
            color: 'var(--fg-on-ember)',
            fontSize: 14.5,
            letterSpacing: '0.02em',
            boxShadow: canSubmit ? '0 6px 20px rgba(217,88,44,0.3)' : 'none',
          }}
        >
          {busy === 'email' && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy === 'email'
            ? isKo ? '들어가는 중…' : 'Signing in…'
            : isKo ? '로그인' : 'Sign in'}
        </button>

        {/* Divider */}
        <div className="my-4.5 flex items-center gap-3.5">
          <div className="flex-1" style={{ height: 1, backgroundColor: 'var(--rule)' }} />
          <span
            className="font-mono uppercase"
            style={{
              fontSize: 9.5,
              color: 'var(--fg-dimmer)',
              letterSpacing: '0.3em',
            }}
          >
            {isKo ? '또는' : 'or'}
          </span>
          <div className="flex-1" style={{ height: 1, backgroundColor: 'var(--rule)' }} />
        </div>

        {/* Phantom */}
        <button
          type="button"
          onClick={handlePhantom}
          disabled={!!busy}
          className="flex w-full items-center justify-center gap-2.5 rounded-full border transition disabled:opacity-50"
          style={{
            height: 52,
            backgroundColor: 'transparent',
            borderColor: 'var(--rule-strong)',
            color: 'var(--fg)',
            fontSize: 14,
            padding: '0 18px',
          }}
          onMouseEnter={(e) => {
            if (!busy) {
              e.currentTarget.style.borderColor = 'var(--teal)';
              e.currentTarget.style.color = 'var(--teal-bright)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--rule-strong)';
            e.currentTarget.style.color = 'var(--fg)';
          }}
        >
          {busy === 'wallet' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isKo ? 'Phantom 연결 중…' : 'Connecting Phantom…'}
            </>
          ) : (
            <>
              <PhantomGlyph theme={theme} />
              <span>
                {isKo ? (
                  <>
                    <b style={{ fontWeight: 600 }}>Phantom</b> 지갑으로 연결
                  </>
                ) : (
                  <>
                    Connect with <b style={{ fontWeight: 600 }}>Phantom</b>
                  </>
                )}
              </span>
            </>
          )}
        </button>

        <div className="flex-1" />

        {/* To signup */}
        <div className="flex flex-col items-center gap-1 py-4.5 pb-8">
          <Link
            href="/auth/signup"
            className="flex items-center gap-2 font-display"
            style={{
              fontSize: 13.5,
              color: 'var(--fg-dim)',
            }}
          >
            <span>{isKo ? '처음이야?' : 'New here?'}</span>
            <span style={{ color: 'var(--ember)' }}>
              {isKo ? 'Ember와 시작 →' : 'Start with Ember →'}
            </span>
          </Link>
        </div>
      </form>

      {forgotOpen && (
        <ForgotModal
          isKo={isKo}
          initialEmail={identifier}
          onClose={() => setForgotOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Forgot Password modal ────────────────────────────────
function ForgotModal({
  isKo,
  initialEmail,
  onClose,
}: {
  isKo: boolean;
  initialEmail: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(initialEmail || '');
  const [stage, setStage] = useState<'ask' | 'sending' | 'sent'>('ask');
  const [error, setError] = useState<string | null>(null);
  const validEmail = /\S+@\S+\.\S+/.test(email);

  const send = async () => {
    if (!validEmail || stage === 'sending') return;
    setError(null);
    setStage('sending');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Always show "sent" — don't leak whether the email exists.
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = (data as { error?: string })?.error;
        // Only block on validation errors; leak-prevention treats other errors as success.
        if (msg && /invalid|missing|required/i.test(msg)) {
          setError(msg);
          setStage('ask');
          return;
        }
      }
      setStage('sent');
    } catch {
      setStage('sent');
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-100 flex items-end justify-center"
      style={{
        backgroundColor: 'rgba(0,0,0,0.62)',
        backdropFilter: 'blur(6px)',
        animation: 'modalFade 200ms ease-out',
      }}
    >
      <style>{`
        @keyframes modalFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlide {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full px-6.5 pt-5 pb-8"
        style={{
          backgroundColor: 'var(--bg-1)',
          borderTop: '1px solid var(--rule-strong)',
          borderRadius: '24px 24px 0 0',
          animation: 'modalSlide 280ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <div
          className="mx-auto mb-4.5"
          style={{
            width: 36,
            height: 4,
            borderRadius: 4,
            backgroundColor: 'var(--rule-strong)',
          }}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ color: 'var(--fg-dim)' }}
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {stage !== 'sent' ? (
          <>
            <Eyebrow spacing="wide" tone="ember">
              — {isKo ? '비밀번호 재설정' : 'Reset password'}
            </Eyebrow>
            <h2
              className="mt-3 font-display"
              style={{
                fontSize: 22,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: 'var(--fg)',
                margin: '12px 0 8px',
                fontWeight: 400,
              }}
            >
              {isKo ? '재설정 링크를 보내줘.' : 'Send me a reset link.'}
            </h2>
            <p
              className="font-display"
              style={{
                fontSize: 13,
                color: 'var(--fg-dim)',
                margin: '0 0 20px',
                lineHeight: 1.5,
              }}
            >
              {isKo
                ? '일회용 링크를 이메일로 보낼게. 30분 동안 유효해.'
                : "We’ll email a one-time link. Valid for 30 minutes."}
            </p>

            <div
              className="mb-2 font-mono uppercase"
              style={{
                fontSize: 9.5,
                color: 'var(--fg-dimmer)',
                letterSpacing: '0.22em',
              }}
            >
              {isKo ? '이메일' : 'Email'}
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@somewhere.com"
              autoFocus
              className="mb-4 w-full rounded-2xl border px-3.5 outline-none"
              style={{
                height: 48,
                backgroundColor: 'var(--bg-2)',
                borderColor: 'var(--rule-strong)',
                color: 'var(--fg)',
                fontSize: 15,
                caretColor: 'var(--ember)',
              }}
            />

            {error && (
              <p className="mb-3 text-[12px]" style={{ color: 'var(--ember-bright)' }}>
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={send}
              disabled={!validEmail || stage === 'sending'}
              className="flex w-full items-center justify-center gap-2 rounded-full font-medium transition disabled:opacity-30"
              style={{
                height: 50,
                backgroundColor: 'var(--ember)',
                color: 'var(--fg-on-ember)',
                fontSize: 14,
                letterSpacing: '0.02em',
              }}
            >
              {stage === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
              {stage === 'sending'
                ? isKo ? '보내는 중…' : 'Sending…'
                : isKo ? '재설정 링크 보내기' : 'Send reset link'}
            </button>
          </>
        ) : (
          <div className="px-0 pt-1.5 pb-1 text-center">
            <div
              className="mx-auto mb-4 flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: 'var(--ember-soft)',
                border: '1px solid var(--ember)',
              }}
            >
              <Mail className="h-6 w-6" style={{ color: 'var(--ember)' }} />
            </div>
            <Eyebrow spacing="wide" tone="ember">
              — {isKo ? '발송됨' : 'Sent'}
            </Eyebrow>
            <h2
              className="mt-2.5 font-display"
              style={{
                fontSize: 22,
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                color: 'var(--fg)',
                margin: '10px 0 8px',
                fontWeight: 400,
              }}
            >
              {isKo ? '메일함을 확인해.' : 'Check your inbox.'}
            </h2>
            <p
              className="font-display"
              style={{
                fontSize: 13.5,
                color: 'var(--fg-dim)',
                margin: '0 0 6px',
                lineHeight: 1.5,
              }}
            >
              {isKo ? '재설정 링크를 보냈어' : 'We sent a reset link to'}
            </p>
            <p
              className="font-mono"
              style={{
                fontSize: 13,
                color: 'var(--fg)',
                margin: '0 0 22px',
                wordBreak: 'break-all',
              }}
            >
              {email}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full border font-medium"
              style={{
                height: 50,
                borderColor: 'var(--rule-strong)',
                color: 'var(--fg)',
                fontSize: 14,
                letterSpacing: '0.02em',
                backgroundColor: 'transparent',
              }}
            >
              {isKo ? '로그인으로' : 'Back to sign in'}
            </button>
            <p
              className="mt-3.5"
              style={{
                fontSize: 11.5,
                color: 'var(--fg-dimmer)',
                lineHeight: 1.5,
              }}
            >
              {isKo
                ? '못 받았어? 스팸함 확인하거나 잠시 후 다시 시도해.'
                : "Didn’t get it? Check spam, or wait a minute and try again."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Phantom brand mark — official SVG, theme-aware
//   light → purple variant
//   dark  → white variant (purple is too low-contrast on navy)
function PhantomGlyph({ theme }: { theme?: string }) {
  const src = theme === 'dark' ? '/phantom-white.svg' : '/phantom-purple.svg';
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={22}
      height={22}
      aria-hidden
      style={{ flexShrink: 0, display: 'block' }}
    />
  );
}

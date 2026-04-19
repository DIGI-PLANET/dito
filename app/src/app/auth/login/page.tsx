'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Mail,
  RefreshCw,
  CircleAlert,
} from 'lucide-react';

type Step = 'form' | 'otp';

export default function LoginPage() {
  const { lang } = useI18n();
  const isKo = lang === 'ko';
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');

  // 로그인 폼 데이터
  const [formData, setFormData] = useState({
    identifier: '', // 이메일 또는 사용자명
    password: '',
  });
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [discoveryComplete, setDiscoveryComplete] = useState(false);

  // OTP 관련
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startTimer = (seconds: number) => {
    setTimer(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const validateForm = () => {
    if (!formData.identifier.trim()) {
      return isKo ? '이메일 주소 또는 사용자명을 입력해주세요.' : 'Please enter your email or username.';
    }
    if (!formData.password) {
      return isKo ? '비밀번호를 입력해주세요.' : 'Please enter your password.';
    }
    return null;
  };

  const handleLogin = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.requiresOtp) {
        setResolvedEmail(data.email);
        setDiscoveryComplete(data.discoveryComplete);
        setStep('otp');
        startTimer(300); // 5분
        startCooldown(60);
      } else {
        // OTP 없이 바로 로그인 완료 — Ember 여부에 따라 분기
        router.push(data.discoveryComplete ? '/' : '/discovery');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const skipOtpAndComplete = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/skip-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resolvedEmail }),
      });

      if (res.ok) {
        router.push(discoveryComplete ? '/' : '/discovery');
      } else {
        throw new Error('Failed to skip OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to skip OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError(isKo ? '6자리 인증코드를 입력해주세요.' : 'Please enter 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');

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
        throw new Error(data.error || 'Invalid OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Resend failed');
      if (data.requiresOtp) {
        setResolvedEmail(data.email);
        setDiscoveryComplete(data.discoveryComplete);
        setOtp('');
        startTimer(300);
        startCooldown(60);
      }
    } catch (err: any) {
      setError(
        err.message || (isKo ? '재발송에 실패했습니다.' : 'Failed to resend code.'),
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /* ─────────────── Form step ─────────────── */
  if (step === 'form') {
    return (
      <div data-landing-page className="relative min-h-screen w-full bg-background text-foreground">
        <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-[52px] w-full max-w-[420px] items-center gap-3 px-4">
            <Link
              href="/auth"
              aria-label={isKo ? '뒤로가기' : 'Back'}
              className="inline-flex h-8 w-8 -ml-1 items-center justify-center rounded-full text-foreground/85 transition hover:bg-foreground/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="text-[14px] font-medium">
              {isKo ? '로그인' : 'Sign In'}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[420px] px-4 pt-4 pb-10 page-enter">
          <div className="relative overflow-hidden rounded-[14px] border border-border bg-card px-5 pt-6 pb-5 shadow-sm">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-[#faaf2e]/12 to-transparent"
            />
            <div className="relative">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#faaf2e]/15 ring-1 ring-[#faaf2e]/30">
                <KeyRound className="h-5 w-5 text-[#faaf2e]" />
              </div>
              <h1 className="text-center text-[20px] font-bold tracking-tight text-foreground">
                {isKo ? '다시 만나요.' : 'Welcome back.'}
              </h1>
              <p className="mt-1 text-center text-[12px] font-medium text-muted-foreground">
                {isKo ? 'Welcome back.' : '다시 만나요.'}
              </p>

              <div className="mt-6 space-y-3">
                <Input
                  type="text"
                  placeholder={isKo ? '이메일 또는 사용자명' : 'Email or username'}
                  value={formData.identifier}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, identifier: e.target.value }))
                  }
                  disabled={loading}
                  className="h-11 rounded-[10px] bg-muted/40"
                />
                <Input
                  type="password"
                  placeholder={isKo ? '비밀번호' : 'Password'}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  disabled={loading}
                  className="h-11 rounded-[10px] bg-muted/40"
                />
              </div>

              {error && (
                <div className="mt-3 flex items-start gap-2 rounded-[10px] bg-red-500/10 px-3 py-2 text-xs text-red-500">
                  <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleLogin}
                disabled={loading}
                className="mt-4 h-11 w-full rounded-[10px] bg-[#faaf2e] text-sm font-semibold text-[#4b3002] shadow-[0_6px_14px_rgba(250,175,46,0.25)] hover:bg-[#e89f28] disabled:opacity-60"
              >
                {loading
                  ? isKo ? '로그인 중...' : 'Signing in...'
                  : isKo ? '로그인 / Sign In' : 'Sign In / 로그인'}
              </Button>

              <div className="mt-3 text-center">
                <Link
                  href="/auth/forgot-password"
                  className="text-[12px] text-muted-foreground transition hover:text-foreground/85"
                >
                  {isKo ? '비밀번호를 잊으셨나요?' : 'Forgot your password?'}
                </Link>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[12px] text-muted-foreground">
            {isKo ? '계정이 없나요? ' : "Don't have an account? "}
            <Link href="/auth/signup" className="font-medium text-[#faaf2e] hover:underline">
              {isKo ? '새 계정 만들기' : 'Create new account'}
            </Link>
          </p>
        </main>
      </div>
    );
  }

  /* ─────────────── OTP step ─────────────── */
  const maskedEmail = resolvedEmail
    ? resolvedEmail.replace(/^(.{2}).*(@.*)$/, '$1•••$2')
    : '';

  return (
    <div data-landing-page className="relative min-h-screen w-full bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-[52px] w-full max-w-[420px] items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => {
              setStep('form');
              setOtp('');
              setError('');
              if (timerRef.current) clearInterval(timerRef.current);
              if (cooldownRef.current) clearInterval(cooldownRef.current);
            }}
            aria-label={isKo ? '뒤로가기' : 'Back'}
            className="inline-flex h-8 w-8 -ml-1 items-center justify-center rounded-full text-foreground/85 transition hover:bg-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-[14px] font-medium">
            {isKo ? '본인 인증' : 'Verify'}
          </span>
          {timer > 0 && (
            <span className="ml-auto inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-0.5 font-mono text-[11px] text-[#faaf2e]">
              {formatTimer(timer)}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[420px] px-4 pt-4 pb-10 page-enter">
        <div className="relative overflow-hidden rounded-[14px] border border-border bg-card p-6 shadow-sm">
          <ShieldCheck
            className="pointer-events-none absolute right-4 top-8 h-28 w-28 text-foreground/5"
            strokeWidth={1.2}
          />

          <div className="relative flex flex-col items-center gap-1 pb-5">
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-[#faaf2e]/15 ring-1 ring-[#faaf2e]/30">
              <ShieldCheck className="h-5 w-5 text-[#faaf2e]" strokeWidth={2.2} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              {isKo ? '입장을 지키자.' : 'Protect your entry.'}
            </h1>
            <p className="max-w-[300px] text-center text-xs text-muted-foreground">
              {isKo
                ? '인증 앱 또는 이메일로 전송된 6자리 코드를 입력하세요.'
                : 'Enter the 6-digit code from your authenticator app or email.'}
            </p>
          </div>

          {/* Email where code was sent */}
          {resolvedEmail && (
            <div className="mb-4 flex items-center gap-2 rounded-[10px] border border-border bg-muted/40 px-3 py-2">
              <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <code className="flex-1 truncate font-mono text-xs text-foreground/80">
                {maskedEmail}
              </code>
            </div>
          )}

          {/* OTP input */}
          <div className="space-y-2">
            <p className="text-center text-xs text-muted-foreground">
              {isKo ? '6자리 인증코드' : '6-digit verification code'}
            </p>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={loading}
              className="h-14 rounded-[10px] border-border bg-muted/40 text-center font-mono text-2xl font-semibold tracking-[0.6em] focus:border-[#faaf2e] focus:ring-1 focus:ring-[#faaf2e]"
              maxLength={6}
              autoFocus
            />
            {error && (
              <div className="flex items-start gap-2 rounded-[10px] bg-red-500/10 px-3 py-2 text-xs text-red-500">
                <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Verify button */}
          <Button
            onClick={verifyOTP}
            disabled={loading || otp.length !== 6}
            className="mt-5 h-12 w-full rounded-[10px] bg-[#faaf2e] text-sm font-semibold text-[#4b3002] shadow-[0_6px_14px_rgba(250,175,46,0.25)] hover:bg-[#e89f28] disabled:bg-muted/60 disabled:text-muted-foreground disabled:shadow-none"
          >
            {loading
              ? isKo ? '확인 중...' : 'Verifying...'
              : isKo ? '확인 후 이동 / Verify & continue' : 'Verify & continue / 확인 후 이동'}
          </Button>

          {/* Skip option */}
          <Button
            onClick={skipOtpAndComplete}
            variant="ghost"
            disabled={loading}
            className="mt-2 h-10 w-full rounded-[10px] text-xs text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          >
            {isKo ? '건너뛰고 로그인' : 'Skip and sign in'}
          </Button>

          {/* Resend row */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs">
            <span className="text-muted-foreground">
              {isKo ? '코드를 받지 못했나요?' : "Didn't receive a code?"}
            </span>
            <button
              type="button"
              onClick={resendOtp}
              disabled={loading || cooldown > 0}
              className="inline-flex items-center gap-1 font-medium text-[#faaf2e] transition hover:text-[#e89f28] disabled:cursor-not-allowed disabled:text-muted-foreground"
            >
              <RefreshCw className={['h-3 w-3', loading && 'animate-spin'].filter(Boolean).join(' ')} />
              {cooldown > 0
                ? isKo
                  ? `재발송 (${cooldown}초)`
                  : `Resend in ${cooldown}s`
                : isKo
                  ? '다시 발송'
                  : 'Resend'}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          {isKo ? '문제가 있나요? ' : 'Having trouble? '}
          <Link href="/auth" className="font-medium text-foreground hover:underline">
            {isKo ? '다시 로그인' : 'Sign in again'}
          </Link>
        </p>
      </main>
    </div>
  );
}

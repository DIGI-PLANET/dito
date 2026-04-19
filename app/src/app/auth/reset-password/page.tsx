'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Eye, EyeOff, Flame, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';

type Step = 'form' | 'success' | 'error';

function ResetPasswordContent() {
  const { lang } = useI18n();
  const isKo = lang === 'ko';
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [step, setStep] = useState<Step>(token ? 'form' : 'error');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  const strengthScore = Object.values(passwordChecks).filter(Boolean).length; // 0..4
  const passwordValid = strengthScore === 4;
  const passwordsMatch = password === passwordConfirm && passwordConfirm.length > 0;

  const strengthLabel = (() => {
    if (password.length === 0) return '';
    if (strengthScore <= 1) return isKo ? '매우 약함' : 'Very weak';
    if (strengthScore === 2) return isKo ? '약함' : 'Weak';
    if (strengthScore === 3) return isKo ? '보통' : 'Fair';
    return isKo ? '강함' : 'Strong';
  })();

  const handleSubmit = async () => {
    if (!passwordValid) {
      setError(isKo ? '비밀번호 조건을 확인해주세요.' : 'Please check password requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError(isKo ? '비밀번호가 일치하지 않습니다.' : 'Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 && (data.error?.includes('expired') || data.error?.includes('Invalid'))) {
          setStep('error');
          return;
        }
        throw new Error(data.error || 'Failed to reset password');
      }

      setStep('success');
    } catch (err: any) {
      setError(err.message || (isKo ? '비밀번호 재설정에 실패했습니다.' : 'Failed to reset password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-landing-page
      className="relative min-h-screen w-full bg-background text-foreground"
    >
      {/* Top bar with back arrow */}
      <header className="relative z-10 flex items-center px-5 pt-6 pb-4 md:px-8 md:pt-8">
        <Link
          href="/auth"
          aria-label={isKo ? '뒤로 가기' : 'Back'}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/90 transition hover:bg-foreground/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </header>

      {/* Divider */}
      <div className="mx-5 border-t border-border md:mx-8" />

      <main className="relative z-0 flex min-h-[calc(100vh-5rem)] items-center justify-center px-5 py-10 md:px-8">
        <div className="w-full max-w-[420px]">
          {step === 'success' ? (
            <SuccessCard isKo={isKo} />
          ) : step === 'error' ? (
            <ErrorCard isKo={isKo} />
          ) : (
            <div className="relative overflow-hidden rounded-[14px] border border-border bg-card px-6 py-8 shadow-sm md:px-8 md:py-10">
              {/* Flame watermark */}
              <Flame
                aria-hidden
                className="pointer-events-none absolute -right-6 top-1/2 h-48 w-48 -translate-y-1/2 text-foreground/5"
              />

              <div className="relative flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center">
                  <KeyRound className="h-8 w-8 text-[#faaf2e]" strokeWidth={2.25} />
                </div>

                <h1 className="mt-4 text-[22px] font-bold leading-tight text-foreground">
                  Set a new password.
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  새 비밀번호 설정.
                </p>
              </div>

              <div className="relative mt-7 space-y-5">
                {/* New Password */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      placeholder={isKo ? '최소 8자 이상 입력' : 'Enter at least 8 characters'}
                      className="h-11 w-full rounded-[10px] border border-border bg-background/60 pl-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/20 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Strength bars */}
                  <div className="mt-3 flex items-center gap-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`h-[3px] flex-1 rounded-full transition-colors ${
                          i < strengthScore
                            ? strengthScore >= 4
                              ? 'bg-[#faaf2e]'
                              : strengthScore === 3
                              ? 'bg-[#faaf2e]/80'
                              : strengthScore === 2
                              ? 'bg-foreground/40'
                              : 'bg-foreground/25'
                            : 'bg-border'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {isKo ? '보안 강도' : 'Strength'}
                    {strengthLabel && <span className="ml-1 text-foreground/80">· {strengthLabel}</span>}
                  </p>

                  {password.length > 0 && !passwordValid && (
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                      <PasswordCheck passed={passwordChecks.length} label={isKo ? '8자 이상' : '8+ chars'} />
                      <PasswordCheck passed={passwordChecks.uppercase} label={isKo ? '대문자' : 'Uppercase'} />
                      <PasswordCheck passed={passwordChecks.number} label={isKo ? '숫자' : 'Number'} />
                      <PasswordCheck passed={passwordChecks.special} label={isKo ? '특수기호' : 'Symbol'} />
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswordConfirm ? 'text' : 'password'}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      disabled={loading}
                      placeholder={isKo ? '비밀번호 다시 입력' : 'Re-enter password'}
                      className="h-11 w-full rounded-[10px] border border-border bg-background/60 pl-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/20 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm((s) => !s)}
                      aria-label={showPasswordConfirm ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordConfirm.length > 0 && (
                    <p className={`mt-1.5 text-xs ${passwordsMatch ? 'text-emerald-500' : 'text-red-500'}`}>
                      {passwordsMatch
                        ? isKo
                          ? '비밀번호가 일치합니다.'
                          : 'Passwords match.'
                        : isKo
                        ? '비밀번호가 일치하지 않습니다.'
                        : 'Passwords do not match.'}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-500">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !passwordValid || !passwordsMatch}
                  className="mt-2 flex h-12 w-full items-center justify-center rounded-[10px] bg-[#faaf2e] text-[15px] font-semibold text-[#4b3002] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? isKo
                      ? '변경 중...'
                      : 'Updating...'
                    : 'Update password / 비밀번호 변경'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] ${
        passed ? 'text-emerald-500' : 'text-muted-foreground'
      }`}
    >
      <CheckCircle2 className={`h-3 w-3 ${passed ? 'opacity-100' : 'opacity-40'}`} />
      {label}
    </span>
  );
}

function SuccessCard({ isKo }: { isKo: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[14px] border border-border bg-card px-6 py-10 text-center shadow-sm md:px-8">
      <Flame
        aria-hidden
        className="pointer-events-none absolute -right-6 top-1/2 h-48 w-48 -translate-y-1/2 text-foreground/5"
      />
      <div className="relative flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#faaf2e]/15">
          <CheckCircle2 className="h-7 w-7 text-[#faaf2e]" />
        </div>
        <h1 className="mt-4 text-[20px] font-bold text-foreground">
          {isKo ? '비밀번호가 변경되었습니다' : 'Password reset complete'}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isKo ? '새 비밀번호로 로그인해 주세요.' : 'Please sign in with your new password.'}
        </p>
        <Link
          href="/auth"
          className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-[#faaf2e] text-[15px] font-semibold text-[#4b3002] transition hover:brightness-105"
        >
          {isKo ? '포털 진입' : 'Enter portal'}
        </Link>
      </div>
    </div>
  );
}

function ErrorCard({ isKo }: { isKo: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[14px] border border-border bg-card px-6 py-10 text-center shadow-sm md:px-8">
      <Flame
        aria-hidden
        className="pointer-events-none absolute -right-6 top-1/2 h-48 w-48 -translate-y-1/2 text-foreground/5"
      />
      <div className="relative flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="mt-4 text-[20px] font-bold text-foreground">
          {isKo ? '링크가 만료되었습니다' : 'Link expired'}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isKo
            ? '비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다. 다시 요청해주세요.'
            : 'This password reset link has expired or is invalid. Please request a new one.'}
        </p>
        <Link
          href="/auth/forgot-password"
          className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-[#faaf2e] text-[15px] font-semibold text-[#4b3002] transition hover:brightness-105"
        >
          {isKo ? '다시 요청하기' : 'Request new link'}
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-background text-muted-foreground">
          Loading...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

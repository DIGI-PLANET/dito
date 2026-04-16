'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

type Step = 'form' | 'success' | 'error';

function ResetPasswordContent() {
  const { lang } = useI18n();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [step, setStep] = useState<Step>(token ? 'form' : 'error');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  const passwordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === passwordConfirm && passwordConfirm.length > 0;

  const handleSubmit = async () => {
    if (!passwordValid) {
      setError(lang === 'ko' ? '비밀번호 조건을 확인해주세요.' : 'Please check password requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError(lang === 'ko' ? '비밀번호가 일치하지 않습니다.' : 'Passwords do not match.');
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
      setError(err.message || (lang === 'ko' ? '비밀번호 재설정에 실패했습니다.' : 'Failed to reset password.'));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 page-enter">
        <div className="max-w-xs w-full flex flex-col items-center gap-6 text-center">
          <span className="text-5xl">🔥</span>
          <div>
            <h1 className="text-lg font-bold mb-2">
              {lang === 'ko' ? '비밀번호가 변경되었습니다' : 'Password Reset Complete'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === 'ko'
                ? '새 비밀번호로 로그인해 주세요.'
                : 'Please sign in with your new password.'}
            </p>
          </div>
          <Link
            href="/auth"
            className="w-full inline-flex items-center justify-center rounded-md bg-[#ff6b35] hover:bg-[#e55a2b] text-white h-12 px-4 text-base font-semibold transition-colors"
          >
            {lang === 'ko' ? '포털 진입' : 'Enter Portal'}
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 page-enter">
        <div className="max-w-xs w-full flex flex-col items-center gap-6 text-center">
          <span className="text-5xl">🔥</span>
          <div>
            <h1 className="text-lg font-bold mb-2">
              {lang === 'ko' ? '링크가 만료되었습니다' : 'Link Expired'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === 'ko'
                ? '비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다. 다시 요청해주세요.'
                : 'This password reset link has expired or is invalid. Please request a new one.'}
            </p>
          </div>
          <Link
            href="/auth/forgot-password"
            className="w-full inline-flex items-center justify-center rounded-md bg-[#ff6b35] hover:bg-[#e55a2b] text-white h-12 px-4 text-base font-semibold transition-colors"
          >
            {lang === 'ko' ? '다시 요청하기' : 'Request New Link'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 page-enter">
      <div className="max-w-xs w-full flex flex-col items-center gap-6">
        <span className="text-5xl">🔥</span>

        <div className="text-center">
          <h1 className="text-lg font-bold mb-2">
            {lang === 'ko' ? '새 비밀번호 설정' : 'Set New Password'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'ko'
              ? '새로운 비밀번호를 입력해주세요'
              : 'Enter your new password'}
          </p>
        </div>

        <div className="w-full space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block text-foreground">
              {lang === 'ko' ? '비밀번호' : 'Password'}
            </label>
            <Input
              type="password"
              placeholder={lang === 'ko' ? '8자 이상, 대문자+숫자+특수기호' : '8+ chars, uppercase+number+symbol'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            {password.length > 0 && (
              <div className="mt-2 space-y-0.5">
                <PasswordCheck passed={passwordChecks.length} label={lang === 'ko' ? '8자 이상' : '8+ characters'} />
                <PasswordCheck passed={passwordChecks.uppercase} label={lang === 'ko' ? '대문자 포함' : 'Uppercase letter'} />
                <PasswordCheck passed={passwordChecks.number} label={lang === 'ko' ? '숫자 포함' : 'Number'} />
                <PasswordCheck passed={passwordChecks.special} label={lang === 'ko' ? '특수기호 포함' : 'Special character'} />
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block text-foreground">
              {lang === 'ko' ? '비밀번호 확인' : 'Confirm Password'}
            </label>
            <Input
              type="password"
              placeholder={lang === 'ko' ? '비밀번호를 다시 입력해주세요' : 'Re-enter your password'}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              disabled={loading}
            />
            {passwordConfirm.length > 0 && (
              <p className={`text-xs mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                {passwordsMatch
                  ? `✓ ${lang === 'ko' ? '비밀번호가 일치합니다.' : 'Passwords match.'}`
                  : (lang === 'ko' ? '비밀번호가 일치하지 않습니다.' : 'Passwords do not match.')
                }
              </p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !passwordValid || !passwordsMatch}
            className="w-full mt-2 h-12 bg-[#ff6b35] hover:bg-[#e55a2b] text-white text-base font-semibold disabled:opacity-40"
          >
            {loading
              ? (lang === 'ko' ? '변경 중...' : 'Resetting...')
              : (lang === 'ko' ? '비밀번호 변경' : 'Reset Password')
            }
          </Button>
        </div>

        {error && (
          <div className="w-full text-center text-sm text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <p className={`text-xs flex items-center gap-1 ${passed ? 'text-green-600' : 'text-muted-foreground'}`}>
      <span>{passed ? '✓' : '✗'}</span>
      {label}
    </p>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const EMAIL_DOMAINS: Record<string, string[]> = {
  ko: ['gmail.com', 'naver.com', 'daum.net', 'kakao.com'],
  en: ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'],
};

type Step = 'form' | 'sent';

export default function ForgotPasswordPage() {
  const { lang } = useI18n();
  const [step, setStep] = useState<Step>('form');

  // 이메일 조합
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('gmail.com');
  const [customDomain, setCustomDomain] = useState('');
  const [isCustomDomain, setIsCustomDomain] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fullEmail = emailId
    ? `${emailId}@${isCustomDomain ? customDomain : emailDomain}`
    : '';

  const domains = EMAIL_DOMAINS[lang] || EMAIL_DOMAINS.en;

  const handleDomainChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomDomain(true);
      setCustomDomain('');
    } else {
      setIsCustomDomain(false);
      setEmailDomain(value);
    }
  };

  const handleSubmit = async () => {
    if (!emailId) {
      setError(lang === 'ko' ? '이메일 아이디를 입력해주세요.' : 'Please enter your email ID.');
      return;
    }
    const domain = isCustomDomain ? customDomain : emailDomain;
    if (!domain) {
      setError(lang === 'ko' ? '이메일 도메인을 입력해주세요.' : 'Please enter the email domain.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fullEmail, language: lang }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          setError(lang === 'ko' ? '등록되지 않은 이메일입니다.' : 'This email is not registered.');
          return;
        }
        throw new Error(data.error || 'Failed to send reset link');
      }

      setStep('sent');
    } catch (err: any) {
      setError(err.message || (lang === 'ko' ? '요청에 실패했습니다.' : 'Request failed.'));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'sent') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 page-enter">
        <div className="max-w-xs w-full flex flex-col items-center gap-6 text-center">
          <span className="text-5xl">📧</span>
          <div>
            <h1 className="text-lg font-bold mb-2">
              {lang === 'ko' ? '비밀번호 변경 링크 전달 완료' : 'Password Reset Link Sent'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === 'ko'
                ? '비밀번호 변경 링크는 발급일 기준으로 30분간 유효하며 메일이 오지 않았거나 링크가 만료되었다면 비밀번호 찾기를 다시 시도하세요.'
                : 'The reset link is valid for 30 minutes. If you didn\'t receive the email or the link has expired, please try again.'}
            </p>
          </div>
          <Link
            href="/auth"
            className="w-full inline-flex items-center justify-center rounded-md bg-[#ff6b35] hover:bg-[#e55a2b] text-white h-10 px-4 text-sm font-medium transition-colors"
          >
            {lang === 'ko' ? '포털로 이동' : 'Go to Portal'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 page-enter">
      <div className="max-w-sm w-full flex flex-col items-center gap-6">
        <span className="text-5xl">🔥</span>

        <div className="text-center">
          <h1 className="text-lg font-bold mb-2">
            {lang === 'ko' ? '비밀번호 찾기' : 'Forgot Password'}
          </h1>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {lang === 'ko'
              ? '비밀번호를 찾을 계정의 이메일을 입력 후\n인증링크 보내기 버튼을 눌러주세요\n\n인증링크는 발급 후 30분까지 유효합니다.'
              : 'Enter your account email and\nclick the Send Reset Link button.\n\nThe reset link is valid for 30 minutes.'}
          </p>
        </div>

        <div className="w-full space-y-3">
          {/* 이메일 입력 (아이디 + @ + 도메인) */}
          <div>
            <label className="text-sm font-medium mb-1.5 block text-foreground">
              {lang === 'ko' ? '이메일 주소' : 'Email Address'}
            </label>
            <div className="flex items-center gap-1.5">
              <Input
                type="text"
                placeholder={lang === 'ko' ? '아이디' : 'username'}
                value={emailId}
                onChange={(e) => setEmailId(e.target.value.replace(/[@\s]/g, ''))}
                disabled={loading}
                className="flex-1 min-w-0"
              />
              <span className="text-muted-foreground text-sm shrink-0">@</span>
              {isCustomDomain ? (
                <>
                  <Input
                    type="text"
                    placeholder="example.com"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value.replace(/[\s@]/g, ''))}
                    disabled={loading}
                    className="flex-1 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => { setIsCustomDomain(false); setEmailDomain('gmail.com'); }}
                    className="text-xs text-muted-foreground hover:text-foreground shrink-0 whitespace-nowrap"
                  >
                    {lang === 'ko' ? '변경' : 'Change'}
                  </button>
                </>
              ) : (
                <select
                  value={emailDomain}
                  onChange={(e) => handleDomainChange(e.target.value)}
                  disabled={loading}
                  className="flex-1 min-w-0 h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {domains.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="custom">
                    {lang === 'ko' ? '기타(직접입력)' : 'Other(custom)'}
                  </option>
                </select>
              )}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !emailId}
            className="w-full mt-2 h-12 bg-[#ff6b35] hover:bg-[#e55a2b] text-white text-base font-semibold disabled:opacity-40"
          >
            {loading
              ? (lang === 'ko' ? '발송 중...' : 'Sending...')
              : (lang === 'ko' ? '인증링크 보내기' : 'Send Reset Link')
            }
          </Button>
        </div>

        {error && (
          <div className="w-full text-center text-sm text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            <Link href="/auth" className="text-[#ff6b35] hover:underline">
              {lang === 'ko' ? '로그인으로 돌아가기' : 'Back to Sign In'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

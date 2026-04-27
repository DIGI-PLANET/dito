'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/providers/i18n-provider';
import { ArrowLeft, Mail, Flame } from 'lucide-react';

const EMAIL_DOMAINS: Record<string, string[]> = {
  ko: ['gmail.com', 'naver.com', 'daum.net', 'kakao.com'],
  en: ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'],
};

type Step = 'form' | 'sent';

export default function ForgotPasswordPage() {
  const { lang } = useI18n();
  const isKo = lang === 'ko';
  const [step, setStep] = useState<Step>('form');

  // Email composition (id + @ + domain)
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
      setError(isKo ? '이메일 아이디를 입력해주세요.' : 'Please enter your email ID.');
      return;
    }
    const domain = isCustomDomain ? customDomain : emailDomain;
    if (!domain) {
      setError(isKo ? '이메일 도메인을 입력해주세요.' : 'Please enter the email domain.');
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
          setError(isKo ? '등록되지 않은 이메일입니다.' : 'This email is not registered.');
          return;
        }
        throw new Error(data.error || 'Failed to send reset link');
      }

      setStep('sent');
    } catch (err: any) {
      setError(err.message || (isKo ? '요청에 실패했습니다.' : 'Request failed.'));
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
      <div className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-105 items-center gap-3 px-4">
          <Link
            href="/auth"
            aria-label="Back"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition hover:bg-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-105 flex-col items-center px-4 pt-10 pb-14 md:pt-16 md:pb-20">
        {/* Card */}
        <div className="relative w-full overflow-hidden rounded-[14px] border border-border bg-card px-5 py-7 md:px-7 md:py-9">
          {/* Decorative flame watermark (very subtle) */}
          <Flame
            aria-hidden
            className="pointer-events-none absolute right-4 top-4 h-20 w-20 text-foreground/5 md:h-24 md:w-24"
          />

          {step === 'form' ? (
            <>
              {/* Mail icon */}
              <div className="relative mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ember)]/10 ring-1 ring-[var(--ember)]/30">
                <Mail className="h-5 w-5 text-[var(--ember)]" />
              </div>

              {/* Titles */}
              <h1 className="relative text-center text-[22px] font-bold tracking-tight md:text-[24px]">
                {isKo ? '접속 복구.' : 'Rekindle access.'}
              </h1>
              <p className="relative mt-1 text-center text-[13px] text-muted-foreground">
                {isKo ? 'Rekindle access.' : '접속 복구.'}
              </p>

              {/* Description */}
              <p className="relative mt-5 text-center text-[14px] leading-normal text-foreground/90">
                {isKo
                  ? '이메일 입력. 재설정 링크 전송.'
                  : "Enter your email. We'll send a reset link."}
              </p>
              <p className="relative mt-1 text-center text-[12px] text-muted-foreground">
                {isKo
                  ? "Enter your email. We'll send a reset link."
                  : '이메일 입력. 재설정 링크 전송.'}
              </p>

              {/* Email input group */}
              <div className="relative mt-6">
                <div className="flex items-center gap-1.5 rounded-[10px] border border-border bg-background px-3 focus-within:border-[var(--ember)]/50 focus-within:ring-2 focus-within:ring-[var(--ember)]/20">
                  <Mail className="pointer-events-none h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={isKo ? '아이디' : 'name'}
                    value={emailId}
                    onChange={(e) =>
                      setEmailId(e.target.value.replace(/[@\s]/g, ''))
                    }
                    disabled={loading}
                    className="h-11 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground disabled:opacity-50"
                  />
                  <span className="shrink-0 text-[14px] text-muted-foreground">@</span>
                  {isCustomDomain ? (
                    <>
                      <input
                        type="text"
                        placeholder="example.com"
                        value={customDomain}
                        onChange={(e) =>
                          setCustomDomain(e.target.value.replace(/[\s@]/g, ''))
                        }
                        disabled={loading}
                        className="h-11 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomDomain(false);
                          setEmailDomain('gmail.com');
                        }}
                        className="shrink-0 whitespace-nowrap text-[12px] text-muted-foreground transition hover:text-foreground"
                      >
                        {isKo ? '변경' : 'Change'}
                      </button>
                    </>
                  ) : (
                    <select
                      value={emailDomain}
                      onChange={(e) => handleDomainChange(e.target.value)}
                      disabled={loading}
                      className="h-11 min-w-0 flex-1 bg-transparent text-[14px] outline-none disabled:opacity-50"
                    >
                      {domains.map((d) => (
                        <option key={d} value={d} className="bg-background text-foreground">
                          {d}
                        </option>
                      ))}
                      <option value="custom" className="bg-background text-foreground">
                        {isKo ? '기타(직접입력)' : 'Other (custom)'}
                      </option>
                    </select>
                  )}
                </div>
                {fullEmail && (
                  <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
                    {fullEmail}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !emailId}
                className="relative mt-5 flex h-12 w-full flex-col items-center justify-center rounded-full bg-[var(--ember)] text-[var(--fg-on-ember)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="text-[15px] font-semibold leading-tight">
                  {loading
                    ? isKo
                      ? '발송 중...'
                      : 'Sending...'
                    : isKo
                      ? '재설정 링크 보내기'
                      : 'Send reset link'}
                </span>
                {!loading && (
                  <span className="text-[11px] font-medium leading-tight text-[var(--fg-on-ember)]/80">
                    {isKo ? 'Send reset link' : '재설정 링크 보내기'}
                  </span>
                )}
              </button>

              {/* Error */}
              {error && (
                <div className="relative mt-4 rounded-[10px] border border-red-500/30 bg-red-500/10 p-3 text-center text-[13px] text-red-500">
                  {error}
                </div>
              )}

              {/* Back to login */}
              <div className="relative mt-6 text-center">
                <Link
                  href="/auth"
                  className="inline-block text-[14px] font-medium text-foreground/90 transition hover:text-[var(--ember)]"
                >
                  {isKo ? '로그인으로' : 'Back to login'}
                </Link>
                <div className="mt-0.5 text-[12px] text-muted-foreground underline-offset-2">
                  {isKo ? 'Back to login' : '로그인으로'}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Sent confirmation */}
              <div className="relative mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ember)]/10 ring-1 ring-[var(--ember)]/30">
                <Mail className="h-5 w-5 text-[var(--ember)]" />
              </div>

              <h1 className="relative text-center text-[22px] font-bold tracking-tight md:text-[24px]">
                {isKo ? '링크 전송 완료.' : 'Link sent.'}
              </h1>
              <p className="relative mt-1 text-center text-[13px] text-muted-foreground">
                {isKo ? 'Link sent.' : '링크 전송 완료.'}
              </p>

              <p className="relative mt-5 text-center text-[14px] leading-normal text-foreground/90">
                {isKo
                  ? '30분간 유효. 메일함을 확인하세요.'
                  : "Valid for 30 minutes. Check your inbox."}
              </p>
              <p className="relative mt-1 text-center text-[12px] text-muted-foreground">
                {isKo
                  ? 'Valid for 30 minutes. Check your inbox.'
                  : '30분간 유효. 메일함을 확인하세요.'}
              </p>

              <Link
                href="/auth"
                className="relative mt-6 flex h-12 w-full flex-col items-center justify-center rounded-full bg-[var(--ember)] text-[var(--fg-on-ember)] transition hover:brightness-95"
              >
                <span className="text-[15px] font-semibold leading-tight">
                  {isKo ? '로그인으로' : 'Back to login'}
                </span>
                <span className="text-[11px] font-medium leading-tight text-[var(--fg-on-ember)]/80">
                  {isKo ? 'Back to login' : '로그인으로'}
                </span>
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

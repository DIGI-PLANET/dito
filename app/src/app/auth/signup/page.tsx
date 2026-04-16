'use client';

import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const EMAIL_DOMAINS: Record<string, string[]> = {
  ko: ['gmail.com', 'naver.com', 'daum.net', 'kakao.com'],
  en: ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'],
};

export default function SignupPage() {
  const { lang } = useI18n();

  // 폼 데이터
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('gmail.com');
  const [customDomain, setCustomDomain] = useState('');
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // 이메일 인증
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [resendLeft, setResendLeft] = useState(2); // 재발송 가능 횟수
  const [cooldown, setCooldown] = useState(0); // 재발송 쿨다운 초
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  // 사용자명 확인
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);

  // UI 상태
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  // 현재 이메일 조합
  const fullEmail = emailId
    ? `${emailId}@${isCustomDomain ? customDomain : emailDomain}`
    : '';

  // 비밀번호 정책 체크
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  const passwordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === passwordConfirm && passwordConfirm.length > 0;

  // 타이머 cleanup
  useEffect(() => {
    const timer = timerRef.current;
    const cd = cooldownRef.current;
    return () => {
      if (timer) clearInterval(timer);
      if (cd) clearInterval(cd);
    };
  }, []);

  // 이메일/도메인 변경 시 인증 상태 리셋
  useEffect(() => {
    setEmailVerified(false);
    setEmailExists(false);
    setOtpSent(false);
    setOtp('');
    setOtpTimer(0);
    setResendLeft(2);
    setCooldown(0);
    setOtpError('');
    if (timerRef.current) clearInterval(timerRef.current);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
  }, [emailId, emailDomain, customDomain, isCustomDomain]);

  // 사용자명 변경 시 중복확인 리셋
  useEffect(() => {
    setUsernameChecked(false);
    setUsernameAvailable(false);
  }, [username]);

  // 도메인 셀렉트 변경
  const handleDomainChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomDomain(true);
      setCustomDomain('');
    } else {
      setIsCustomDomain(false);
      setEmailDomain(value);
    }
  };

  // 쿨다운 타이머 시작
  const startCooldown = (sec: number) => {
    setCooldown(sec);
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

  // 이메일 중복확인 + OTP 발송
  const handleSendOtp = async () => {
    if (!emailId || (!isCustomDomain && !emailDomain) || (isCustomDomain && !customDomain)) {
      setError(lang === 'ko' ? '이메일 주소를 입력해주세요.' : 'Please enter your email address.');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      // 1. 이메일 중복 확인 (최초 발송 시에만)
      if (!otpSent) {
        const checkRes = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: fullEmail }),
        });
        const checkData = await checkRes.json();

        if (checkData.exists) {
          setEmailExists(true);
          setError(lang === 'ko' ? '이미 등록된 이메일입니다.' : 'This email is already registered.');
          return;
        }
      }

      // 2. OTP 발송
      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fullEmail }),
      });

      const otpData = await otpRes.json();

      if (!otpRes.ok) {
        if (otpData.maxReached) {
          setResendLeft(0);
        }
        throw new Error(otpData.error || 'Failed to send OTP');
      }

      setOtpSent(true);
      setResendLeft(otpData.resendLeft ?? 0);
      setOtp('');

      // 5분 카운트다운 시작
      setOtpTimer(otpData.ttl || 300);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 60초 쿨다운 시작
      startCooldown(60);
    } catch (err: any) {
      setError(err.message || (lang === 'ko' ? '인증번호 발송에 실패했습니다.' : 'Failed to send verification code.'));
    } finally {
      setOtpLoading(false);
    }
  };

  // OTP 확인
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError(lang === 'ko' ? '6자리 인증코드를 입력해주세요.' : 'Please enter 6-digit verification code.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const res = await fetch('/api/auth/verify-otp-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fullEmail, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      setOtpError('');
      setEmailVerified(true);
      setOtpSent(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (err: any) {
      setOtpError(err.message || (lang === 'ko' ? '인증에 실패했습니다.' : 'Verification failed.'));
    } finally {
      setOtpLoading(false);
    }
  };

  // 사용자명 중복확인
  const handleCheckUsername = async () => {
    if (!username || username.length < 1) {
      setError(lang === 'ko' ? '사용자명을 입력해주세요.' : 'Please enter a username.');
      return;
    }

    setUsernameLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();

      setUsernameChecked(true);
      setUsernameAvailable(data.available);

      if (!data.available) {
        setError(lang === 'ko' ? '이미 사용 중인 사용자명입니다.' : 'This username is already taken.');
      }
    } catch (err: any) {
      setError(err.message || (lang === 'ko' ? '중복확인에 실패했습니다.' : 'Failed to check username.'));
    } finally {
      setUsernameLoading(false);
    }
  };

  // 회원가입 제출
  const handleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: fullEmail,
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      setSignupSuccess(true);
    } catch (err: any) {
      setError(err.message || (lang === 'ko' ? '회원가입에 실패했습니다.' : 'Signup failed.'));
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 가입 버튼 활성화 조건
  const canSubmit =
    emailVerified &&
    usernameChecked &&
    usernameAvailable &&
    passwordValid &&
    passwordsMatch &&
    agreedToTerms &&
    !loading;

  const domains = EMAIL_DOMAINS[lang] || EMAIL_DOMAINS.en;

  if (signupSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 page-enter">
        <div className="max-w-sm w-full flex flex-col items-center gap-6 text-center">
          <span className="text-5xl">🔥</span>
          <div>
            <h1 className="text-lg font-bold mb-2">
              {lang === 'ko' ? 'Seeker가 되신 것을 환영합니다!' : 'Welcome, Seeker!'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === 'ko'
                ? `지금부터 ${username}님의 Ember를 소환합니다.`
                : `Summoning ${username}'s Ember now.`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === 'ko'
                ? `Ember는 ${username}님의 재능을 찾아주고 성장을 위해 도와주는 정령입니다.`
                : 'Ember is a spirit that discovers your talent and helps you grow.'}
            </p>
          </div>
          <Link
            href="/discovery"
            className="w-full inline-flex items-center justify-center rounded-md bg-[#ff6b35] hover:bg-[#e55a2b] text-white h-10 px-4 text-sm font-medium transition-colors"
          >
            {lang === 'ko' ? 'Ember 소환하기' : 'Summon Your Ember'}
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
            {lang === 'ko' ? '회원가입' : 'Sign Up'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'ko'
              ? '앰버를 생성하기 위한 첫번째 단계입니다.'
              : 'The first step to creating your Ember.'}
          </p>
        </div>

        <div className="w-full space-y-4">
          {/* 사용자명 */}
          <div>
            <label className="text-sm font-medium mb-1.5 block text-foreground">
              {lang === 'ko' ? '사용자명' : 'Username'}
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder={lang === 'ko' ? '30자 이내, 영문 또는 숫자' : 'Up to 30 chars, letters or numbers'}
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 30))}
                disabled={loading}
                className="flex-1"
                maxLength={30}
              />
              <Button
                type="button"
                onClick={handleCheckUsername}
                disabled={usernameLoading || username.length < 1}
                variant="outline"
                size="sm"
                className="shrink-0 h-9 py-1"
              >
                {usernameLoading
                  ? '...'
                  : (lang === 'ko' ? '중복확인' : 'Check')
                }
              </Button>
            </div>
            {usernameChecked && usernameAvailable && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                ✓ {lang === 'ko' ? '사용 가능한 사용자명입니다.' : 'Username is available.'}
              </p>
            )}
            {usernameChecked && !usernameAvailable && (
              <p className="text-xs text-red-500 mt-1">
                {lang === 'ko' ? '이미 사용 중인 사용자명입니다.' : 'This username is already taken.'}
              </p>
            )}
          </div>

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
                disabled={loading || emailVerified}
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
                    disabled={loading || emailVerified}
                    className="flex-1 min-w-0"
                  />
                  {!emailVerified && (
                    <button
                      type="button"
                      onClick={() => { setIsCustomDomain(false); setEmailDomain('gmail.com'); }}
                      className="text-xs text-muted-foreground hover:text-foreground shrink-0 whitespace-nowrap"
                    >
                      {lang === 'ko' ? '변경' : 'Change'}
                    </button>
                  )}
                </>
              ) : (
                <select
                  value={emailDomain}
                  onChange={(e) => handleDomainChange(e.target.value)}
                  disabled={loading || emailVerified}
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

            {/* 이메일 중복 경고 */}
            {emailExists && (
              <p className="text-xs text-red-500 mt-1">
                {lang === 'ko' ? '이미 등록된 이메일입니다.' : 'This email is already registered.'}
              </p>
            )}

            {/* 인증 상태 */}
            {emailVerified && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                ✓ {lang === 'ko' ? '이메일 인증 완료' : 'Email verified'}
              </p>
            )}

            {/* 인증번호 받기 버튼 */}
            {!emailVerified && !otpSent && emailId && (
              <Button
                type="button"
                onClick={handleSendOtp}
                disabled={otpLoading || !emailId}
                variant="outline"
                className="w-full mt-2 text-sm"
                size="sm"
              >
                {otpLoading
                  ? (lang === 'ko' ? '발송 중...' : 'Sending...')
                  : (lang === 'ko' ? '인증번호 받기' : 'Get Verification Code')
                }
              </Button>
            )}

            {/* OTP 입력 */}
            {otpSent && !emailVerified && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={otpLoading}
                    className="flex-1 text-center font-mono tracking-widest h-9"
                    maxLength={6}
                  />
                  {otpTimer > 0 && (
                    <span className="text-xs text-[#ff6b35] font-mono shrink-0">
                      {formatTimer(otpTimer)}
                    </span>
                  )}
                  <Button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otp.length !== 6}
                    size="sm"
                    className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white shrink-0 h-9 py-1"
                  >
                    {otpLoading
                      ? (lang === 'ko' ? '확인 중...' : 'Verifying...')
                      : (lang === 'ko' ? '인증' : 'Verify')
                    }
                  </Button>
                </div>
                {otpError && (
                  <p className="text-xs text-red-500">{otpError}</p>
                )}
                {resendLeft > 0 ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading || cooldown > 0}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {cooldown > 0
                      ? (lang === 'ko' ? `코드 재발송 대기 (${cooldown}초)` : `Resend code in ${cooldown}s`)
                      : (lang === 'ko' ? `코드 다시 발송 (${resendLeft}회 남음)` : `Resend code (${resendLeft} left)`)
                    }
                  </button>
                ) : (
                  <p className="text-xs text-red-500">
                    {lang === 'ko' ? '재발송 횟수를 초과했습니다.' : 'Resend limit reached.'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 비밀번호 */}
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
            {/* 비밀번호 강도 체커 */}
            {password.length > 0 && (
              <div className="mt-2 space-y-0.5">
                <PasswordCheck
                  passed={passwordChecks.length}
                  label={lang === 'ko' ? '8자 이상' : '8+ characters'}
                />
                <PasswordCheck
                  passed={passwordChecks.uppercase}
                  label={lang === 'ko' ? '대문자 포함' : 'Uppercase letter'}
                />
                <PasswordCheck
                  passed={passwordChecks.number}
                  label={lang === 'ko' ? '숫자 포함' : 'Number'}
                />
                <PasswordCheck
                  passed={passwordChecks.special}
                  label={lang === 'ko' ? '특수기호 포함' : 'Special character'}
                />
              </div>
            )}
          </div>

          {/* 비밀번호 확인 */}
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

          {/* 약관 동의 */}
          <label className="flex items-center justify-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              disabled={loading}
              className="h-4 w-4 rounded border-gray-300 accent-[#ff6b35]"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              {lang === 'ko' ? (
                <>
                  <button type="button" onClick={() => window.open('/terms', '_blank')} className="text-[#ff6b35] hover:underline">회원약관</button>
                  {' 및 '}
                  <button type="button" onClick={() => window.open('/privacy', '_blank')} className="text-[#ff6b35] hover:underline">서비스 이용약관</button>
                  {'에 동의합니다.'}
                </>
              ) : (
                <>
                  {'I agree to the '}
                  <button type="button" onClick={() => window.open('/terms', '_blank')} className="text-[#ff6b35] hover:underline">Terms of Service</button>
                  {' and '}
                  <button type="button" onClick={() => window.open('/privacy', '_blank')} className="text-[#ff6b35] hover:underline">Privacy Policy</button>
                  {'.'}
                </>
              )}
            </span>
          </label>

          {/* 회원가입 버튼 */}
          <Button
            onClick={handleSignup}
            disabled={!canSubmit}
            className="w-full mt-2 bg-[#ff6b35] hover:bg-[#e55a2b] text-white disabled:opacity-40"
          >
            {loading
              ? (lang === 'ko' ? '가입 중...' : 'Creating account...')
              : (lang === 'ko' ? '회원가입' : 'Sign Up')
            }
          </Button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="text-center text-sm text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg w-full">
            {error}
          </div>
        )}

        {/* 로그인 링크 */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {lang === 'ko' ? '이미 계정이 있나요? ' : 'Already have an account? '}
            <Link href="/auth/login" className="text-[#ff6b35] hover:underline">
              {lang === 'ko' ? '로그인' : 'Sign in'}
            </Link>
          </p>
        </div>
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

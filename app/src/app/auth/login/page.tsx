'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

type Step = 'form' | 'otp';

export default function LoginPage() {
  const { lang } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  
  // 로그인 폼 데이터
  const [formData, setFormData] = useState({
    identifier: '', // 이메일 또는 사용자명
    password: ''
  });
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [discoveryComplete, setDiscoveryComplete] = useState(false);

  // OTP 관련
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);

  const validateForm = () => {
    if (!formData.identifier.trim()) {
      return lang === 'ko' ? '이메일 주소 또는 사용자명을 입력해주세요.' : 'Please enter your email or username.';
    }
    if (!formData.password) {
      return lang === 'ko' ? '비밀번호를 입력해주세요.' : 'Please enter your password.';
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
        setTimer(300); // 5분

        // 타이머 시작
        const interval = setInterval(() => {
          setTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
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
      setError(lang === 'ko' ? '6자리 인증코드를 입력해주세요.' : 'Please enter 6-digit OTP code.');
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

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 page-enter">
      <div className="max-w-xs w-full flex flex-col items-center gap-6">
        <span className="text-5xl">🔥</span>
        
        <div className="text-center">
          <h1 className="text-lg font-bold mb-2">
            {step === 'form' 
              ? (lang === 'ko' ? '로그인' : 'Sign In')
              : (lang === 'ko' ? 'OTP 인증' : 'OTP Verification')
            }
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 'form'
              ? (lang === 'ko' ? '계정 정보를 입력해주세요' : 'Enter your account details')
              : (lang === 'ko' ? '선택사항: 보안 강화를 위해 인증코드를 입력하세요' : 'Optional: Enter verification code for enhanced security')
            }
          </p>
        </div>

        {step === 'form' ? (
          // 로그인 폼
          <div className="w-full space-y-3">
            <Input
              type="text"
              placeholder={lang === 'ko' ? '이메일 주소 또는 사용자명' : 'Email or username'}
              value={formData.identifier}
              onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
              disabled={loading}
            />
            <Input
              type="password"
              placeholder={lang === 'ko' ? '비밀번호' : 'Password'}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              disabled={loading}
            />
            
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full mt-4 bg-[#ff6b35] hover:bg-[#e55a2b] text-white"
            >
              {loading 
                ? (lang === 'ko' ? '로그인 중...' : 'Signing in...')
                : (lang === 'ko' ? '로그인' : 'Sign In')
              }
            </Button>

            <div className="text-center">
              <Link href="/auth/forgot-password" className="text-sm text-muted-foreground hover:text-[#ff6b35] transition-colors">
                {lang === 'ko' ? '비밀번호를 잊으셨나요?' : 'Forgot your password?'}
              </Link>
            </div>
          </div>
        ) : (
          // OTP 입력
          <div className="w-full space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>{resolvedEmail}</p>
              <p>
                {lang === 'ko' ? '위 이메일로 인증코드를 발송했어요' : 'Verification code sent to above email'}
              </p>
              {timer > 0 && (
                <p className="text-[#ff6b35] font-mono">
                  {formatTimer(timer)}
                </p>
              )}
            </div>
            
            <Input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={loading}
              className="text-center text-lg tracking-widest font-mono"
              maxLength={6}
            />
            
            <div className="space-y-2">
              <Button
                onClick={verifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full bg-[#ff6b35] hover:bg-[#e55a2b] text-white"
              >
                {loading 
                  ? (lang === 'ko' ? '확인 중...' : 'Verifying...')
                  : (lang === 'ko' ? '인증하고 로그인' : 'Verify & Sign In')
                }
              </Button>

              <Button
                onClick={skipOtpAndComplete}
                variant="ghost"
                disabled={loading}
                className="w-full text-sm"
              >
                {lang === 'ko' ? '건너뛰고 로그인' : 'Skip and Sign In'}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {lang === 'ko' ? '계정이 없나요? ' : 'Don\'t have an account? '}
            <Link href="/auth/signup" className="text-[#ff6b35] hover:underline">
              {lang === 'ko' ? '새 계정 만들기' : 'Create new account'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
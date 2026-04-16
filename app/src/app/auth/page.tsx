'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function AuthPage() {
  const { lang } = useI18n();
  const router = useRouter();

  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        router.push('/auth/login');
      } else {
        router.push('/chat');
      }
    } catch (err: any) {
      setError(lang === 'ko' ? '포털 진입을 실패하였습니다. 계정정보를 확인해 주세요.' : 'Portal entry failed. Please check your account details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 page-enter">
      <div className="max-w-xs w-full flex flex-col items-center gap-6">
        <span className="text-6xl">🔥</span>

        <div className="text-center">
          <h1 className="text-sm text-muted-foreground mb-2">
            {lang === 'ko'
              ? '서비스를 이용하려면 로그인 해야 합니다.'
              : 'Please sign in to use the service.'}
          </h1>
          <p className="text-xl font-bold">
            {lang === 'ko' ? '포털 진입' : 'Portal Entry'}
          </p>
        </div>

        {/* Login Form */}
        <div className="w-full space-y-3">
          <Input
            type="text"
            placeholder={lang === 'ko' ? '이메일 주소 또는 사용자명' : 'Email or username'}
            value={formData.identifier}
            onChange={(e) => setFormData((prev) => ({ ...prev, identifier: e.target.value }))}
            disabled={loading}
          />
          <Input
            type="password"
            placeholder={lang === 'ko' ? '비밀번호' : 'Password'}
            value={formData.password}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            disabled={loading}
          />

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-2 h-12 bg-[#ff6b35] hover:bg-[#e55a2b] text-white text-base font-semibold"
          >
            {loading
              ? (lang === 'ko' ? '로그인 중...' : 'Signing in...')
              : (lang === 'ko' ? '로그인' : 'Sign In')}
          </Button>
        </div>

        {error && (
          <div className="w-full text-center text-sm text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Divider */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {lang === 'ko' ? '아직 계정이 없으시다면' : "Don't have an account yet?"}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Links */}
        <div className="w-full flex flex-col items-center gap-2">
          <Link href="/auth/signup" className="w-full">
            <Button
              variant="outline"
              className="w-full h-12 border-[#ff6b35]/40 text-[#ff6b35] hover:bg-[#ff6b35]/10 text-base font-semibold"
            >
              {lang === 'ko' ? '신규 회원가입' : 'Create New Account'}
            </Button>
          </Link>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-muted-foreground hover:text-[#ff6b35] transition-colors"
          >
            {lang === 'ko' ? '비밀번호 찾기' : 'Forgot Password?'}
          </Link>
        </div>

        {/* Terms */}
        <div className="text-center text-xs text-muted-foreground leading-relaxed">
          <p>
            {lang === 'ko'
              ? '서비스 이용을 위한 가입은 '
              : 'By signing up, you agree to '}
            <a href="https://dito.guru" className="text-[#ff6b35] hover:underline">
              DITO.guru
            </a>
            {lang === 'ko' ? '의 ' : "'s "}
            <a href="/terms" className="text-[#ff6b35] hover:underline">
              {lang === 'ko' ? '이용약관' : 'Terms of Service'}
            </a>
            {lang === 'ko' ? '과 ' : ' and '}
            <a href="/privacy" className="text-[#ff6b35] hover:underline">
              {lang === 'ko' ? '개인정보 처리방침' : 'Privacy Policy'}
            </a>
            {lang === 'ko' ? '에 동의한 것으로 간주됩니다.' : '.'}
          </p>
        </div>
      </div>
    </div>
  );
}

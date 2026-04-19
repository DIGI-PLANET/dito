'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/providers/i18n-provider';
import {
  Flame,
  ArrowLeft,
  Eye,
  EyeOff,
  CircleAlert,
  Wallet,
  Sparkles,
} from 'lucide-react';

export default function AuthPage() {
  const { lang } = useI18n();
  const router = useRouter();
  const isKo = lang === 'ko';

  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);

  const handleLogin = async () => {
    if (!formData.identifier.trim() || !formData.password) {
      setError(isKo ? '이메일/사용자명과 비밀번호를 입력해주세요.' : 'Invalid credentials');
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
      if (res.status === 429) {
        setLocked(true);
        throw new Error('locked');
      }
      if (!res.ok) throw new Error(data.error || 'Login failed');
      router.push(data.requiresOtp ? '/auth/login' : '/chat');
    } catch (e) {
      if ((e as Error).message !== 'locked') {
        setError(isKo ? '잘못된 인증 정보' : 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-landing-page className="relative min-h-screen w-full bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-[52px] w-full max-w-[420px] items-center gap-3 px-4">
          <Link
            href="/"
            aria-label="Back"
            className="inline-flex h-8 w-8 -ml-1 items-center justify-center rounded-full text-foreground/85 transition hover:bg-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-[14px] font-medium">{isKo ? '로그인' : 'Login'}</span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[420px] px-4 pt-4 pb-10">
        {/* Account locked banner (appears only when rate-limited) */}
        {locked && (
          <div className="mb-4 flex items-start gap-2.5 rounded-[10px] border border-border bg-card px-3.5 py-3">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-foreground/85" />
            <div>
              <p className="text-[14px] font-medium leading-tight text-foreground">
                {isKo ? '계정 잠금' : 'Account locked'}
              </p>
              <p className="mt-1 text-[12px] leading-[1.45] text-muted-foreground">
                {isKo
                  ? '시도 횟수가 너무 많습니다. 10분 후 다시 시도해주세요.'
                  : 'Too many attempts. Try again in 10 minutes.'}
              </p>
            </div>
          </div>
        )}

        {/* Gradient hero card */}
        <div className="relative overflow-hidden rounded-[14px] border border-border bg-card px-5 pt-6 pb-5">
          {/* Soft amber glow top */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[180px] bg-linear-to-b from-[#faaf2e]/12 to-transparent"
          />

          <div className="relative">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#faaf2e]/15 ring-1 ring-[#faaf2e]/30">
              <Flame className="h-5 w-5 text-[#faaf2e]" />
            </div>

            <h1 className="text-center text-[20px] font-bold tracking-tight text-foreground">
              {isKo ? '다시 만나요, Seeker.' : 'Welcome back, Seeker.'}
            </h1>
            <p className="mt-1 text-center text-[12px] font-medium text-muted-foreground">
              {isKo ? 'Welcome back, Seeker.' : '다시 만나요, Seeker.'}
            </p>

            {/* Inputs */}
            <div className="mt-6 space-y-3">
              <input
                type="text"
                value={formData.identifier}
                onChange={(e) => setFormData((p) => ({ ...p, identifier: e.target.value }))}
                disabled={loading}
                placeholder={isKo ? '이메일 또는 사용자명' : 'Email or username'}
                className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none transition focus:border-[#faaf2e]/60 focus:ring-2 focus:ring-[#faaf2e]/20"
              />

              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  disabled={loading}
                  placeholder={isKo ? '비밀번호' : 'Password'}
                  className="h-11 w-full rounded-[10px] border border-border bg-background px-3.5 pr-10 text-[14px] text-foreground placeholder:text-muted-foreground outline-none transition focus:border-[#faaf2e]/60 focus:ring-2 focus:ring-[#faaf2e]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground transition hover:text-foreground/85"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-2.5 text-[11px] font-medium text-[#ef4343]">
                {error}
              </p>
            )}

            <div className="mt-3 text-left">
              <Link
                href="/auth/forgot-password"
                className="text-[12px] text-muted-foreground transition hover:text-foreground/85"
              >
                {isKo ? '비밀번호 잊음?' : 'Forgot password?'}
                <span className="text-muted-foreground/60"> / </span>
                {isKo ? 'Forgot password?' : '비밀번호 잊음?'}
              </Link>
            </div>

            {/* Primary sign in */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-[#faaf2e] text-[14px] font-medium text-[#021a4b] shadow-[0_6px_14px_rgba(250,175,46,0.25)] transition hover:bg-[#e8a129] disabled:opacity-60"
            >
              {loading
                ? isKo
                  ? '로그인 중…'
                  : 'Signing in…'
                : isKo
                  ? '로그인 / Sign In'
                  : 'Sign In / 로그인'}
            </button>

            {/* OR divider */}
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-medium uppercase tracking-[1px] text-muted-foreground">
                {isKo ? 'OR' : 'OR'}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Wallet buttons (dark filled, matching Figma) */}
            <div className="flex flex-col gap-2.5">
              <Link
                href="/connect"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-background/60 text-[14px] font-medium text-foreground transition hover:bg-foreground/4"
              >
                <Wallet className="h-4 w-4 text-[#ab9ff2]" />
                {isKo ? 'Phantom으로 로그인' : 'Sign in with Phantom'}
              </Link>
              <Link
                href="/connect"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-background/60 text-[14px] font-medium text-foreground transition hover:bg-foreground/4"
              >
                <Sparkles className="h-4 w-4 text-[#faaf2e]" />
                {isKo ? 'Solflare로 로그인' : 'Sign in with Solflare'}
              </Link>
            </div>
          </div>
        </div>

        {/* Signup nudge — bilingual, matching Figma format */}
        <p className="mt-6 text-center text-[12px] text-muted-foreground">
          {isKo ? '처음? ' : 'New here? '}
          <Link href="/auth/signup" className="font-medium text-foreground hover:underline">
            {isKo ? 'Ember과 시작' : 'Start with Ember'}
          </Link>
          <span className="text-muted-foreground/70"> / </span>
          <Link href="/auth/signup" className="hover:text-foreground/85">
            {isKo ? 'New here? Start with Ember.' : '처음? Ember과 시작.'}
          </Link>
        </p>

        <p className="mt-8 text-center text-[10px] uppercase tracking-[1px] text-muted-foreground/50">
          Toggle UI States (Dev)
        </p>
      </main>
    </div>
  );
}

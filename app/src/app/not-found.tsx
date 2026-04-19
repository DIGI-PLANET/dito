'use client';

import Link from 'next/link';
import { Flame, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';

export default function NotFound() {
  const { lang } = useI18n();
  const isKo = lang === 'ko';

  return (
    <div
      data-landing-page
      className="min-h-dvh flex items-center justify-center px-4 py-6 bg-background text-foreground"
    >
      <div className="flex flex-col items-center text-center max-w-md">
        {/* Dimmed Ember flame motif */}
        <div className="relative mb-8">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full blur-2xl opacity-30 bg-[#faaf2e]"
          />
          <Flame
            className="h-16 w-16 text-[#faaf2e] opacity-45"
            strokeWidth={1.5}
          />
        </div>

        {/* Title */}
        <h1 className="text-[22px] sm:text-2xl font-bold tracking-tight text-foreground">
          {isKo ? '이 길은 막다름.' : "This path doesn't lead anywhere."}
        </h1>

        {/* Subtitle */}
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {isKo
            ? 'Ember이 진짜 길 안내해줌.'
            : 'Ember can help you find a real one.'}
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#faaf2e] text-[#4b3002] font-semibold h-11 px-6 w-full sm:w-auto transition-all hover:brightness-110 active:scale-[0.98]"
          >
            {isKo ? '홈으로' : 'Go home'}
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl h-11 px-6 w-full sm:w-auto text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            {isKo ? '대시보드' : 'Open dashboard'}
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { Flame } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { lang } = useI18n();
  const isKo = lang === 'ko';

  useEffect(() => {
    // Log for observability; never surface raw error to user.
    console.error('[error-boundary]', error);
  }, [error]);

  return (
    <div
      data-landing-page
      className="min-h-dvh flex items-center justify-center px-6 py-10 bg-background text-foreground"
    >
      <div className="flex flex-col items-center text-center max-w-sm w-full">
        {/* Ember flame with dimmed glow + flicker animation */}
        <div className="relative mb-10">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full blur-3xl opacity-30 bg-[#faaf2e] ember-flicker-glow"
          />
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#faaf2e]/10 ring-1 ring-[#faaf2e]/25">
            <Flame
              className="h-9 w-9 text-[#faaf2e] ember-flicker"
              strokeWidth={1.75}
              fill="currentColor"
              fillOpacity={0.08}
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-[22px] sm:text-2xl font-extrabold tracking-tight text-foreground leading-tight">
          {isKo ? '불이 잠시 꺼짐.' : 'Something dimmed.'}
        </h1>

        {/* Subtitle */}
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-[18rem]">
          {isKo
            ? '다시 켜는 중. 잠시 후 재시도.'
            : "We're relighting it. Try again in a moment."}
        </p>

        {/* CTA — calls reset(), not a reload */}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-10 inline-flex w-full items-center justify-center rounded-xl bg-[#faaf2e] text-[#4b3002] font-semibold h-12 px-6 transition-all hover:brightness-110 active:scale-[0.98] shadow-[0_10px_30px_-10px_rgba(250,175,46,0.6)]"
        >
          {isKo ? '재시도' : 'Try again'}
        </button>
      </div>

      {/* Flicker keyframes — scoped via styled-jsx */}
      <style jsx>{`
        :global(.ember-flicker) {
          animation: ember-flicker 2.8s ease-in-out infinite;
          transform-origin: center bottom;
          will-change: opacity, transform;
        }
        :global(.ember-flicker-glow) {
          animation: ember-flicker-glow 2.8s ease-in-out infinite;
          will-change: opacity, transform;
        }
        @keyframes ember-flicker {
          0%,
          100% {
            opacity: 0.95;
            transform: scale(1);
          }
          18% {
            opacity: 0.55;
            transform: scale(0.985);
          }
          32% {
            opacity: 0.9;
            transform: scale(1.01);
          }
          46% {
            opacity: 0.4;
            transform: scale(0.97);
          }
          58% {
            opacity: 0.85;
            transform: scale(1);
          }
          74% {
            opacity: 0.6;
            transform: scale(0.99);
          }
          86% {
            opacity: 0.92;
            transform: scale(1.005);
          }
        }
        @keyframes ember-flicker-glow {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          30% {
            opacity: 0.15;
            transform: scale(0.92);
          }
          50% {
            opacity: 0.35;
            transform: scale(1.05);
          }
          70% {
            opacity: 0.18;
            transform: scale(0.95);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.ember-flicker),
          :global(.ember-flicker-glow) {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

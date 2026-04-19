'use client';

/**
 * Global error boundary — replaces root layout on catastrophic errors.
 * Providers (i18n, theme, wallet) are NOT available here,
 * so we inline styles, detect locale from navigator, and respect
 * prefers-color-scheme via CSS.
 */

import { useEffect, useState } from 'react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isKo, setIsKo] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsKo(navigator.language?.toLowerCase().startsWith('ko') ?? false);
    }
  }, []);

  const copy = isKo
    ? {
        title: '불이 잠시 꺼짐.',
        sub: '다시 켜는 중. 잠시 후 재시도.',
        extra: '계속 이러면 새로고침 또는 잠시 후 재방문.',
        cta: '새로고침',
      }
    : {
        title: 'Something dimmed.',
        sub: "We're relighting it. Try again in a moment.",
        extra: 'If this keeps happening, refresh or come back later.',
        cta: 'Reload',
      };

  return (
    <html lang={isKo ? 'ko' : 'en'}>
      <body>
        <style>{`
          :root {
            color-scheme: light dark;
          }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; }
          body {
            font-family: Pretendard, Sora, -apple-system, BlinkMacSystemFont,
              'Segoe UI', Roboto, sans-serif;
            background: #ffffff;
            color: #0a0a0a;
            -webkit-font-smoothing: antialiased;
          }
          @media (prefers-color-scheme: dark) {
            body {
              background: #0a0a0a;
              color: #f5f5f5;
            }
          }

          .ge-wrap {
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 16px;
          }
          .ge-card {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            max-width: 440px;
            width: 100%;
            text-align: center;
          }
          .ge-glow {
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            width: 240px;
            height: 240px;
            border-radius: 9999px;
            background: #faaf2e;
            opacity: 0.08;
            filter: blur(80px);
            pointer-events: none;
            z-index: 0;
          }
          .ge-ember {
            position: relative;
            z-index: 1;
            width: 72px;
            height: 72px;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: ge-stutter 2.6s ease-in-out infinite;
          }
          .ge-ember svg {
            width: 100%;
            height: 100%;
            filter: drop-shadow(0 0 12px rgba(250, 175, 46, 0.55));
          }
          @keyframes ge-stutter {
            0%,   100% { opacity: 1;    transform: scale(1); }
            18%        { opacity: 0.35; transform: scale(0.94); }
            22%        { opacity: 0.95; transform: scale(1.02); }
            48%        { opacity: 0.5;  transform: scale(0.96); }
            52%        { opacity: 1;    transform: scale(1); }
            72%        { opacity: 0.4;  transform: scale(0.95); }
            78%        { opacity: 1;    transform: scale(1.01); }
          }

          .ge-title {
            position: relative;
            z-index: 1;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.6px;
            line-height: 32px;
          }
          .ge-sub {
            position: relative;
            z-index: 1;
            margin: 0;
            font-size: 16px;
            font-weight: 400;
            line-height: 24px;
            opacity: 0.8;
          }
          .ge-extra {
            position: relative;
            z-index: 1;
            margin: 0;
            font-size: 13px;
            font-weight: 400;
            line-height: 20px;
            opacity: 0.55;
          }

          .ge-btn {
            position: relative;
            z-index: 1;
            margin-top: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            height: 44px;
            padding: 0 24px;
            border-radius: 12px;
            border: 1px solid rgba(250, 175, 46, 0.45);
            background: #faaf2e;
            color: #4b3002;
            font-family: inherit;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: -0.2px;
            cursor: pointer;
            transition: transform 120ms ease, background 120ms ease, box-shadow 120ms ease;
            box-shadow: 0 8px 24px -12px rgba(250, 175, 46, 0.6);
          }
          .ge-btn:hover { background: #f5a71a; transform: translateY(-1px); }
          .ge-btn:active { transform: translateY(0); }
          .ge-btn:focus-visible {
            outline: 2px solid #faaf2e;
            outline-offset: 2px;
          }
        `}</style>

        <div className="ge-wrap">
          <div className="ge-card">
            <div className="ge-glow" aria-hidden="true" />

            <div className="ge-ember" aria-hidden="true">
              {/* Lucide "flame" path */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#faaf2e"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
            </div>

            <h1 className="ge-title">{copy.title}</h1>
            <p className="ge-sub">{copy.sub}</p>
            <p className="ge-extra">{copy.extra}</p>

            <button type="button" className="ge-btn" onClick={() => reset()}>
              {copy.cta}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

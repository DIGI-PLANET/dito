'use client';

/**
 * Global error boundary — replaces root layout on catastrophic errors.
 * Providers (i18n, theme, wallet) are NOT available here,
 * so we use inline translations and minimal styling.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0a0a0a', color: '#e5e5e5' }}>
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
          {/* Top-left back button */}
          <div style={{ padding: '12px 16px' }}>
            <button
              onClick={handleBack}
              style={{ fontSize: '14px', color: '#a3a3a3', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            >
              ←
            </button>
          </div>

          {/* Center content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px', gap: '16px' }}>
            <span style={{ fontSize: '60px' }}>🔥</span>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Something Went Wrong</h1>
            <p style={{ fontSize: '14px', color: '#a3a3a3', textAlign: 'center', maxWidth: '280px', margin: 0 }}>
              An unexpected error occurred. Please try again.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={reset}
                style={{ padding: '8px 24px', borderRadius: '12px', border: '1px solid rgba(255,107,53,0.4)', background: 'transparent', color: '#ff6b35', cursor: 'pointer', fontSize: '14px' }}
              >
                Try Again
              </button>
              <button
                onClick={handleBack}
                style={{ padding: '8px 24px', borderRadius: '12px', border: 'none', background: '#ff6b35', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

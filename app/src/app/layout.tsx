import type { Metadata, Viewport } from 'next';
import { Unbounded, Geist, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { I18nProvider } from '@/providers/i18n-provider';
import { PhantomProvider } from '@/providers/phantom-provider';
import { Header } from '@/components/layout/header';
import { TabBar } from '@/components/layout/tab-bar';
import { CookieBanner } from '@/components/layout/cookie-banner';
import { ConsoleEasterEgg } from '@/components/layout/console-easter-egg';
import { PWAWrapper } from '@/components/pwa/pwa-wrapper';
import { SessionManager } from '@/components/auth/session-manager';

const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-unbounded',
  weight: ['300', '400', '500', '700'],
  display: 'swap',
});
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const revalidate = 0;

export const metadata: Metadata = {
  title: "DITO — Don't Ignore The One you are",
  description:
    'DITO는 네 안의 가장 작은 불꽃(Ember)을 찾아 지키는 AI 플랫폼. Ember와 매일 한 줄을 쓰며 잠재력을 키워간다. Make your fantasy a reality.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: "DITO — Don't Ignore The One you are",
    description: 'Keep one Ember alive. Make your fantasy a reality.',
    url: 'https://dito.guru',
    siteName: 'DITO',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@0xDARGONNE',
    site: '@0xDARGONNE',
  },
  keywords: [
    'DITO', 'Ember', 'AI coaching', 'talent discovery', 'AI 코치',
    'personal development', '잠재력', 'Web3', 'NFT', 'Solana', 'Soulbound Token', 'SBT',
    '재능 발견', '자아 발견', '숨겨진 재능', 'hidden talent',
    'Make your fantasy a reality', 'Find your Ember', "Don't Ignore The One you are",
  ],
  category: 'education',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'DITO',
  description:
    'AI-powered platform to keep your potential alive. Find your Ember, tend it daily, make fantasy reality.',
  url: 'https://dito.guru',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '1.00',
    priceCurrency: 'USD',
    priceValidUntil: '2027-12-31',
  },
  creator: {
    '@type': 'Organization',
    name: 'DIGI PLANET',
    url: 'https://dito.guru',
  },
  keywords: 'AI coaching, talent discovery, personal development, Web3, NFT, Solana, Ember, SBT',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* SECURITY: dangerouslySetInnerHTML is safe here — jsonLd is a
            static object defined in this file, serialised via JSON.stringify
            which escapes </script> and other HTML-special sequences. No user
            input flows into this value. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${unbounded.variable} ${geist.variable} ${jetbrains.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <PhantomProvider>
            <I18nProvider>
              <PWAWrapper>
                <div className="app-outer">
                  {/* PC Left Side Panel */}
                  <div className="pc-side-panel">
                    <div className="pc-side-content">
                      <div className="pc-logo">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/ember-logo.png"
                          alt=""
                          aria-hidden
                          className="pc-logo-mark"
                        />
                        <span className="text-ember">DITO</span>
                      </div>
                      <p className="pc-slogan">
                        <span className="text-ember">D</span>on&apos;t{' '}
                        <span className="text-ember">I</span>gnore{' '}
                        <span className="text-ember">T</span>he{' '}
                        <span className="text-ember">O</span>ne
                        <br />
                        you are
                      </p>
                      <p className="pc-tagline">
                        Keep one Ember alive.
                        <br />
                        Find your Ember.
                      </p>

                      <div className="pc-social">
                        <a
                          href="https://x.com/0xDARGONNE"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pc-social-icon"
                          aria-label="Twitter/X"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </a>
                        <a
                          href="https://discord.gg/6Cjn2sJZrV"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pc-social-icon"
                          aria-label="Discord"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
                          </svg>
                        </a>
                      </div>

                      <p className="pc-copyright">© 2026 DIGI PLANET</p>
                    </div>
                  </div>

                  <div className="app-frame">
                    <Header />
                    <main className="app-content">{children}</main>
                    <TabBar />
                  </div>
                </div>
                <CookieBanner />
                <ConsoleEasterEgg />
                <SessionManager />
              </PWAWrapper>
            </I18nProvider>
          </PhantomProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

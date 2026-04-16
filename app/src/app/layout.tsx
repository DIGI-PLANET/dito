import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { I18nProvider } from '@/providers/i18n-provider';
import { WalletProvider } from '@/providers/wallet-provider';
import { Header } from '@/components/layout/header';
import { TabBar } from '@/components/layout/tab-bar';
import { CookieBanner } from '@/components/layout/cookie-banner';
import { ConsoleEasterEgg } from '@/components/layout/console-easter-egg';
import { PWAWrapper } from '@/components/pwa/pwa-wrapper';
import { SessionManager } from '@/components/auth/session-manager';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoKR = Noto_Sans_KR({ subsets: ['latin'], variable: '--font-noto-kr', weight: ['400', '500', '700'] });

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'DITO.guru — Don\'t Ignore The One you are',
  description: 'AI 코치 Ember와 함께하는 숨겨진 재능 발견 플랫폼. 버튼 기반 재능 탐색, 일대일 AI 코칭, Soul NFT 민팅으로 재능을 현실로. Make your fantasy a reality. Find your Ember 🔥',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: "DITO.guru — Don't Ignore The One you are",
    description: 'Make your fantasy a reality. Find your Ember 🔥',
    url: 'https://dito.guru',
    siteName: 'DITO.guru',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@0xDARGONNE',
    site: '@0xDARGONNE',
  },
  keywords: [
    'AI coaching', '재능 발견', 'talent discovery', 'personal development', 'Web3', 'NFT', 'Solana', 'DARGONNE',
    '숨겨진 재능', 'hidden talent', 'AI 코치', 'personal coach', 'Ember', '불꽃', 'flame spirit',
    '자아 발견', 'self discovery', '진로 탐색', 'career exploration', '재능 개발', 'talent development',
    'Soulbound Token', 'SBT', '온체인 정체성', 'blockchain identity', '빌런', 'villain', 
    'Don\'t Ignore The One you are', 'Find your Ember', 'Make your fantasy a reality'
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
  name: 'DITO.guru',
  description: 'AI-powered talent discovery platform. Find your hidden talents with Ember, your personal AI guide.',
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
  keywords: 'AI coaching, talent discovery, personal development, Web3, NFT, Solana',
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
      <body className={`${inter.variable} ${notoKR.variable} font-sans antialiased`}>
        <ThemeProvider>
          <WalletProvider>
          <I18nProvider>
            <PWAWrapper>
            <div className="app-outer">
              {/* PC Left Side Panel */}
              <div className="pc-side-panel">
                <div className="pc-side-content">
                  <div className="pc-logo">
                    <span className="text-[#ff6b35]">DITO</span>
                    <span className="dark:text-white/80 text-black/60">.guru</span>
                  </div>
                  <p className="pc-slogan"><span className="text-[#ff6b35]">D</span>on&apos;t <span className="text-[#ff6b35]">I</span>gnore <span className="text-[#ff6b35]">T</span>he <span className="text-[#ff6b35]">O</span>ne<br />you are</p>
                  <p className="pc-tagline">Make your fantasy a reality.<br />Find your Ember 🔥</p>

                  <div className="pc-social">
                    <a href="https://x.com/0xDARGONNE" target="_blank" rel="noopener noreferrer" className="pc-social-icon" aria-label="Twitter/X">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                    <a href="https://discord.gg/6Cjn2sJZrV" target="_blank" rel="noopener noreferrer" className="pc-social-icon" aria-label="Discord">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/></svg>
                    </a>
                    <a href="https://t.me/ditoguru" target="_blank" rel="noopener noreferrer" className="pc-social-icon" aria-label="Telegram">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    </a>
                    <a href="https://www.reddit.com/r/DITOGURU" target="_blank" rel="noopener noreferrer" className="pc-social-icon" aria-label="Reddit">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
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
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

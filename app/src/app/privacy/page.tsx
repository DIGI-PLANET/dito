'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUp } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';

const content = {
  en: {
    title: 'Privacy Policy',
    subtitle: '개인정보 처리방침',
    lastUpdated: 'Last updated: February 16, 2026',
    backToTop: 'Back to top',
    back: 'Back',
    sections: [
      {
        heading: '1. Company',
        body: 'This service ("DITO") is operated by DIGI PLANET This Privacy Policy explains how we collect, use, and protect your information when you use the DITO platform.',
      },
      {
        heading: '2. Data We Collect',
        body: '• Wallet address — Your Solana wallet address (Phantom, Solflare, or Trust Wallet) is collected upon connection and is required to use the service.\n• Chat data — Messages exchanged with Ember during talent discovery and daily coaching sessions.\n• Diary entries — Daily text entries, photos, and evidence files uploaded as part of your talent coaching journey.\n• Soul (SBT) data — Talent labels, trait analysis, growth stage, discovery/mint dates, proof hashes, entry counts, and streaks for each of your Ember Souls.\n• Usage data — Interaction patterns used to improve AI coaching quality and determine minting eligibility.',
      },
      {
        heading: '3. How We Use Your Data',
        body: '• AI Processing — Your chat messages and diary entries are processed by AI (Google Gemini API) to provide talent discovery, daily coaching, and minting readiness assessment. Recent conversation history (today + 3-day summary) is sent as context.\n• Soul Minting — Your talent data is compiled into a Soul (Soulbound Token) on the Solana blockchain when you and Ember agree you are ready.\n• Service Improvement — Anonymized usage patterns may be used to improve the coaching experience.',
      },
      {
        heading: '4. Data Storage',
        body: '• All personal data including conversations, diary entries, and profile information is stored securely on our servers (Supabase PostgreSQL with encryption at rest).\n• Cookies are used for session management and user preferences.\n• Clearing your browser cookies will reset your session. Your data remains safe on our servers.',
      },
      {
        heading: '5. Photos & Evidence Uploads',
        body: 'Photos and files uploaded as talent evidence are stored on our secure servers. They are not shared with third parties.',
      },
      {
        heading: '6. Wallet Data',
        body: 'We only store your public wallet address. We never request or access your private keys, seed phrases, or wallet funds beyond the $1 Soul minting transaction that you explicitly approve.',
      },
      {
        heading: '7. On-Chain Data',
        body: 'When you mint an Ember Soul ($1 per Soul), the following data is recorded on the Solana blockchain: talent label, trait summary, proof hash, and mint date. On-chain data is public by nature and cannot be modified or deleted. Each Soul is a Soulbound Token (SBT) permanently linked to your wallet.',
      },
      {
        heading: '8. Growth Stages & Decay',
        body: 'Each Soul progresses through independent growth stages (Sparked → Burning → Blazing → Radiant → Eternal). Stage data and decay status are tracked locally. From the Blazing stage onward, real name verification is required for identity purposes. Decay from inactivity may cause stage regression but does not delete your data.',
      },
      {
        heading: '9. Identity Verification',
        body: 'Real name verification is required starting at the Blazing stage. This information is used solely for trust and verification purposes within the DITO ecosystem and is not shared externally. In later phases, peer verification may also be used to validate talent claims.',
      },
      {
        heading: '10. Third Parties',
        body: 'We do not sell or share your personal data with third parties. Third-party services used:\n• Google Gemini API — for AI chat processing (conversation data is sent per their API terms)\n• Solana blockchain — for Soul minting (on-chain data is public)\n• Wallet providers (Phantom, Solflare, Trust Wallet) — for authentication only',
      },
      {
        heading: '11. Seeker\u2019s Rights',
        body: '• Access — You can view all your data through your account dashboard.\n• Deletion — You can request deletion of your account data by disconnecting your wallet. On-chain Soul data cannot be deleted.\n• Portability — You may export your diary and Soul data from your account.\n• Opt-out — You may stop using the service at any time. Disconnecting your wallet ends data collection.',
      },
      {
        heading: '12. Data Security',
        body: 'Data is stored securely on Supabase (PostgreSQL) with encryption at rest and in transit. Cookies are used with SameSite=Strict and Secure flags for session management.',
      },
      {
        heading: '13. Children',
        body: 'DITO is not intended for Seekers under 13 years of age. We do not knowingly collect data from children under 13.',
      },
      {
        heading: '14. Changes to This Policy',
        body: 'DIGI PLANET reserves the right to update this Privacy Policy at any time. Significant changes will be communicated through the service.',
      },
      {
        heading: '15. Contact',
        body: 'For privacy inquiries, contact us at: privacy@dito.guru',
      },
    ],
  },
  ko: {
    title: '개인정보 처리방침',
    subtitle: 'Privacy Policy',
    lastUpdated: '최종 수정일: 2026년 2월 16일',
    backToTop: '맨 위로',
    back: '뒤로',
    sections: [
      {
        heading: '1. 회사',
        body: '이 서비스("DITO")는 DIGI PLANET에 의해 운영됩니다. 본 개인정보 처리방침은 DITO 플랫폼 이용 시 수집, 사용, 보호되는 정보에 대해 설명합니다.',
      },
      {
        heading: '2. 수집하는 데이터',
        body: '• 지갑 주소 — 서비스 이용에 필수인 Solana 지갑 주소(Phantom, Solflare, Trust Wallet)를 연결 시 수집합니다.\n• 채팅 데이터 — 재능 디스커버리 및 일일 코칭 중 Ember와 주고받은 메시지를 수집합니다.\n• 다이어리 항목 — 재능 코칭 과정의 일일 텍스트 기록, 사진, 증거 파일을 수집합니다.\n• Soul(SBT) 데이터 — 각 Ember Soul의 재능 라벨, 특성 분석, 성장 단계, 디스커버리/민팅 날짜, 증명 해시, 기록 수, 연속 기록을 수집합니다.\n• 이용 데이터 — AI 코칭 품질 향상 및 민팅 자격 판단을 위한 상호작용 패턴을 수집합니다.',
      },
      {
        heading: '3. 데이터 사용 목적',
        body: '• AI 처리 — 채팅 메시지와 다이어리 항목은 AI(Google Gemini API)를 통해 재능 발견, 일일 코칭, 민팅 준비도 평가에 활용됩니다. 최근 대화 기록(당일 + 3일 요약)이 컨텍스트로 전송됩니다.\n• Soul 민팅 — Seeker와 Ember가 준비되었다고 합의하면 재능 데이터가 Solana 블록체인의 Soul(Soulbound Token)로 컴파일됩니다.\n• 서비스 개선 — 익명화된 이용 패턴이 코칭 경험 개선에 사용될 수 있습니다.',
      },
      {
        heading: '4. 데이터 저장',
        body: '• MVP 단계(현재) — 대화, 다이어리, 사진, 프로필 등 모든 개인 데이터는 서버(Supabase PostgreSQL)에 암호화하여 안전하게 저장됩니다. 세션 관리와 설정에는 쿠키가 사용됩니다.\n• Phase 2(예정) — 크로스 디바이스 접근, 과거 기록 시맨틱 검색, 향상된 AI 코칭을 위해 Supabase(PostgreSQL + pgvector)로 암호화 마이그레이션됩니다.\n• 브라우저 쿠키를 삭제하면 세션 설정이 초기화됩니다. 데이터는 서버에 안전하게 보관됩니다.',
      },
      {
        heading: '5. 사진 및 증거 업로드',
        body: 'MVP 기간 동안 재능 증거로 업로드된 사진과 파일은 기기에 로컬 저장됩니다. 외부 서버로 전송되거나 제3자와 공유되지 않습니다. 향후 단계에서는 암호화된 보안 서버에 저장됩니다.',
      },
      {
        heading: '6. 지갑 데이터',
        body: '공개 지갑 주소만 저장합니다. 개인 키, 시드 구문, 또는 Seeker가 명시적으로 승인한 $1 Soul 민팅 거래 외의 지갑 자금에 접근하거나 요청하지 않습니다.',
      },
      {
        heading: '7. 온체인 데이터',
        body: 'Ember Soul 민팅(Soul당 $1) 시 재능 라벨, 특성 요약, 증명 해시, 민팅 날짜가 Solana 블록체인에 기록됩니다. 온체인 데이터는 본질적으로 공개되며 수정하거나 삭제할 수 없습니다. 각 Soul은 지갑에 영구적으로 연결되는 Soulbound Token(SBT)입니다.',
      },
      {
        heading: '8. 성장 단계 및 디케이',
        body: '각 Soul은 독립적인 성장 단계(Sparked → Burning → Blazing → Radiant → Eternal)를 거칩니다. 단계 데이터와 디케이 상태는 로컬에서 추적됩니다. Blazing 단계부터는 신원 확인을 위해 실명 인증이 필요합니다. 비활동으로 인한 디케이는 단계 퇴보를 유발할 수 있으나 데이터가 삭제되지는 않습니다.',
      },
      {
        heading: '9. 신원 확인',
        body: 'Blazing 단계부터 실명 인증이 필요합니다. 이 정보는 DITO 생태계 내 신뢰 및 검증 목적으로만 사용되며 외부에 공유되지 않습니다. 향후 단계에서는 피어 검증 시스템이 재능 주장을 검증하는 데 활용될 수 있습니다.',
      },
      {
        heading: '10. 제3자 제공',
        body: '개인 데이터를 제3자에게 판매하거나 공유하지 않습니다. 사용되는 제3자 서비스:\n• Google Gemini API — AI 채팅 처리(대화 데이터는 해당 API 약관에 따라 전송)\n• Solana 블록체인 — Soul 민팅(온체인 데이터는 공개)\n• 지갑 제공자(Phantom, Solflare, Trust Wallet) — 인증 목적만',
      },
      {
        heading: '11. Seeker의 권리',
        body: '• 열람권 — 계정 대시보드를 통해 모든 데이터를 열람할 수 있습니다.\n• 삭제권 — 계정 데이터 삭제를 요청할 수 있습니다. 지갑 연결 해제 또는 문의를 통해 가능합니다. 온체인 Soul 데이터는 삭제할 수 없습니다.\n• 이동권 — 다이어리 및 Soul 데이터를 계정에서 내보낼 수 있습니다.\n• 거부권 — 언제든지 서비스 이용을 중단할 수 있습니다. 지갑 연결 해제 시 데이터 수집이 종료됩니다.',
      },
      {
        heading: '12. 데이터 보안',
        body: '데이터는 Supabase(PostgreSQL)에 저장 시 및 전송 시 암호화되어 안전하게 보관됩니다. 쿠키는 SameSite=Strict 및 Secure 플래그와 함께 사용됩니다.',
      },
      {
        heading: '13. 아동',
        body: 'DITO는 13세 미만을 대상으로 하지 않습니다. 13세 미만 아동의 데이터를 의도적으로 수집하지 않습니다.',
      },
      {
        heading: '14. 방침 변경',
        body: 'DIGI PLANET는 언제든지 본 개인정보 처리방침을 수정할 권리를 보유합니다. 중요한 변경 사항은 서비스를 통해 안내됩니다.',
      },
      {
        heading: '15. 연락처',
        body: '개인정보 관련 문의: privacy@dito.guru',
      },
    ],
  },
};

export default function PrivacyPage() {
  const { lang } = useI18n();
  const c = content[lang];
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      data-landing-page
      className="relative min-h-screen w-full bg-background text-foreground"
    >
      {/* Sticky top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-14 max-w-[720px] items-center gap-3 px-4 md:px-8">
          <Link
            href="/"
            aria-label={c.back}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {c.title}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-8 md:px-8 md:pt-12">
        {/* Hero heading */}
        <div className="mb-10 md:mb-14">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
            {c.title}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground md:text-xl">
            {c.subtitle}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[#faaf2e]" />
            {c.lastUpdated}
          </div>
        </div>

        {/* Sections */}
        <article className="prose prose-neutral max-w-none dark:prose-invert">
          {c.sections.map((s, i) => (
            <section key={i} className="mb-8 scroll-mt-24">
              <h2 className="mb-3 mt-8 text-xl font-semibold tracking-tight text-foreground first:mt-0 md:text-2xl">
                {s.heading}
              </h2>
              <p className="whitespace-pre-line text-[15px] leading-7 text-muted-foreground md:text-base md:leading-8">
                {s.body}
              </p>
            </section>
          ))}
        </article>

        {/* Footer */}
        <div className="mt-16 flex flex-col items-center gap-3 border-t border-border pt-8">
          <p className="text-xs text-muted-foreground">{c.lastUpdated}</p>
          <button
            type="button"
            onClick={scrollToTop}
            className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {c.backToTop}
          </button>
        </div>
      </main>

      {/* Floating back to top */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label={c.backToTop}
          className="fixed bottom-6 right-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#faaf2e] text-[#4b3002] shadow-lg transition-all hover:brightness-110 md:bottom-10 md:right-10"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

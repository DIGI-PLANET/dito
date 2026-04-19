'use client';

import { useI18n } from '@/providers/i18n-provider';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUp, ChevronDown, ChevronUp } from 'lucide-react';

const content = {
  en: {
    navTitle: 'Terms of Service',
    heroTitle: 'Terms of\nService',
    heroSubtitle: '서비스 약관',
    lastUpdatedLabel: 'LAST UPDATED',
    lastUpdatedValue: 'February 16, 2026',
    tocLabel: 'Table of Contents',
    backToTop: 'Back to top',
    footer: 'DITO Soul  -  Terms of Service',
    sections: [
      {
        heading: '1. Service Provider',
        body: 'DITO ("the Service") is provided by DIGI PLANET By connecting your wallet and using the Service, you agree to these Terms of Service.',
      },
      {
        heading: '2. Service Description',
        body: 'DITO is a talent discovery and growth platform powered by an AI companion called Ember. The Service includes:\n• Talent Discovery — Free AI-guided conversations to identify your talents\n• Daily Coaching — Free daily diary entries with Ember feedback and coaching\n• Soul Minting — Paid ($1) creation of Soulbound Tokens (SBTs) on Solana as proof of talent\n• Soul Portfolio — Management of multiple Souls representing your talent portfolio\n• Growth System — Stage-based progression for each Soul with decay mechanics',
      },
      {
        heading: '3. Wallet Requirement',
        body: 'A Solana-compatible wallet (Phantom, Solflare, or Trust Wallet) is required to use DITO. You are solely responsible for the security of your wallet, private keys, and seed phrase. DITO will never ask for your private keys.',
      },
      {
        heading: '4. Free & Paid Features',
        body: '• Free — Talent discovery chat with Ember and daily coaching/diary features are completely free. Only a wallet connection is required.\n• Paid — Minting an Ember Soul costs $1 (재능 증명 비용, "talent proof cost") per Soul. This is the cost of proving "this talent is truly mine" on-chain. The $1 minting fee is non-refundable under any circumstances.',
      },
      {
        heading: '5. Soul Minting Eligibility',
        body: 'To mint an Ember Soul, you must:\n• Complete talent discovery with Ember (determine a talent direction)\n• Record at least 7 days of diary coaching entries\n• Provide at least 1 concrete evidence item (photo/result)\n• Receive Ember\'s "ready" assessment (AI-based determination)\n• Pay the $1 minting fee\nMinting requires mutual agreement between you and Ember — it is not forced.',
      },
      {
        heading: '6. Ember Soul Ownership',
        body: '• Each Ember Soul is a Soulbound Token (SBT) — non-transferable and permanently bound to your wallet.\n• 1 talent = 1 Soul. Each talent is minted as a separate Soul.\n• You may hold multiple Souls, forming a talent portfolio.\n• Each Soul contains: talent label, traits, growth stage, proof hash, and activity metrics.\n• Souls cannot be sold, traded, or transferred to another wallet.',
      },
      {
        heading: '7. Growth Stages & Decay',
        body: 'Each Soul progresses through independent growth stages:\n• ⚡ Sparked — Upon minting. Decays after 7 days of inactivity → Dormant\n• 🔥 Burning — 14+ days recorded, 3+ challenges. Decays after 14 days → Sparked\n• 🔥🔥 Blazing — 30+ days, 1+ peer recognition. Decays after 21 days → Burning\n• ✨ Radiant — 60+ days, battle participation. Decays after 30 days → Blazing\n• 💎 Eternal — 90+ days, Dragon\'s Trial passed. Never decays\n\nDormant Souls remain in your portfolio (displayed dimmed) and can be reactivated by resuming diary activity. Decay does not delete your data.',
      },
      {
        heading: '8. Identity Verification',
        body: 'Real name verification is required from the Blazing stage onward. This is necessary for trust and peer verification within the DITO ecosystem. Failure to verify may prevent further stage progression.',
      },
      {
        heading: '9. User Obligations',
        body: 'You agree to:\n• Provide honest and authentic diary entries and evidence\n• Not fabricate, plagiarize, or misrepresent talent evidence\n• Maintain the security of your wallet\n• Comply with all applicable laws\n• Not attempt to manipulate the AI system or growth mechanics\n• Not use the service for any illegal, harmful, or dangerous activities',
      },
      {
        heading: '10. Prohibited Conduct',
        body: 'The following are strictly prohibited:\n• Claiming talents related to illegal, harmful, or dangerous activities\n• Submitting fraudulent evidence or diary entries\n• Attempting to circumvent the minting eligibility requirements\n• Harassing other users or Ember\n• Reverse-engineering or exploiting the AI system\n• Creating multiple accounts to bypass restrictions',
      },
      {
        heading: '11. 3-Strike Reset Policy',
        body: 'Violations of these Terms or community guidelines result in strikes:\n• Strike 1 — Warning and temporary feature restriction\n• Strike 2 — Extended restriction and Trust Score penalty\n• Strike 3 — Complete reset of all Ember Souls and associated data\nStrikes are assessed at the sole discretion of DIGI PLANET',
      },
      {
        heading: '12. Trust Score',
        body: 'DITO maintains a Trust Score for each user. Honest behavior increases your score; dishonesty, manipulation, or violations decrease it. A low Trust Score may limit access to certain features.',
      },
      {
        heading: '13. AI Disclaimer',
        body: 'Ember is an AI companion, not a certified counselor or professional advisor. AI assessments of talent readiness are algorithmic and may not be perfect. DITO does not guarantee any professional, educational, or career outcomes from using the Service.',
      },
      {
        heading: '14. Service Availability',
        body: 'This service is provided "as-is" during the MVP phase. Features may change, be added, or be removed without prior notice. DIGI PLANET is not liable for service interruptions, data loss, or blockchain network issues.',
      },
      {
        heading: '15. Intellectual Property',
        body: 'You retain ownership of your diary entries and uploaded content. By minting a Soul, you grant DIGI PLANET a non-exclusive license to display your Soul data within the DITO platform. The DITO brand, Ember character, and platform design are the property of DIGI PLANET',
      },
      {
        heading: '16. Dispute Resolution',
        body: 'Any disputes arising from these Terms shall be resolved through good-faith negotiation first. If unresolved, disputes shall be submitted to the competent court in the jurisdiction of DIGI PLANET\'s registered office in the Republic of Korea.',
      },
      {
        heading: '17. Age Requirement',
        body: 'Users must be 13 years of age or older to use DITO. If we discover a user is under 13, their account and data will be removed.',
      },
      {
        heading: '18. Modifications',
        body: 'DIGI PLANET reserves the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the revised Terms.',
      },
      {
        heading: '19. Contact',
        body: 'For inquiries regarding these Terms, contact us at: privacy@dito.guru',
      },
    ],
  },
  ko: {
    navTitle: '이용약관',
    heroTitle: '이용약관',
    heroSubtitle: 'Terms of Service',
    lastUpdatedLabel: '최종 수정일',
    lastUpdatedValue: '2026년 2월 16일',
    tocLabel: '목차',
    backToTop: '맨 위로',
    footer: 'DITO Soul  -  이용약관',
    sections: [
      {
        heading: '1. 서비스 제공자',
        body: 'DITO("서비스")는 DIGI PLANET에 의해 제공됩니다. 지갑을 연결하고 서비스를 이용함으로써 본 이용약관에 동의하게 됩니다.',
      },
      {
        heading: '2. 서비스 설명',
        body: 'DITO는 AI 동반자 Ember가 지원하는 재능 발견 및 성장 플랫폼입니다. 서비스에는 다음이 포함됩니다:\n• 재능 디스커버리 — 재능을 파악하기 위한 무료 AI 대화\n• 일일 코칭 — Ember 피드백과 코칭이 포함된 무료 일일 다이어리\n• Soul 민팅 — 재능 증명으로 Solana에 Soulbound Token(SBT) 생성 (유료, $1)\n• Soul 포트폴리오 — 재능 포트폴리오를 나타내는 다수의 Soul 관리\n• 성장 시스템 — 각 Soul별 디케이 메커닉이 포함된 단계별 성장',
      },
      {
        heading: '3. 지갑 필수',
        body: 'DITO 이용에는 Solana 호환 지갑(Phantom, Solflare, Trust Wallet)이 필수입니다. 지갑, 개인 키, 시드 구문의 보안은 전적으로 Seeker의 책임입니다. DITO는 절대로 개인키를 요청하지 않습니다.',
      },
      {
        heading: '4. 무료 및 유료 기능',
        body: '• 무료 — Ember와의 재능 디스커버리 대화 및 일일 코칭/다이어리 기능은 완전 무료입니다. 지갑 연결만 필요합니다.\n• 유료 — Ember Soul 민팅은 Soul당 $1(재능 증명 비용)입니다. 이것은 "이 재능이 진짜 내 거다"를 온체인에 증명하는 비용입니다. $1 민팅 수수료는 어떠한 경우에도 환불되지 않습니다.',
      },
      {
        heading: '5. Soul 민팅 자격',
        body: 'Ember Soul을 민팅하려면 다음 조건을 충족해야 합니다:\n• Ember와 재능 디스커버리 완료 (재능 방향 결정)\n• 최소 7일간의 다이어리 코칭 기록\n• 최소 1건의 구체적 증거 제출 (사진/결과물)\n• Ember의 "준비됐어" 판단 (AI 기반)\n• $1 민팅 비용 결제\n민팅은 Seeker와 Ember의 합의가 필요하며, 강제되지 않습니다.',
      },
      {
        heading: '6. Ember Soul 소유권',
        body: '• 각 Ember Soul은 Soulbound Token(SBT)으로, 양도 불가하며 지갑에 영구적으로 연결됩니다.\n• 1 재능 = 1 Soul. 각 재능은 별도의 Soul로 민팅됩니다.\n• 다수의 Soul을 보유하여 재능 포트폴리오를 구성할 수 있습니다.\n• 각 Soul에는 재능 라벨, 특성, 성장 단계, 증명 해시, 활동 지표가 포함됩니다.\n• Soul은 판매, 거래, 다른 지갑으로 이전할 수 없습니다.',
      },
      {
        heading: '7. 성장 단계 및 디케이',
        body: '각 Soul은 독립적인 성장 단계를 거칩니다:\n• ⚡ Sparked — 민팅 완료 시. 7일 미활동 시 Dormant로 디케이\n• 🔥 Burning — 14일+ 기록, 챌린지 3개+. 14일 미활동 시 Sparked로 디케이\n• 🔥🔥 Blazing — 30일+, 피어 인정 1회+. 21일 미활동 시 Burning으로 디케이\n• ✨ Radiant — 60일+, 배틀 참가. 30일 미활동 시 Blazing로 디케이\n• 💎 Eternal — 90일+, Dragon\'s Trial 통과. 디케이 없음\n\nDormant Soul은 포트폴리오에 흐리게 표시되며, 다이어리 활동을 재개하면 재활성화됩니다. 디케이는 데이터를 삭제하지 않습니다.',
      },
      {
        heading: '8. 신원 확인',
        body: 'Blazing 단계부터 실명 인증이 필요합니다. 이는 DITO 생태계 내 신뢰 및 피어 검증을 위해 필요합니다. 인증 미완료 시 추가 단계 진행이 제한될 수 있습니다.',
      },
      {
        heading: '9. Seeker 의무',
        body: 'Seeker는 다음에 동의합니다:\n• 정직하고 진정성 있는 다이어리 항목 및 증거를 제공할 것\n• 재능 증거를 조작, 표절, 허위 표시하지 않을 것\n• 지갑 보안을 유지할 것\n• 모든 관련 법률을 준수할 것\n• AI 시스템이나 성장 메커닉을 조작하려 시도하지 않을 것\n• 불법적, 유해한, 위험한 활동에 서비스를 사용하지 않을 것',
      },
      {
        heading: '10. 금지 행위',
        body: '다음 행위는 엄격히 금지됩니다:\n• 불법적, 유해한, 위험한 활동과 관련된 재능 주장\n• 허위 증거 또는 다이어리 항목 제출\n• 민팅 자격 요건 회피 시도\n• 다른 Seeker 또는 Ember에 대한 괴롭힘\n• AI 시스템 역공학 또는 악용\n• 제한을 우회하기 위한 다중 계정 생성',
      },
      {
        heading: '11. 3-Strike 리셋 정책',
        body: '본 약관 또는 커뮤니티 가이드라인 위반 시 제재가 부과됩니다:\n• Strike 1 — 경고 및 일시적 기능 제한\n• Strike 2 — 연장된 제한 및 Trust Score 감점\n• Strike 3 — 모든 Ember Soul 및 관련 데이터 완전 초기화\n제재는 DIGI PLANET의 재량에 따라 결정됩니다.',
      },
      {
        heading: '12. Trust Score',
        body: 'DITO는 각 Seeker의 Trust Score를 관리합니다. 정직한 행동은 점수를 높이고, 부정행위, 조작, 위반은 점수를 낮춥니다. 낮은 Trust Score는 일부 기능 접근을 제한할 수 있습니다.',
      },
      {
        heading: '13. AI 면책 조항',
        body: 'Ember는 AI 동반자이며, 공인 상담사나 전문 어드바이저가 아닙니다. 재능 준비도에 대한 AI 평가는 알고리즘 기반이며 완벽하지 않을 수 있습니다. DITO는 서비스 이용으로 인한 직업적, 교육적, 경력 관련 결과를 보장하지 않습니다.',
      },
      {
        heading: '14. 서비스 가용성',
        body: 'MVP 단계에서 이 서비스는 "있는 그대로" 제공됩니다. 기능은 사전 고지 없이 변경, 추가, 제거될 수 있습니다. DIGI PLANET는 서비스 중단, 데이터 손실, 블록체인 네트워크 문제에 대해 책임지지 않습니다.',
      },
      {
        heading: '15. 지적 재산권',
        body: '다이어리 항목 및 업로드된 콘텐츠의 소유권은 Seeker에게 있습니다. Soul 민팅 시 DITO 플랫폼 내에서 Soul 데이터를 표시할 수 있는 비독점적 라이선스를 DIGI PLANET에 부여합니다. DITO 브랜드, Ember 캐릭터, 플랫폼 디자인은 DIGI PLANET의 자산입니다.',
      },
      {
        heading: '16. 분쟁 해결',
        body: '본 약관으로 인한 분쟁은 우선 성실한 협의를 통해 해결합니다. 미해결 시 대한민국 내 DIGI PLANET 본사 소재지 관할 법원에 제출됩니다.',
      },
      {
        heading: '17. 연령 제한',
        body: 'DITO를 이용하려면 13세 이상이어야 합니다. 13세 미만 Seeker가 발견될 경우 계정 및 데이터가 삭제됩니다.',
      },
      {
        heading: '18. 약관 변경',
        body: 'DIGI PLANET는 언제든지 본 약관을 수정할 권리를 보유합니다. 변경 후 서비스를 계속 이용하면 수정된 약관에 동의하는 것으로 간주됩니다.',
      },
      {
        heading: '19. 연락처',
        body: '본 약관 관련 문의: privacy@dito.guru',
      },
    ],
  },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default function TermsPage() {
  const { lang } = useI18n();
  const c = content[lang];
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

  const sectionIds = useMemo(
    () => c.sections.map((s, i) => `sec-${i}-${slugify(s.heading)}`),
    [c.sections],
  );

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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setTocOpen(false);
  };

  return (
    <div
      data-landing-page
      className="relative min-h-screen w-full bg-background text-foreground antialiased overflow-x-hidden"
      style={{ fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      {/* Sticky top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[720px] items-center gap-3 px-4 md:px-8">
          <Link
            href="/"
            aria-label="Back"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-card hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[15px] font-semibold tracking-tight text-foreground">
            {c.navTitle}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-4 pb-20 pt-6 md:px-8 md:pt-10">
        {/* Hero */}
        <section className="mb-8 md:mb-10">
          <h2 className="whitespace-pre-line text-[34px] font-extrabold leading-[1.1] tracking-tight text-foreground md:text-[48px]">
            {c.heroTitle}
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="block h-4 w-[3px] rounded-sm bg-[#faaf2e]" aria-hidden />
            <span className="text-[15px] font-medium text-muted-foreground">
              {c.heroSubtitle}
            </span>
          </div>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#faaf2e]" aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {c.lastUpdatedLabel}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/80">
              {c.lastUpdatedValue}
            </span>
          </div>
        </section>

        {/* Table of contents */}
        <section className="mb-8">
          <button
            type="button"
            onClick={() => setTocOpen((v) => !v)}
            aria-expanded={tocOpen}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:border-[#faaf2e]/40 hover:bg-card/80"
          >
            <span className="text-[14px] font-semibold text-foreground">
              {c.tocLabel}
            </span>
            {tocOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {tocOpen && (
            <ol className="mt-2 divide-y divide-border rounded-2xl border border-border bg-card/60">
              {c.sections.map((s, i) => (
                <li key={sectionIds[i]}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(sectionIds[i])}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[13px] text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
                  >
                    <span className="line-clamp-1">{s.heading}</span>
                    <span className="text-[11px] tabular-nums text-muted-foreground/70">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Sections */}
        <article className="flex flex-col gap-8">
          {c.sections.map((s, i) => (
            <section
              key={sectionIds[i]}
              id={sectionIds[i]}
              className="scroll-mt-20"
            >
              <h3 className="mb-3 text-[20px] font-bold leading-tight tracking-tight text-foreground md:text-[22px]">
                {s.heading}
              </h3>
              <p className="whitespace-pre-line text-[15px] leading-[1.75] text-muted-foreground">
                {s.body}
              </p>
            </section>
          ))}
        </article>

        {/* Footer */}
        <footer className="mt-16 border-t border-border pt-6">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-[#faaf2e]/40 hover:text-foreground"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              {c.backToTop}
            </button>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
              {c.footer}
            </p>
          </div>
        </footer>
      </main>

      {/* Floating back-to-top (mobile) */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label={c.backToTop}
          className="fixed bottom-6 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#faaf2e] text-[#4b3002] shadow-lg shadow-black/20 transition-transform hover:scale-105 md:bottom-8 md:right-8"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

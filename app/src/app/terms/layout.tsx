import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관 | DITO.guru - AI 재능 발견 플랫폼 서비스 약관',
  description: 'DITO.guru AI 재능 발견 플랫폼, Ember 코칭, Soul NFT 민팅 서비스 이용약관 및 정책. DARGONNE 세계관 기반 서비스.',
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
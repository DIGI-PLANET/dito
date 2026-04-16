import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보 처리방침 | DITO.guru - AI 재능 발견 플랫폼',
  description: 'DITO.guru AI 재능 발견 서비스의 개인정보 수집, 이용, 보호 정책. Ember AI 코칭 데이터 처리 방침.',
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

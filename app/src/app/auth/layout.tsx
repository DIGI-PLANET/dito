import type { Metadata } from 'next';

export const revalidate = 0;

export const metadata: Metadata = {
  title: '인증 | DITO.guru - AI 재능 발견 플랫폼',
  description: 'DITO에 가입하고 Ember와 함께 재능을 키워나가세요. 이메일과 비밀번호로 간편하게 회원가입하세요.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
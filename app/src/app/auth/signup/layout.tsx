import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '회원가입 | DITO.guru - 새 계정 만들기',
  description: 'DITO에서 새 계정을 만들고 AI Ember와 함께 재능 발견 여정을 시작하세요.',
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
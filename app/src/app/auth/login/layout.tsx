import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인 | DITO.guru - 계정 접속',
  description: 'DITO 계정에 로그인하고 Ember와의 대화를 이어가세요.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
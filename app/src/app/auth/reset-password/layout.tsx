import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '비밀번호 재설정 | DITO.guru',
  description: 'DITO 계정의 새 비밀번호를 설정합니다.',
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Soul NFT | DITO.guru - 재능 증명 Soulbound Token',
  description: '발견한 재능을 Soul NFT(Soulbound Token)로 민팅하여 온체인 정체성 생성. Ember와 함께한 재능 발견 여정의 증명서.',
};

export default function SoulLayout({ children }: { children: React.ReactNode }) {
  return children;
}
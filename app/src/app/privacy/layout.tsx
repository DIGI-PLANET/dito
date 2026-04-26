import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy · DITO',
  description:
    'How DITO keeps your fire private — what we collect, why, and what we don’t.',
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms · DITO',
  description: 'The agreement between you and DITO, in plain words.',
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/providers/i18n-provider';
import { getWalletCookie } from '@/lib/wallet-cookie';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const router = useRouter();
  const { t } = useI18n();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-[100dvh]">
      {/* Top-left back button */}
      <div className="px-4 py-3">
        <button
          onClick={handleBack}
          className="text-sm text-muted-foreground hover:text-foreground px-1 py-1 rounded-lg transition-colors"
        >
          ←
        </button>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        <span className="text-6xl">🔥</span>
        <h1 className="text-2xl font-bold">{t('error.404.title')}</h1>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {t('error.404.message')}
        </p>
        <Button
          onClick={handleBack}
          className="mt-4 bg-[#ff6b35] hover:bg-[#e55a2b] text-white rounded-xl px-8 h-10"
        >
          {t('error.goHome')}
        </Button>
      </div>
    </div>
  );
}

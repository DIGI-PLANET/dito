'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/providers/i18n-provider';
import { getWalletCookie } from '@/lib/wallet-cookie';
import { Button } from '@/components/ui/button';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        <h1 className="text-2xl font-bold">{t('error.500.title')}</h1>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {t('error.500.message')}
        </p>
        <div className="flex gap-3 mt-4">
          <Button
            onClick={reset}
            variant="outline"
            className="border-[#ff6b35]/40 text-[#ff6b35] hover:bg-[#ff6b35]/10 rounded-xl px-6 h-10"
          >
            {t('error.retry')}
          </Button>
          <Button
            onClick={handleBack}
            className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white rounded-xl px-6 h-10"
          >
            {t('error.goHome')}
          </Button>
        </div>
      </div>
    </div>
  );
}

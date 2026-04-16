'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useI18n } from '@/providers/i18n-provider';
import { useDiscoveryGate } from '@/hooks/useDiscoveryGate';
import { Button } from '@/components/ui/button';
import { store } from '@/lib/store';
import { SoulCard, EmberStage } from '@/lib/types';
import { getWalletCookie } from '@/lib/wallet-cookie';

const STAGE_LABELS: Record<EmberStage, string> = {
  sparked: '🕯️ Sparked',
  burning: '🔥 Burning',
  blazing: '🔥🔥 Blazing',
  radiant: '✨ Radiant',
  eternal: '💎 Eternal',
};

export default function SoulPage() {
  const { isChecking } = useDiscoveryGate();
  
  // Show loading while checking discovery status
  if (isChecking) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#ff6b35] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  const router = useRouter();
  const { t } = useI18n();
  const [souls, setSouls] = useState<SoulCard[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const wallet = getWalletCookie();
    store.getSoulsAsync().then(setSouls);
  }, []);

  if (!mounted) return null;

  if (souls.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center page-enter">
        <span className="text-6xl mb-6 block">🔥</span>
        <h2 className="text-xl font-bold mb-2">{t('soul.portfolio')}</h2>
        <p className="text-muted-foreground mb-6">{t('soul.empty2')}</p>
        <Button onClick={() => router.push('/chat')} className="bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-xl w-full max-w-[280px] h-12">
          {t('soul.goto')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 page-enter">
      <h2 className="text-xl font-bold text-center mb-6">{t('soul.portfolio')}</h2>
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {souls.map((soul, idx) => (
          <div key={idx} className="relative bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0a] border border-[#ff6b35]/30 rounded-2xl p-6 text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#ff6b35]/20 rounded-full blur-[60px]" />
            <div className="relative z-10">
              <span className="text-2xl mb-2 block">🔥</span>
              <div className="text-xs text-[#ff6b35] tracking-widest uppercase mb-1">Ember Soul</div>
              <h3 className="text-lg font-bold text-white mb-1">{soul.talentLabel || soul.label}</h3>
              <div className="text-xs text-gray-400 mb-3">{STAGE_LABELS[soul.stage]} · {soul.mintDate}</div>
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {soul.traits.map((trait, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full bg-[#ff6b35]/10 text-[#ff6b35] border border-[#ff6b35]/20">
                    {trait}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed italic">{soul.description}</p>
              {/* Share button */}
              {soul.soul_id && (
                <ShareButton soul={soul} t={t} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New discovery button */}
      <div className="max-w-md mx-auto mt-6">
        <Button
          variant="outline"
          onClick={() => {
            const profile = store.getProfile();
            const wallet = getWalletCookie();
            const updated = { ...profile, current_talent: undefined, minted: false };
            store.setProfile(updated);
            if (wallet) store.saveProfileAsync(updated);
            router.push('/chat');
          }}
          className="w-full border-[#ff6b35]/30 text-[#ff6b35] hover:bg-[#ff6b35]/10 rounded-xl h-12"
        >
          {t('soul.newDiscovery' as never)}
        </Button>
      </div>
    </div>
  );
}

function ShareButton({ soul, t }: { soul: SoulCard; t: (key: never) => string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const shareUrl = `https://dito.guru/soul?id=${soul.soul_id}`;
  const shareText = t('share.text' as never);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleNativeShare = async () => {
    setOpen(false);
    try {
      await navigator.share({ title: soul.talentLabel || soul.label, text: shareText, url: shareUrl });
    } catch { /* cancelled */ }
  };

  const handleTwitter = () => {
    setOpen(false);
    const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1200);
    } catch { /* fallback */ }
  };

  return (
    <div className="relative inline-block mt-4" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="text-xs px-4 py-2 rounded-full bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/30 hover:bg-[#ff6b35]/30 transition-colors"
      >
        {t('share.button' as never)}
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1a1a2e] border border-[#ff6b35]/30 rounded-xl overflow-hidden shadow-lg z-20 min-w-[160px]">
          {typeof navigator !== 'undefined' && !!navigator.share && (
            <button onClick={handleNativeShare} className="w-full text-left text-xs px-4 py-3 text-white hover:bg-[#ff6b35]/10 transition-colors">
              📲 Share...
            </button>
          )}
          <button onClick={handleTwitter} className="w-full text-left text-xs px-4 py-3 text-white hover:bg-[#ff6b35]/10 transition-colors">
            𝕏 {t('share.twitter' as never)}
          </button>
          <button onClick={handleCopy} className="w-full text-left text-xs px-4 py-3 text-white hover:bg-[#ff6b35]/10 transition-colors">
            {copied ? `✅ ${t('share.copied' as never)}` : `📋 ${t('share.copy' as never)}`}
          </button>
        </div>
      )}
    </div>
  );
}

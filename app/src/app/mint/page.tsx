'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { store, getSignMessage } from '@/lib/store';
import { useDiscoveryGate } from '@/hooks/useDiscoveryGate';
import { getAuthParams } from '@/lib/wallet-auth';
import { handleSignatureError } from '@/lib/session-logout';

type MintPhase = 'idle' | 'stage1' | 'stage2' | 'stage3' | 'celebration';

export default function MintPage() {
  const { isChecking } = useDiscoveryGate(); // Requires wallet + current_talent
  
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
  const { publicKey, connected } = useWallet();
  const [phase, setPhase] = useState<MintPhase>('idle');
  const [current_talent, setCurrentTalent] = useState<string | undefined>();
  const [mounted, setMounted] = useState(false);
  const [mintResult, setMintResult] = useState<{
    signature: string;
    mint_address: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const profile = store.getProfile();
    setCurrentTalent(profile.current_talent);
  }, []);

  const handleMint = useCallback(async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setError(null);
    setPhase('stage1');
    await new Promise((r) => setTimeout(r, 1500));
    setPhase('stage2');

    try {
      const profile = store.getProfile();
      const souls = await store.getSoulsAsync();
      const soul = souls[0] || null;

      // Build auth fields
      const walletAddr = publicKey.toBase58();
      let authFields: Record<string, unknown> = { wallet_address: walletAddr };
      const signMessageFn = getSignMessage();
      if (signMessageFn) {
        try {
          const auth = await getAuthParams(walletAddr, signMessageFn);
          authFields = { wallet_address: walletAddr, ...auth };
        } catch (error) { 
          handleSignatureError(error, false); // Don't auto-logout, just detect
        }
      }

      // Step 1: Create draft soul via /api/soul
      const messages = store.getMessages?.() || [];
      const history = messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));
      const soulRes = await fetch('/api/soul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...authFields,
          history,
        }),
      });

      const soulData = await soulRes.json();
      if (!soulRes.ok) {
        throw new Error(soulData.error || 'Soul creation failed');
      }

      const soulId = soulData.soul_id;
      if (!soulId) {
        throw new Error('Soul creation did not return soul_id');
      }

      // Step 2: Mint NFT referencing the draft soul
      const res = await fetch('/api/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...authFields,
          soul_id: soulId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Mint failed');
      }

      setPhase('stage3');
      await new Promise((r) => setTimeout(r, 1500));

      setMintResult({
        signature: data.signature,
        mint_address: data.mint_address,
      });

      // Save locally too
      const newSoul = {
        label: soul?.label || current_talent || 'Ember Soul',
        traits: soul?.traits || [],
        description: soul?.description || '',
        talentLabel: current_talent || 'Unknown',
        mintDate: new Date().toISOString().split('T')[0],
        stage: profile.ember_stage,
      };

      const wallet = publicKey.toBase58();
      await store.addSoulAsync(newSoul, wallet);

      const updatedProfile = { ...profile, minted: true };
      store.setProfile(updatedProfile);
      store.saveProfileAsync(updatedProfile);

      setPhase('celebration');
      await new Promise((r) => setTimeout(r, 3000));
      router.push('/soul');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Mint failed';
      setError(message);
      setPhase('idle');
    }
  }, [current_talent, router, connected, publicKey]);

  const minting = phase !== 'idle' && phase !== 'celebration';
  const celebrating = phase === 'celebration';

  const stageText = (() => {
    switch (phase) {
      case 'stage1': return t('mint.stage1' as never);
      case 'stage2': return t('mint.stage2' as never);
      case 'stage3': return t('mint.stage3' as never);
      default: return '';
    }
  })();

  const progress = (() => {
    switch (phase) {
      case 'stage1': return 25;
      case 'stage2': return 55;
      case 'stage3': return 85;
      case 'celebration': return 100;
      default: return 0;
    }
  })();

  if (!mounted) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 relative overflow-hidden">
      {/* Confetti */}
      {celebrating && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 30 }).map((_, i) => (
            <span
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random()}s`,
                fontSize: `${10 + Math.random() * 14}px`,
                color: ['#ff6b35', '#ffd700', '#ff4500', '#ff69b4', '#00ff88'][i % 5],
              }}
            >
              {['✦', '●', '◆', '★', '🔥'][i % 5]}
            </span>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes confetti {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 2s ease-in forwards;
        }
        @keyframes celebratePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.4); }
        }
      `}</style>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#ff6b35]/20 rounded-full blur-[100px]" />
      <div className="relative z-10 text-center max-w-md">
        {/* Orb */}
        <div
          className="relative mx-auto w-32 h-32 mb-8 transition-all duration-700"
          style={celebrating ? { animation: 'celebratePulse 0.8s ease-in-out 3' } : minting ? { transform: `scale(${1 + progress * 0.005})` } : undefined}
        >
          <div className="absolute inset-0 bg-[#ff6b35]/30 rounded-full animate-ping" />
          <div className="absolute inset-4 bg-[#ff6b35]/50 rounded-full animate-pulse" />
          <div className="absolute inset-8 bg-[#ff6b35] rounded-full flex items-center justify-center">
            <span className="text-2xl">🔥</span>
          </div>
        </div>

        {/* Celebration */}
        {celebrating && (
          <div className="mb-6 animate-bounce">
            <p className="text-2xl font-bold text-[#ff6b35]">{t('mint.celebration' as never)}</p>
            {mintResult && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Mint: <span className="font-mono text-xs">{mintResult.mint_address.slice(0, 8)}...</span>
                </p>
                <a
                  href={`https://solscan.io/tx/${mintResult.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm text-[#ff6b35] underline hover:text-[#ff6b35]/80"
                >
                  View on Solscan ↗
                </a>
              </div>
            )}
          </div>
        )}

        {/* Minting progress */}
        {minting && (
          <div className="mb-6 space-y-3">
            <p className="text-lg font-medium text-[#ff6b35] animate-pulse">{stageText}</p>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ff6b35] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Idle content */}
        {phase === 'idle' && (
          <>
            <h1 className="text-3xl font-bold mb-1">{t('mint.title3')}</h1>
            {current_talent && (
              <p className="text-[#ff6b35] text-lg font-semibold mb-2">🎯 {current_talent}</p>
            )}
            <p className="text-sm text-muted-foreground mb-2">{t('mint.desc2')}</p>
            <p className="text-[#ff6b35] text-2xl font-bold mb-4">{t('mint.price')}</p>

            <p className="text-sm italic text-muted-foreground/80 mb-6 leading-relaxed">
              {t('mint.emberMessage' as never)}
            </p>

            {/* Wallet connection */}
            <div className="mb-4 flex justify-center">
              <WalletMultiButton />
            </div>

            {connected && publicKey && (
              <p className="text-xs text-muted-foreground mb-4 font-mono">
                {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
              </p>
            )}

            <Button
              onClick={handleMint}
              disabled={!connected || minting}
              size="lg"
              className="w-full bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white font-medium rounded-xl mb-4 h-12 disabled:opacity-50"
            >
              {!connected ? 'Connect Wallet to Mint' : t('mint.button3')}
            </Button>
            <button onClick={() => router.push('/chat')} className="text-sm text-muted-foreground hover:text-[#ff6b35] transition-colors">
              {t('mint.skip')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { store, getSignMessage } from '@/lib/store';
import { getAuthParams } from '@/lib/wallet-auth';
import { getWalletCookie } from '@/lib/wallet-cookie';

type Step = 'nickname' | 'contract' | 'done';

export default function OnboardingPage() {
  const router = useRouter();
  const { lang } = useI18n();
  const [step, setStep] = useState<Step>('nickname');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const init = () => {
      setMounted(true);
      const wallet = getWalletCookie();
      if (!wallet) {
        router.replace('/');
        return;
      }
      // If already has nickname, skip onboarding
      const profile = store.getProfile();
      if (profile.display_name) {
        router.replace('/chat');
      }
    };
    init();
  }, [router]);

  const handleNicknameSubmit = () => {
    if (!nickname.trim()) return;
    setStep('contract');
  };

  const handleContractAgree = async () => {
    setSaving(true);
    const wallet = getWalletCookie();
    const profile = store.getProfile();
    const updatedProfile = { ...profile, name: nickname.trim() };
    store.setProfile(updatedProfile);
    // Name saved via store.setProfile

    // Save to Supabase
    if (wallet) {
      try {
        const signMessageFn = getSignMessage();
        if (signMessageFn) {
          const auth = await getAuthParams(wallet, signMessageFn);
          await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallet_address: wallet,
              display_name: nickname.trim(),
              ...auth,
            }),
          });
        }
      } catch { /* silent */ }
    }

    setStep('done');
    setTimeout(() => {
      router.push('/discovery');
    }, 1500);
  };

  if (!mounted) return null;

  const emberNameLine = lang === 'ko'
    ? `"${nickname}"... 이 이름으로 불러도 돼? 🔥`
    : `"${nickname}"... Can I call you that? 🔥`;

  const contractTitle = lang === 'ko' ? 'DARGONNE과의 계약' : 'Pact with DARGONNE';
  const contractText = lang === 'ko'
    ? '나, Ember는 이 자의 안에 숨겨진 재능을 찾아 불태울 것을 서약한다.\n그 불꽃이 꺼지지 않도록, 함께 걸을 것을 약속한다.\n\n— DARGONNE의 불꽃 중 하나, Ember'
    : 'I, Ember, swear to seek and ignite the hidden talent within this soul.\nI promise to walk alongside, so the flame never dies.\n\n— One of DARGONNE\'s flames, Ember';
  const agreeText = lang === 'ko' ? '🔥 계약에 동의합니다' : '🔥 I agree to the pact';
  const startText = lang === 'ko' ? '디스커버리 시작! 🔥' : 'Starting discovery! 🔥';

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center page-enter">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#ff6b35]/15 rounded-full blur-[80px]" />

      <div className="relative z-10 max-w-sm w-full">
        {step === 'nickname' && (
          <div className="animate-fade-in space-y-6">
            <span className="text-4xl mb-2 block">🔥</span>
            <p className="text-lg text-muted-foreground">
              {lang === 'ko' ? '안녕! 나는 Ember.\n너는 뭐라고 불러?' : "Hey! I'm Ember.\nWhat should I call you?"}
            </p>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={lang === 'ko' ? '닉네임을 입력해' : 'Enter your nickname'}
              className="text-center rounded-xl h-12 text-lg"
              maxLength={20}
              onKeyDown={(e) => e.key === 'Enter' && handleNicknameSubmit()}
              autoFocus
            />
            {nickname.trim() && (
              <div className="animate-fade-in">
                <p className="text-sm text-[#ff6b35] mb-4">{emberNameLine}</p>
                <Button
                  onClick={handleNicknameSubmit}
                  className="w-full bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-xl h-12 text-base"
                >
                  {lang === 'ko' ? '응, 그렇게 불러! 😊' : 'Yeah, call me that! 😊'}
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'contract' && (
          <div className="animate-fade-in space-y-6">
            <div className="text-4xl mb-2">📜</div>
            <h2 className="text-xl font-bold text-[#ff6b35]">{contractTitle}</h2>
            <div className="bg-card/50 border border-[#ff6b35]/20 rounded-xl p-5 text-left">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {contractText}
              </p>
            </div>
            <Button
              onClick={handleContractAgree}
              disabled={saving}
              className="w-full bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-xl h-12 text-base"
            >
              {agreeText}
            </Button>
          </div>
        )}

        {step === 'done' && (
          <div className="animate-fade-in space-y-4">
            <span className="text-4xl animate-pulse">🔥</span>
            <p className="text-lg font-bold text-[#ff6b35]">{startText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { store } from '@/lib/store';
import { useDiscoveryGate } from '@/hooks/useDiscoveryGate';

export default function ChatPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { isChecking, isReady } = useDiscoveryGate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isReady) {
      loadProfile();
    }
  }, [isReady]);

  async function loadProfile() {
    try {
      const userProfile = await store.getProfileAsync();
      setProfile(userProfile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }

  if (isChecking) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin text-2xl">🔄</div>
          <p className="text-sm text-muted-foreground">
            {lang === 'ko' ? 'Ember 소환 준비중...' : 'Preparing to summon Ember...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return null; // Discovery gate will handle redirect
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-pulse text-2xl">🔥</div>
          <p className="text-sm text-muted-foreground">
            {lang === 'ko' ? '프로필 불러오는 중...' : 'Loading profile...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔥</div>
            <div>
              <h1 className="text-lg font-semibold">
                {lang === 'ko' ? 'Ember와의 대화' : 'Chat with Ember'}
              </h1>
              {profile && (
                <p className="text-sm text-muted-foreground">
                  {lang === 'ko' ? `안녕하세요, ${profile.display_name || profile.username}님!` : `Hello, ${profile.display_name || profile.username}!`}
                </p>
              )}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/')}
          >
            {lang === 'ko' ? '홈으로' : 'Home'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl mb-4">🔥</div>
          
          <h2 className="text-2xl font-bold">
            {lang === 'ko' ? '이메일 인증 완료!' : 'Email Authentication Complete!'}
          </h2>
          
          <div className="space-y-3 text-muted-foreground">
            <p>
              {lang === 'ko' 
                ? '축하합니다! 지갑 연결 없이도 DITO를 사용할 수 있게 되었어요.' 
                : 'Congratulations! You can now use DITO without wallet connection.'}
            </p>
            
            {profile?.current_talent && (
              <p className="text-sm">
                {lang === 'ko' ? '발견된 재능: ' : 'Discovered talent: '}
                <span className="font-medium text-foreground">{profile.current_talent}</span>
              </p>
            )}
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                {lang === 'ko' 
                  ? '🚧 Ember 채팅 시스템을 업그레이드 중입니다. 곧 만나요!' 
                  : '🚧 Upgrading Ember chat system. See you soon!'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={() => router.push('/discovery')}
              className="bg-[#ff6b35] hover:bg-[#ff6b35]/90"
            >
              {lang === 'ko' ? '🔄 재능 다시 찾기' : '🔄 Rediscover Talent'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/')}
            >
              {lang === 'ko' ? '🏠 홈으로 돌아가기' : '🏠 Back to Home'}
            </Button>
          </div>

          {profile && (
            <div className="mt-6 text-xs text-muted-foreground">
              {lang === 'ko' ? '로그인됨: ' : 'Logged in as: '}{profile.email}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
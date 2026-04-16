'use client';

import Link from 'next/link';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { agentStore } from '@/lib/store-agent';
import type { UserProfile, Talent } from '@/lib/store-agent';

export default function DashboardPage() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [emberBalance, setEmberBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [apiHealthy, setApiHealthy] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // API 상태 확인
        const healthy = await agentStore.checkAPIHealth();
        setApiHealthy(healthy);

        if (healthy) {
          // 프로필 로드
          const userProfile = await agentStore.loadProfileAsync();
          setProfile(userProfile);

          // Talent 리스트 로드
          const userTalents = await agentStore.getTalentsAsync();
          setTalents(userTalents);

          // Ember 잔액 로드
          const balance = await agentStore.getEmberBalanceAsync();
          setEmberBalance(balance);
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const stageEmoji = {
    sparked: '🌱',
    burning: '🔥',
    blazing: '⚡',
    radiant: '✨',
    eternal: '💎',
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] px-4 py-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔥</div>
          <p className="text-lg font-semibold">Loading DITO Dashboard...</p>
          <p className="text-sm text-muted-foreground">Connecting to Agent API...</p>
        </div>
      </div>
    );
  }

  if (!apiHealthy) {
    return (
      <div className="min-h-[100dvh] px-4 py-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">API Connection Failed</h1>
          <p className="text-muted-foreground mb-4">
            Unable to connect to DITO Agent API (localhost:8080)
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-[#ff6b35] hover:bg-[#ff6b35]/90"
          >
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] overflow-y-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          👋 Welcome to DITO
        </h1>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Agent API</p>
          <p className="text-xs text-green-500">✅ Connected</p>
        </div>
      </div>

      {/* Soul Status */}
      {profile?.minted ? (
        <div className="bg-card/50 border-2 border-[#ff6b35]/40 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">🔮 Your Soul</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Soul ID</p>
              <p className="font-mono text-sm">{profile.id}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Stage</p>
              <p className="text-lg">
                {stageEmoji[profile.ember_stage || 'sparked']} 
                {profile.ember_stage}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Ember Balance</p>
              <p className="text-xl font-bold text-[#ff6b35]">
                🔥 {emberBalance.toLocaleString()}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Current Talent</p>
              <p className="font-semibold">
                {profile.current_talent || 'None'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card/50 border border-border/50 rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">🌟 Soul Not Minted</h2>
          <p className="text-muted-foreground mb-4">
            Start your journey by minting your Soul NFT
          </p>
          <Link href="/onboarding">
            <Button className="bg-[#ff6b35] hover:bg-[#ff6b35]/90">
              Start Journey
            </Button>
          </Link>
        </div>
      )}

      {/* Talents */}
      <div className="bg-card/50 border border-border/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">🎯 Your Talents</h2>
          <Link href="/discovery">
            <Button variant="outline" size="sm">
              Discover More
            </Button>
          </Link>
        </div>

        {talents.length > 0 ? (
          <div className="grid gap-3">
            {talents.map((talent) => (
              <div key={talent.id} className="bg-background/50 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{talent.label}</h3>
                  <span className="text-sm px-2 py-1 bg-[#ff6b35]/20 text-[#ff6b35] rounded">
                    {talent.stage}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {talent.description}
                </p>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#ff6b35] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${talent.progress}%` }}
                  />
                </div>
                
                <p className="text-xs text-muted-foreground mt-2">
                  Progress: {talent.progress}%
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No talents discovered yet</p>
            <Link href="/discovery">
              <Button className="bg-[#ff6b35] hover:bg-[#ff6b35]/90">
                Start Discovery
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/chat">
          <Button 
            variant="outline" 
            className="w-full h-16 flex flex-col items-center gap-2"
          >
            <span className="text-2xl">💬</span>
            <span className="text-sm">Chat with Ember</span>
          </Button>
        </Link>

        <Link href="/mint">
          <Button 
            variant="outline" 
            className="w-full h-16 flex flex-col items-center gap-2"
          >
            <span className="text-2xl">🎨</span>
            <span className="text-sm">Mint Soul</span>
          </Button>
        </Link>
      </div>

      {/* Debug Info */}
      <details className="text-xs text-muted-foreground bg-background/30 rounded p-4">
        <summary className="cursor-pointer">Debug Info</summary>
        <pre className="mt-2 whitespace-pre-wrap">
          {JSON.stringify({ 
            profile: profile ? {
              id: profile.id,
              ember_stage: profile.ember_stage,
              ember_balance: profile.ember_balance,
              current_talent: profile.current_talent
            } : null,
            talents_count: talents.length,
            api_healthy: apiHealthy,
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
}
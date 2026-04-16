import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store';

/**
 * Discovery Gate Hook (Email Auth Version)
 * 이메일 인증 + 재능 발견 완료 체크
 */
export function useDiscoveryGate() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedDiscovery, setHasCompletedDiscovery] = useState(false);

  useEffect(() => {
    async function checkAuthAndDiscovery() {
      try {
        // 1. 세션 인증 확인
        const authenticated = await store.checkAuth();
        setIsAuthenticated(authenticated);

        if (!authenticated) {
          // 인증되지 않음 → 로그인 페이지로
          router.replace('/auth/login');
          return;
        }

        // 2. 프로필 불러와서 재능 발견 완료 여부 확인
        const profile = await store.getProfileAsync();
        const hasDiscovery = !!(profile.current_talent && profile.discovery_complete);
        setHasCompletedDiscovery(hasDiscovery);

        if (!hasDiscovery) {
          // 재능 발견 미완료 → Discovery 페이지로
          router.replace('/discovery');
          return;
        }

        // 3. 내부 지갑 확인/생성
        if (!profile.internal_wallet_pubkey) {
          console.log('Creating internal wallet...');
          const walletResult = await store.createInternalWallet();
          if (!walletResult) {
            console.warn('Failed to create internal wallet');
          }
        }

      } catch (error) {
        console.error('Discovery gate error:', error);
        router.replace('/auth/login');
      } finally {
        setIsChecking(false);
      }
    }

    checkAuthAndDiscovery();
  }, [router]);

  return {
    isChecking,
    isAuthenticated,
    hasCompletedDiscovery,
    isReady: !isChecking && isAuthenticated && hasCompletedDiscovery
  };
}

// 기존 hook과의 호환성 - 이미 기본 export이므로 별도 alias 불필요
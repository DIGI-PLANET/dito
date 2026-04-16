/**
 * Email-based Authentication Store (v2)
 * 지갑 기반에서 이메일 기반으로 전환
 */

export interface UserProfile {
  id?: string;
  email?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  current_talent?: string;
  talent_category?: string;
  discovery_complete?: boolean;
  interests?: string[];
  challenges_completed?: number;
  growth_notes?: Array<{ date: string; note: string; talent?: string }>;
  minted?: boolean;
  ember_stage?: 'sparked' | 'burning' | 'blazing' | 'radiant' | 'eternal';
  language?: 'en' | 'ko';
  internal_wallet_pubkey?: string;
  links?: Array<{ label: string; url: string }>;
  wallet_connected?: boolean;
  created_at?: string;
  last_login_at?: string;
}

export interface ChatMessage {
  role: 'user' | 'ember';
  content: string;
  timestamp?: number;
}

export interface DiaryDay {
  date: string; // YYYY-MM-DD
  entry: string;
  photos?: string[];
  mood?: string;
  challenges?: string[];
  growth?: string;
  timestamp?: number;
}

// 인메모리 캐시
let _profileCache: UserProfile | null = null;
let _messagesCache: ChatMessage[] = [];

const DEFAULT_PROFILE: UserProfile = {
  language: 'en',
  ember_stage: 'sparked',
  interests: [],
  challenges_completed: 0,
  growth_notes: [],
  minted: false,
  discovery_complete: false,
  wallet_connected: false,
};

export const store = {
  // 프로필 관리
  getProfile: (): UserProfile => _profileCache || DEFAULT_PROFILE,
  setProfile: (profile: UserProfile) => { _profileCache = profile; },

  // 서버에서 프로필 가져오기 (세션 기반)
  async getProfileAsync(): Promise<UserProfile> {
    try {
      const res = await fetch('/api/profile', {
        credentials: 'include', // 쿠키 포함
      });
      
      if (!res.ok) {
        console.error('Failed to fetch profile:', res.status);
        return this.getProfile();
      }
      
      const profile = await res.json();
      _profileCache = profile;
      return profile;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return this.getProfile();
    }
  },

  // 프로필 저장 (세션 기반)
  async saveProfileAsync(profile: UserProfile): Promise<boolean> {
    try {
      _profileCache = profile;
      
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          current_talent: profile.current_talent,
          talent_category: profile.talent_category,
          discovery_complete: profile.discovery_complete,
          interests: profile.interests,
          challenges_completed: profile.challenges_completed,
          growth_notes: profile.growth_notes,
          ember_stage: profile.ember_stage,
          language: profile.language,
          links: profile.links,
        }),
      });

      return res.ok;
    } catch (error) {
      console.error('Profile save error:', error);
      return false;
    }
  },

  // 메시지 관리 (기존과 동일)
  getMessages: (): ChatMessage[] => _messagesCache,
  setMessages: (messages: ChatMessage[]) => { _messagesCache = messages; },
  addMessage: (message: ChatMessage) => { _messagesCache.push(message); },
  clearMessages: () => { _messagesCache = []; },

  // 일기 관리 (임시 API 사용 - DB 테이블 생성 후 실제 API로 전환)
  async getDiaryAsync(date: string): Promise<DiaryDay | null> {
    try {
      const profile = this.getProfile();
      const email = profile?.email || 'temp@example.com';
      
      const res = await fetch(`/api/diary?date=${date}&email=${email}`, {
        credentials: 'include',
      });
      if (!res.ok) return null;
      const { diary } = await res.json();
      return diary || null;
    } catch {
      return null;
    }
  },

  async saveDiaryAsync(diary: DiaryDay): Promise<boolean> {
    try {
      const profile = this.getProfile();
      const email = profile?.email || 'temp@example.com';
      
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...diary,
          email
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // 일기 날짜 목록 가져오기
  async getDiaryDatesAsync(): Promise<string[]> {
    try {
      const profile = this.getProfile();
      const email = profile?.email || 'temp@example.com';
      
      const res = await fetch(`/api/diary/dates?email=${email}`, {
        credentials: 'include',
      });
      if (!res.ok) return [];
      const { dates } = await res.json();
      return dates || [];
    } catch {
      return [];
    }
  },

  // 세션 관리
  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 로컬 캐시 정리
      _profileCache = null;
      _messagesCache = [];
    }
  },

  // 인증 상태 확인
  async checkAuth(): Promise<boolean> {
    try {
      const res = await fetch('/api/profile', {
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // 내부 지갑 생성 (Soul 민팅용)
  async createInternalWallet(): Promise<string | null> {
    try {
      const res = await fetch('/api/wallet/create', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!res.ok) return null;
      
      const { publicKey } = await res.json();
      return publicKey;
    } catch {
      return null;
    }
  },

  // Soul 민팅
  async mintSoul(soulData: {
    label: string;
    traits: string[];
    proofData: any;
  }): Promise<{ success: boolean; txHash?: string }> {
    try {
      const res = await fetch('/api/soul/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(soulData),
      });
      
      const result = await res.json();
      return {
        success: res.ok,
        txHash: result.txHash,
      };
    } catch {
      return { success: false };
    }
  },

  // 앰버 관리
  async saveEmberAsync(emberData: {
    ember_name: string;
    talent: string;
    talent_category?: string;
    discovery_conversation: Array<{ role: 'ember' | 'user'; content: string }>;
    lang: string;
  }): Promise<{ success: boolean; ember_id?: string }> {
    try {
      const res = await fetch('/api/ember', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(emberData),
      });
      const data = await res.json();
      return { success: res.ok, ember_id: data.ember_id };
    } catch {
      return { success: false };
    }
  },

  async abandonEmberAsync(): Promise<boolean> {
    try {
      const res = await fetch('/api/ember', {
        method: 'PUT',
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getEmberAsync(): Promise<any | null> {
    try {
      const res = await fetch('/api/ember', { credentials: 'include' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // 기존 호환성을 위한 wrapper 함수들
  getWallet: (): string | null => {
    const profile = store.getProfile();
    return profile?.internal_wallet_pubkey || null;
  },

  isWalletConnected: (): boolean => {
    return !!store.getWallet();
  },

  // TODO: Soul 관련 함수 구현
  async getSoulsAsync(): Promise<any[]> {
    return [];
  },

  async mintSoulAsync(soulData: any, walletAddress: string): Promise<{ success: boolean; txHash?: string }> {
    return { success: false };
  },

  async addSoulAsync(soulData: any, walletAddress: string): Promise<boolean> {
    return true;
  },
};

// Wallet signing stubs (kept for wallet integration pages)
export function getSignMessage(): ((message: Uint8Array) => Promise<Uint8Array>) | null {
  return null;
}

export function setSignMessageFn(_fn: ((message: Uint8Array) => Promise<Uint8Array>) | null): void {
  // no-op in email auth system
}
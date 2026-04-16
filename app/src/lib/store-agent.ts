/**
 * DITO Store with Agent API Integration
 * Agent API를 사용하는 새로운 스토어 구현
 */

import { ditoAPI } from './agent-api';
import { Soul, Talent as SoulTalent } from './types';

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
  ember_balance?: number;
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

export interface Talent {
  id: string;
  label: string;
  description: string;
  category: string;
  stage: 'discovered' | 'in_progress' | 'completed';
  progress: number;
  evidence?: string[];
}

// 인메모리 캐시
let _profileCache: UserProfile | null = null;
let _messagesCache: ChatMessage[] = [];
let _talentsCache: Talent[] = [];

const DEFAULT_PROFILE: UserProfile = {
  language: 'en',
  ember_stage: 'sparked',
  challenges_completed: 0,
  growth_notes: [],
  interests: [],
  links: [],
  ember_balance: 0,
};

export const agentStore = {
  // 프로필 관리 (Agent API 기반)
  getProfile: (): UserProfile => _profileCache || DEFAULT_PROFILE,
  
  setProfile: (profile: Partial<UserProfile>) => {
    _profileCache = { ...(_profileCache || DEFAULT_PROFILE), ...profile };
  },

  async loadProfileAsync(): Promise<UserProfile> {
    try {
      console.log('🔄 Loading profile from Agent API...');
      
      // Soul 정보 가져오기
      const soulResponse = await ditoAPI.getSoul();
      if (soulResponse.success && soulResponse.data) {
        const soul = soulResponse.data;
        
        // Ember 잔액 가져오기
        const emberResponse = await ditoAPI.getEmberBalance();
        const emberBalance = (emberResponse.success && emberResponse.data) ? emberResponse.data.balance : 0;

        // API Level을 UI Stage로 매핑
        const levelToStage = (level: string): 'sparked' | 'burning' | 'blazing' | 'radiant' | 'eternal' => {
          switch (level?.toLowerCase()) {
            case 'ember': return 'sparked';
            case 'flame': return 'burning';
            case 'blaze': return 'blazing';
            case 'inferno': return 'radiant';
            case 'eternal': return 'eternal';
            default: return 'sparked';
          }
        };

        const profile: UserProfile = {
          ...DEFAULT_PROFILE,
          id: soul.id,
          username: soul.id,
          display_name: soul.seeker_name || soul.id,
          ember_stage: levelToStage(soul.current_level),
          ember_balance: soul.ember_points || 0,
          current_talent: soul.current_talent_label,
          created_at: soul.created_at,
          minted: true,
        };

        _profileCache = profile;
        console.log('✅ Profile loaded:', profile);
        return profile;
      }
    } catch (error) {
      console.error('❌ Profile load failed:', error);
    }
    
    // 실패시 기본 프로필 반환
    _profileCache = DEFAULT_PROFILE;
    return DEFAULT_PROFILE;
  },

  async saveProfileAsync(updates: Partial<UserProfile>): Promise<boolean> {
    try {
      // 로컬 캐시 업데이트
      _profileCache = { ...(_profileCache || DEFAULT_PROFILE), ...updates };
      
      // 실제 API 업데이트는 필요시 구현
      console.log('✅ Profile updated locally:', updates);
      return true;
    } catch (error) {
      console.error('❌ Profile save error:', error);
      return false;
    }
  },

  // Talent 관리 (Agent API 기반)
  async getTalentsAsync(): Promise<Talent[]> {
    try {
      console.log('🔄 Loading talents from Agent API...');
      
      const response = await ditoAPI.getTalents();
      if (response.success && response.data) {
        const talents = response.data.map((talent: any) => ({
          id: talent.talent_id,
          label: talent.talent_label,
          description: talent.description,
          category: talent.category,
          stage: talent.stage,
          progress: talent.progress,
          evidence: talent.evidence || [],
        }));
        
        _talentsCache = talents;
        console.log('✅ Talents loaded:', talents.length);
        return talents;
      }
    } catch (error) {
      console.error('❌ Talents load failed:', error);
    }
    
    return [];
  },

  async startTalentJourneyAsync(talentLabel: string): Promise<boolean> {
    try {
      console.log('🚀 Starting talent journey:', talentLabel);
      
      const response = await ditoAPI.startTalentJourney(talentLabel);
      if (response.success) {
        // 캐시 무효화
        await this.getTalentsAsync();
        await this.loadProfileAsync();
        console.log('✅ Talent journey started:', talentLabel);
        return true;
      }
    } catch (error) {
      console.error('❌ Start talent journey failed:', error);
    }
    
    return false;
  },

  // Ember 관리
  async getEmberBalanceAsync(): Promise<number> {
    try {
      const response = await ditoAPI.getEmberBalance();
      if (response.success && response.data) {
        return response.data.balance || 0;
      }
    } catch (error) {
      console.error('❌ Get ember balance failed:', error);
    }
    
    return 0;
  },

  async transferEmberAsync(recipientId: string, amount: number): Promise<boolean> {
    try {
      console.log('💸 Transferring ember:', { recipientId, amount });
      
      const response = await ditoAPI.transferEmber(recipientId, amount);
      if (response.success) {
        // 잔액 업데이트
        await this.loadProfileAsync();
        console.log('✅ Ember transferred successfully');
        return true;
      }
    } catch (error) {
      console.error('❌ Ember transfer failed:', error);
    }
    
    return false;
  },

  // Arena 관리
  async getArenaEventsAsync(): Promise<any[]> {
    try {
      console.log('🏟️ Loading arena events...');
      
      const response = await ditoAPI.getArenaEvents();
      if (response.success && response.data) {
        console.log('✅ Arena events loaded:', response.data.length);
        return response.data;
      }
    } catch (error) {
      console.error('❌ Arena events load failed:', error);
    }
    
    return [];
  },

  // 메시지 관리 (기존과 동일)
  getMessages: (): ChatMessage[] => _messagesCache,
  setMessages: (messages: ChatMessage[]) => { _messagesCache = messages; },
  addMessage: (message: ChatMessage) => { _messagesCache.push(message); },
  clearMessages: () => { _messagesCache = []; },

  // 일기 관리 (로컬 저장소 기반 - 임시)
  async getDiaryAsync(date: string): Promise<DiaryDay | null> {
    try {
      const stored = localStorage.getItem(`diary_${date}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  async saveDiaryAsync(diary: DiaryDay): Promise<boolean> {
    try {
      localStorage.setItem(`diary_${diary.date}`, JSON.stringify(diary));
      console.log('✅ Diary saved locally:', diary.date);
      return true;
    } catch (error) {
      console.error('❌ Diary save failed:', error);
      return false;
    }
  },

  // API 상태 확인
  async checkAPIHealth(): Promise<boolean> {
    try {
      return await ditoAPI.healthCheck();
    } catch {
      return false;
    }
  },

  // 캐시 클리어
  clearCache: () => {
    _profileCache = null;
    _messagesCache = [];
    _talentsCache = [];
    console.log('🗑️ Cache cleared');
  },
};

export default agentStore;
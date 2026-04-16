/**
 * 임시 메모리 저장소 (DB 생성 전까지 사용)
 * 서버 재시작 시 모든 데이터 소실됨
 */

interface TempUser {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  display_name?: string;
  current_talent?: string | null;
  talent_category?: string | null;
  discovery_complete?: boolean;
  interests?: string[];
  challenges_completed?: number;
  growth_notes?: any[];
  minted?: boolean;
  ember_stage?: string;
  language?: string;
  internal_wallet_pubkey?: string | null;
  links?: any[];
  created_at: string;
  last_login_at?: string;
}

interface TempSession {
  user_id: string;
  email: string;
  expires_at: number;
  created_at: number;
}

interface TempDiary {
  date: string;
  entry?: string;
  photos?: string[];
  mood?: string;
  challenges?: string[];
  growth?: string;
  created_at: string;
  updated_at: string;
}

// 전역 저장소
const tempUsers = new Map<string, TempUser>(); // email -> user
const tempSessions = new Map<string, TempSession>(); // session_token -> session
const tempDiaries = new Map<string, TempDiary>(); // email:date -> diary

// 유틸리티 함수들
export function getDiaryKey(email: string, date: string): string {
  return `${email}:${date}`;
}

// 사용자 관리
export const tempUserStorage = {
  set(email: string, user: TempUser) {
    tempUsers.set(email.toLowerCase().trim(), user);
  },
  
  get(email: string): TempUser | null {
    return tempUsers.get(email.toLowerCase().trim()) || null;
  },
  
  has(email: string): boolean {
    return tempUsers.has(email.toLowerCase().trim());
  },
  
  findByUsername(username: string): TempUser | null {
    for (const user of tempUsers.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  },
  
  getAll(): TempUser[] {
    return Array.from(tempUsers.values());
  }
};

// 세션 관리
export const tempSessionStorage = {
  set(sessionToken: string, session: TempSession) {
    tempSessions.set(sessionToken, session);
  },
  
  get(sessionToken: string): TempSession | null {
    const session = tempSessions.get(sessionToken);
    if (!session) return null;
    
    // 만료 확인
    if (session.expires_at < Date.now()) {
      tempSessions.delete(sessionToken);
      return null;
    }
    
    return session;
  },
  
  delete(sessionToken: string) {
    tempSessions.delete(sessionToken);
  },
  
  cleanup() {
    const now = Date.now();
    for (const [token, session] of tempSessions) {
      if (session.expires_at < now) {
        tempSessions.delete(token);
      }
    }
  }
};

// 일기 관리
export const tempDiaryStorage = {
  set(email: string, date: string, diary: TempDiary) {
    const key = getDiaryKey(email.toLowerCase().trim(), date);
    tempDiaries.set(key, diary);
  },
  
  get(email: string, date: string): TempDiary | null {
    const key = getDiaryKey(email.toLowerCase().trim(), date);
    return tempDiaries.get(key) || null;
  },
  
  getDates(email: string): string[] {
    const prefix = `${email.toLowerCase().trim()}:`;
    const dates: string[] = [];
    
    for (const [key, diary] of tempDiaries) {
      if (key.startsWith(prefix)) {
        dates.push(diary.date);
      }
    }
    
    // 날짜 정렬 (최신순)
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  },
  
  delete(email: string, date: string) {
    const key = getDiaryKey(email.toLowerCase().trim(), date);
    tempDiaries.delete(key);
  }
};

// 디버그 정보
export function getTempStorageStats() {
  return {
    users: tempUsers.size,
    sessions: tempSessions.size,
    diaries: tempDiaries.size,
    timestamp: new Date().toISOString()
  };
}

// 주기적 정리 (메모리 누수 방지)
setInterval(() => {
  tempSessionStorage.cleanup();
}, 60 * 60 * 1000); // 1시간마다 만료된 세션 정리
/**
 * DITO Agent API Client
 * Agent API Gateway와 통신하는 클라이언트
 */

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    timestamp: string;
    request_id: string;
    version: string;
    execution_time_ms: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// API 응답 타입 정의
interface EmberBalance {
  balance: number;
}

interface Soul {
  id: string;
  seeker_name: string;
  current_level: string;
  ember_points: number;
  total_talents: number;
  active_talents: number;
  conviction_level: number;
  next_milestone: string;
  arena_eligible: boolean;
  last_activity: string;
  talents: Talent[];
  current_talent_label?: string;
  created_at?: string;
}

interface Talent {
  talent_id: string;
  talent_label: string;
  description: string;
  category: string;
  stage: string;
  progress: number;
  evidence?: string[];
}

interface ArenaEvent {
  event_id: string;
  event_name: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  participants?: number;
  status?: string;
}

interface CommandRequest {
  action: string;
  [key: string]: any;
}

class DitoAgentAPI {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_DITO_API_URL || 'http://localhost:8080';
    this.token = process.env.DITO_API_TOKEN || '';
  }

  private async request<T>(action: string, params: Record<string, any> = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/command`;
    const body: CommandRequest = { action, ...params };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // 인증 관련
  async get2FAStatus() {
    return this.request('2fa_status');
  }

  async setup2FA() {
    return this.request('2fa_setup');
  }

  async verify2FA(token: string) {
    return this.request('2fa_verify', { token });
  }

  // Soul 관련
  async getSoul(): Promise<ApiResponse<Soul>> {
    return this.request<Soul>('get_soul');
  }

  async getEmberBalance(): Promise<ApiResponse<EmberBalance>> {
    return this.request<EmberBalance>('get_ember_balance');
  }

  async transferEmber(recipientId: string, amount: number) {
    return this.request('transfer_ember', { 
      recipient_id: recipientId, 
      amount: amount.toString() 
    });
  }

  // Talent 관련
  async getTalents(): Promise<ApiResponse<Talent[]>> {
    return this.request<Talent[]>('list_talents');
  }

  async getTalent(talentId: string) {
    return this.request('get_talent', { talent_id: talentId });
  }

  async startTalentJourney(talentLabel: string) {
    return this.request('start_talent_journey', { talent_label: talentLabel });
  }

  async submitTalentEvidence(talentId: string, evidence: string) {
    return this.request('submit_talent_evidence', { 
      talent_id: talentId, 
      evidence 
    });
  }

  async completeTalentJourney(talentId: string) {
    return this.request('complete_talent_journey', { talent_id: talentId });
  }

  // Arena 관련
  async getArenaEvents(): Promise<ApiResponse<ArenaEvent[]>> {
    return this.request<ArenaEvent[]>('get_arena_events');
  }

  async joinArena(eventId: string) {
    return this.request('join_arena', { event_id: eventId });
  }

  async leaveArena(eventId: string) {
    return this.request('leave_arena', { event_id: eventId });
  }

  async battleResult(eventId: string, result: 'win' | 'lose' | 'draw') {
    return this.request('battle_result', { 
      event_id: eventId, 
      result 
    });
  }

  // 헬프 및 문서
  async getHelp(action?: string) {
    return this.request('help', action ? { action } : {});
  }

  async getDocs() {
    return this.request('docs');
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const ditoAPI = new DitoAgentAPI();
export type { ApiResponse, CommandRequest };
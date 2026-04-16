/**
 * DITO Agent SDK
 * Roy's Agent-First API wrapper for maximum simplicity
 * 
 * Usage:
 *   const dito = new DitoClient('https://api.dito.guru', 'your-token')
 *   await dito.get2FAStatus()
 *   await dito.getSoul('roy-soul')
 *   await dito.getEmberBalance()
 */

export interface DitoConfig {
  baseUrl: string
  token: string
  timeout?: number
}

export interface DitoResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    type: string
    details?: any
  }
  meta?: {
    timestamp: string
    request_id: string
    version: string
  }
}

export interface Soul {
  id: string
  seeker_name: string
  current_level: string
  ember_points: number
  total_talents: number
  active_talents: number
  conviction_level: number
  next_milestone: string
  arena_eligible: boolean
  last_activity: string
  talents: Talent[]
}

export interface Talent {
  id: string
  name: string
  category: string
  progress_percentage: number
  ember_earned: number
  days_active: number
  mastery_level: string
}

export interface TwoFactorSetup {
  secret: string
  qr_code_url: string
  backup_codes: string[]
  instructions: string
}

export interface ArenaEvent {
  id: string
  name: string
  type: string
  status: string
  participants: number
  max_participants: number
  prize_ember: number
  start_time: string
  end_time: string
}

export class DitoClient {
  private config: DitoConfig

  constructor(baseUrl: string, token: string, timeout = 10000) {
    this.config = { baseUrl, token, timeout }
  }

  /**
   * Internal command executor
   */
  private async command<T = any>(action: string, params?: any): Promise<DitoResponse<T>> {
    const url = `${this.config.baseUrl}/command`
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.token}`
        },
        body: JSON.stringify({ action, params }),
        signal: AbortSignal.timeout(this.config.timeout!)
      })

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'network_error',
          type: 'client_error',
          details: { message: error instanceof Error ? error.message : 'Unknown error' }
        }
      }
    }
  }

  // =============================================================================
  // 🔐 2FA & Authentication
  // =============================================================================

  /**
   * Check current 2FA status
   */
  async get2FAStatus(): Promise<DitoResponse<{
    enabled: boolean
    user_id: string
    user_name: string
    setup_date: string | null
    backup_codes_remaining: number
  }>> {
    return this.command('2fa_status')
  }

  /**
   * Setup 2FA (returns QR code and backup codes)
   */
  async setup2FA(): Promise<DitoResponse<TwoFactorSetup>> {
    return this.command('2fa_setup')
  }

  /**
   * Verify 2FA code during setup
   */
  async verify2FA(code: string): Promise<DitoResponse<{ enabled: boolean }>> {
    return this.command('2fa_verify', { code })
  }

  /**
   * Disable 2FA (requires current code)
   */
  async disable2FA(code: string): Promise<DitoResponse<{ enabled: boolean }>> {
    return this.command('2fa_disable', { code })
  }

  /**
   * Request email recovery code
   */
  async request2FAEmailRecovery(email: string): Promise<DitoResponse<{
    email_sent: boolean
    email: string
    expires_in_minutes: number
  }>> {
    return this.command('2fa_email_recovery', { email })
  }

  /**
   * Verify email recovery code
   */
  async verify2FAEmailCode(emailCode: string): Promise<DitoResponse<{
    verified: boolean
    temp_access: boolean
  }>> {
    return this.command('2fa_email_verify', { email_code: emailCode })
  }

  // =============================================================================
  // 👤 Soul Management
  // =============================================================================

  /**
   * Get specific Soul by ID
   */
  async getSoul(soulId: string): Promise<DitoResponse<Soul>> {
    return this.command('get_soul', { soul_id: soulId })
  }

  /**
   * Get all Souls for current user
   */
  async getSouls(): Promise<DitoResponse<Soul[]>> {
    return this.command('list_souls')
  }

  /**
   * Update Soul information
   */
  async updateSoul(soulId: string, updates: Partial<Soul>): Promise<DitoResponse<Soul>> {
    return this.command('update_soul', { soul_id: soulId, ...updates })
  }

  /**
   * Delete Soul (requires 2FA)
   */
  async deleteSoul(soulId: string, totpCode?: string): Promise<DitoResponse<{ deleted: boolean }>> {
    const params: any = { soul_id: soulId }
    if (totpCode) params.totp_code = totpCode
    return this.command('delete_soul', params)
  }

  // =============================================================================
  // ⚡ Ember (재능 씨앗) Management
  // =============================================================================

  /**
   * Get current Ember balance
   */
  async getEmberBalance(): Promise<DitoResponse<{
    ember_balance: number
    soul_id: string
  }>> {
    return this.command('get_ember_balance')
  }

  /**
   * Perform Ember transaction (재능 공명/공유)
   */
  async emberTransaction(params: {
    type: 'transfer' | 'share' | 'resonate'
    amount: number
    target_soul_id?: string
    message?: string
  }): Promise<DitoResponse<{
    transaction_id: string
    status: string
  }>> {
    return this.command('ember_transaction', params)
  }

  // =============================================================================
  // 🎨 Talent (재능) Discovery & Growth
  // =============================================================================

  /**
   * Get specific talent information
   */
  async getTalent(talentId: string): Promise<DitoResponse<Talent>> {
    return this.command('get_talent', { talent_id: talentId })
  }

  /**
   * Get talent recommendations (AI-powered)
   */
  async getTalentRecommendations(): Promise<DitoResponse<{
    recommendations: Array<{
      id: string
      name: string
      category: string
      description: string
      difficulty: string
      trending: boolean
    }>
  }>> {
    return this.command('get_talent_recommendations')
  }

  /**
   * List user's current talents
   */
  async getTalents(): Promise<DitoResponse<Talent[]>> {
    return this.command('list_talents')
  }

  /**
   * Update talent progress
   */
  async updateTalent(talentId: string, progress: number, notes?: string): Promise<DitoResponse<Talent>> {
    return this.command('update_talent', { 
      talent_id: talentId, 
      progress_percentage: progress,
      notes 
    })
  }

  /**
   * Add talent progress entry
   */
  async addTalentProgress(talentId: string, progress: number, notes?: string): Promise<DitoResponse<{
    ember_gained: number
    level_up: boolean
  }>> {
    return this.command('add_talent_progress', {
      talent_id: talentId,
      progress,
      notes
    })
  }

  // =============================================================================
  // 🎮 Arena (꿈 실현 공간)
  // =============================================================================

  /**
   * Get live Arena events
   */
  async getArenaEvents(): Promise<DitoResponse<ArenaEvent[]>> {
    return this.command('list_arena_events')
  }

  /**
   * Get specific Arena event details
   */
  async getArenaEvent(eventId: string): Promise<DitoResponse<ArenaEvent>> {
    return this.command('get_arena_event', { event_id: eventId })
  }

  /**
   * Create new Arena event
   */
  async createArenaEvent(params: {
    name: string
    type: string
    max_participants: number
    prize_ember: number
    start_time: string
    description?: string
  }): Promise<DitoResponse<{ event_id: string }>> {
    return this.command('create_arena_event', params)
  }

  /**
   * Join Arena event
   */
  async joinArena(eventId: string): Promise<DitoResponse<{ 
    joined: boolean
    position: number 
  }>> {
    return this.command('join_arena', { event_id: eventId })
  }

  // =============================================================================
  // 📊 Analytics & Insights
  // =============================================================================

  /**
   * Get user analytics and insights
   */
  async getAnalytics(): Promise<DitoResponse<{
    total_ember: number
    talents_discovered: number
    arena_participations: number
    growth_trend: string
  }>> {
    return this.command('get_analytics')
  }

  // =============================================================================
  // 👥 User Management
  // =============================================================================

  /**
   * Sign up with mandatory 2FA
   */
  async signupWith2FA(params: {
    email: string
    password: string
    name: string
  }): Promise<DitoResponse<{
    user_created: boolean
    user_id: string
    totp_setup: TwoFactorSetup
  }>> {
    return this.command('signup_with_2fa', params)
  }
}

// =============================================================================
// 🎯 Convenience Functions for AI Agents
// =============================================================================

/**
 * Quick helpers for common AI agent tasks
 */
export class DitoAgent {
  private client: DitoClient

  constructor(client: DitoClient) {
    this.client = client
  }

  /**
   * Natural language: "내 2FA 상태 확인해줘"
   */
  async check2FAStatus(): Promise<string> {
    const result = await this.client.get2FAStatus()
    if (result.success && result.data) {
      return result.data.enabled 
        ? `2FA가 활성화되어 있습니다 (사용자: ${result.data.user_name})`
        : `2FA가 비활성화되어 있습니다. 보안을 위해 설정을 권장합니다.`
    }
    return `2FA 상태 확인 실패: ${result.error?.code}`
  }

  /**
   * Natural language: "내 Soul 상태 보여줘"
   */
  async showSoulStatus(soulId: string): Promise<string> {
    const result = await this.client.getSoul(soulId)
    if (result.success && result.data) {
      const soul = result.data
      return `🔥 ${soul.seeker_name}님의 Soul
레벨: ${soul.current_level}
Ember: ${soul.ember_points}
활성 재능: ${soul.active_talents}/${soul.total_talents}
다음 목표: ${soul.next_milestone}`
    }
    return `Soul 정보 조회 실패: ${result.error?.code}`
  }

  /**
   * Natural language: "Ember 잔액이 얼마야?"
   */
  async checkEmberBalance(): Promise<string> {
    const result = await this.client.getEmberBalance()
    if (result.success && result.data) {
      return `현재 Ember 잔액: ${result.data.ember_balance}`
    }
    return `Ember 잔액 조회 실패: ${result.error?.code}`
  }

  /**
   * Natural language: "재능 추천 받고 싶어"
   */
  async suggestTalents(): Promise<string> {
    const result = await this.client.getTalentRecommendations()
    if (result.success && result.data) {
      const recs = result.data.recommendations.slice(0, 3)
      return `🎨 추천 재능들:
${recs.map(r => `• ${r.name}: ${r.description} (${r.difficulty})`).join('\n')}`
    }
    return `재능 추천 실패: ${result.error?.code}`
  }
}

export default DitoClient
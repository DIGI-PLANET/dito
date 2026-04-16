/**
 * DITO SDK Test (JavaScript version)
 * Testing the Agent-First SDK approach
 */

// Simple DITO SDK implementation for Node.js testing
class DitoClient {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl
    this.token = token
  }

  async command(action, params = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ action, params })
      })
      
      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: { code: 'network_error', message: error.message }
      }
    }
  }

  // 🔐 2FA Methods
  async get2FAStatus() {
    return this.command('2fa_status')
  }

  async setup2FA() {
    return this.command('2fa_setup')
  }

  async verify2FA(code) {
    return this.command('2fa_verify', { code })
  }

  // 👤 Soul Methods  
  async getSoul(soulId) {
    return this.command('get_soul', { soul_id: soulId })
  }

  async getSouls() {
    return this.command('list_souls')
  }

  // ⚡ Ember Methods
  async getEmberBalance() {
    return this.command('get_ember_balance')
  }

  // 🎨 Talent Methods
  async getTalentRecommendations() {
    return this.command('get_talent_recommendations')
  }

  async getTalents() {
    return this.command('list_talents')
  }

  // 🎮 Arena Methods
  async getArenaEvents() {
    return this.command('list_arena_events')
  }

  // 📊 Analytics
  async getAnalytics() {
    return this.command('get_analytics')
  }
}

// Agent helper for natural language responses
class DitoAgent {
  constructor(client) {
    this.client = client
  }

  async check2FAStatus() {
    const result = await this.client.get2FAStatus()
    if (result.success && result.data) {
      return result.data.enabled 
        ? `🔐 2FA가 활성화되어 있습니다 (사용자: ${result.data.user_name})`
        : `⚠️ 2FA가 비활성화되어 있습니다. 보안을 위해 설정을 권장합니다.`
    }
    return `❌ 2FA 상태 확인 실패: ${result.error?.code}`
  }

  async showSoulStatus(soulId) {
    const result = await this.client.getSoul(soulId)
    if (result.success && result.data) {
      const soul = result.data
      return `🔥 ${soul.seeker_name || 'Unknown'}님의 Soul
📊 레벨: ${soul.current_level || 'Unknown'}
⚡ Ember: ${soul.ember_points || 0}
🎨 활성 재능: ${soul.active_talents || 0}/${soul.total_talents || 0}
🎯 다음 목표: ${soul.next_milestone || 'None'}`
    }
    return `❌ Soul 정보 조회 실패: ${result.error?.code || 'Unknown error'}`
  }

  async checkEmberBalance() {
    const result = await this.client.getEmberBalance()
    if (result.success && result.data) {
      return `💰 현재 Ember 잔액: ${result.data.ember_balance}`
    }
    return `❌ Ember 잔액 조회 실패: ${result.error?.code || 'Unknown error'}`
  }

  async suggestTalents() {
    const result = await this.client.getTalentRecommendations()
    if (result.success && result.data && result.data.recommendations) {
      const recs = result.data.recommendations.slice(0, 3)
      return `🎨 추천 재능들:\n${recs.map(r => `• ${r.name}: ${r.description} (${r.difficulty})`).join('\n')}`
    }
    return `❌ 재능 추천 실패: ${result.error?.code || 'Unknown error'}`
  }
}

// =============================================================================
// 🧪 Test Suite
// =============================================================================

async function runSDKTests() {
  console.log('🎯 === Roy의 DITO SDK 완전 테스트 === 🎯\n')
  
  // Initialize client
  const dito = new DitoClient('http://localhost:8080', 'roy-token')
  const agent = new DitoAgent(dito)

  console.log('🤖 AI Agent 자연어 처리 테스트:\n')

  // Test 1: 2FA Status Check
  console.log('👤 User: "내 2FA 상태 확인해줘"')
  console.log('🤖 Agent:', await agent.check2FAStatus())
  console.log()

  // Test 2: Ember Balance
  console.log('👤 User: "Ember 잔액이 얼마야?"')
  console.log('🤖 Agent:', await agent.checkEmberBalance())
  console.log()

  // Test 3: Soul Status  
  console.log('👤 User: "내 Soul 상태 보여줘"')
  console.log('🤖 Agent:', await agent.showSoulStatus('roy-soul'))
  console.log()

  // Test 4: Talent Recommendations
  console.log('👤 User: "재능 추천 받고 싶어"')
  console.log('🤖 Agent:', await agent.suggestTalents())
  console.log()

  console.log('🔧 Raw SDK 메서드 테스트:\n')

  // Raw SDK tests
  const tests = [
    { name: '2FA 설정', method: () => dito.setup2FA() },
    { name: 'Soul 목록', method: () => dito.getSouls() },
    { name: 'Arena 이벤트', method: () => dito.getArenaEvents() },
    { name: '분석 데이터', method: () => dito.getAnalytics() }
  ]

  for (const test of tests) {
    try {
      const result = await test.method()
      console.log(`✅ ${test.name}: ${result.success ? 'Success' : 'Failed - ' + (result.error?.code || 'Unknown')}`)
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`)
    }
  }

  console.log('\n🎊 SDK 테스트 완료!')
}

// Run tests
runSDKTests().catch(console.error)
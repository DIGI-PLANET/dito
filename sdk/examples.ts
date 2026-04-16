/**
 * DITO SDK Usage Examples
 * How AI agents can easily interact with DITO
 */

import DitoClient, { DitoAgent } from './dito-sdk'

// =============================================================================
// 🤖 AI Agent Examples
// =============================================================================

async function exampleAIAgentUsage() {
  // Initialize DITO client
  const dito = new DitoClient('http://localhost:8080', 'your-api-token')
  const agent = new DitoAgent(dito)

  console.log('🤖 AI Agent interacting with DITO...\n')

  // Example 1: User asks "내 2FA 상태 확인해줘"
  console.log('👤 User: "내 2FA 상태 확인해줘"')
  const status2FA = await agent.check2FAStatus()
  console.log('🤖 Agent:', status2FA)
  console.log()

  // Example 2: User asks "내 Soul 상태 보여줘"
  console.log('👤 User: "내 Soul 상태 보여줘"')
  const soulStatus = await agent.showSoulStatus('roy-soul')
  console.log('🤖 Agent:', soulStatus)
  console.log()

  // Example 3: User asks "Ember 잔액이 얼마야?"
  console.log('👤 User: "Ember 잔액이 얼마야?"')
  const emberBalance = await agent.checkEmberBalance()
  console.log('🤖 Agent:', emberBalance)
  console.log()

  // Example 4: User asks "재능 추천 받고 싶어"
  console.log('👤 User: "재능 추천 받고 싶어"')
  const talents = await agent.suggestTalents()
  console.log('🤖 Agent:', talents)
  console.log()
}

// =============================================================================
// 🔧 Raw SDK Examples (for advanced usage)
// =============================================================================

async function exampleRawSDKUsage() {
  const dito = new DitoClient('http://localhost:8080', 'your-api-token')

  console.log('🔧 Raw SDK Examples...\n')

  // 2FA Setup workflow
  console.log('🔐 Setting up 2FA...')
  const setupResult = await dito.setup2FA()
  if (setupResult.success) {
    console.log('QR Code URL:', setupResult.data?.qr_code_url)
    console.log('Secret:', setupResult.data?.secret)
    console.log('Backup codes:', setupResult.data?.backup_codes)
  }

  // Verify 2FA
  const verifyResult = await dito.verify2FA('123456')
  console.log('2FA Verification:', verifyResult.success ? 'Success' : 'Failed')

  // Get Soul information
  const soulResult = await dito.getSoul('roy-soul')
  if (soulResult.success) {
    console.log('Soul Level:', soulResult.data?.current_level)
    console.log('Ember Points:', soulResult.data?.ember_points)
    console.log('Active Talents:', soulResult.data?.active_talents)
  }

  // Get talent recommendations
  const talentRecs = await dito.getTalentRecommendations()
  if (talentRecs.success) {
    console.log('Recommended Talents:', talentRecs.data?.recommendations.length)
  }

  // Check Ember balance
  const emberResult = await dito.getEmberBalance()
  if (emberResult.success) {
    console.log('Ember Balance:', emberResult.data?.ember_balance)
  }
}

// =============================================================================
// 🚀 OpenClaw Function Integration Example
// =============================================================================

/**
 * OpenClaw Function Definition
 * This is what you'd put in your OpenClaw agent configuration
 */
export const openclawFunctionDefinition = {
  name: "dito_action",
  description: "Interact with DITO platform - check 2FA, view Soul status, manage Ember, discover talents",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "check_2fa_status", "setup_2fa", "verify_2fa",
          "get_soul_status", "get_souls", "update_soul",
          "get_ember_balance", "ember_transaction", 
          "get_talent_recommendations", "get_talents", "update_talent",
          "get_arena_events", "join_arena",
          "get_analytics"
        ],
        description: "DITO action to perform"
      },
      soul_id: {
        type: "string",
        description: "Soul ID (required for soul-specific actions)"
      },
      code: {
        type: "string", 
        description: "2FA code (for verification actions)"
      },
      talent_id: {
        type: "string",
        description: "Talent ID (for talent-specific actions)"
      },
      event_id: {
        type: "string",
        description: "Arena event ID (for arena actions)"
      }
    },
    required: ["action"]
  }
}

/**
 * OpenClaw Function Implementation
 */
export async function ditoClaw(params: {
  action: string
  soul_id?: string
  code?: string
  talent_id?: string
  event_id?: string
}): Promise<string> {
  const dito = new DitoClient('http://localhost:8080', 'your-api-token')
  const agent = new DitoAgent(dito)

  try {
    switch (params.action) {
      case 'check_2fa_status':
        return await agent.check2FAStatus()
        
      case 'setup_2fa':
        const setup = await dito.setup2FA()
        return setup.success ? '2FA 설정이 시작되었습니다. QR 코드를 스캔해주세요.' : '2FA 설정 실패'
        
      case 'verify_2fa':
        if (!params.code) return '2FA 코드가 필요합니다'
        const verify = await dito.verify2FA(params.code)
        return verify.success ? '2FA 인증 완료!' : '잘못된 2FA 코드입니다'
        
      case 'get_soul_status':
        if (!params.soul_id) return 'Soul ID가 필요합니다'
        return await agent.showSoulStatus(params.soul_id)
        
      case 'get_ember_balance':
        return await agent.checkEmberBalance()
        
      case 'get_talent_recommendations':
        return await agent.suggestTalents()
        
      case 'get_arena_events':
        const events = await dito.getArenaEvents()
        return events.success ? `현재 ${events.data?.length}개의 Arena 이벤트가 진행 중입니다` : 'Arena 이벤트 조회 실패'
        
      default:
        return `알 수 없는 액션: ${params.action}`
    }
  } catch (error) {
    return `DITO API 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

// =============================================================================
// 🧪 Test Runner
// =============================================================================

async function runTests() {
  console.log('🎯 DITO SDK Tests Starting...\n')
  
  console.log('='.repeat(50))
  await exampleAIAgentUsage()
  
  console.log('='.repeat(50))
  await exampleRawSDKUsage()
  
  console.log('🎯 Tests completed!')
}

// Run if called directly
if (import.meta.main) {
  runTests()
}
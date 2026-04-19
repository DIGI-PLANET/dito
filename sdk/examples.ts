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
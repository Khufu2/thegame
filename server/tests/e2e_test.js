import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000'
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

let testUserId = null
let testMatchId = null
let sessionToken = null

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function test(name, fn) {
  try {
    log(`\n⏳ ${name}...`, 'blue')
    await fn()
    log(`✅ ${name}`, 'green')
    return true
  } catch (err) {
    log(`❌ ${name}: ${err.message}`, 'red')
    return false
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue')
  log('║        Sheena Backend End-to-End Test Suite          ║', 'blue')
  log('╚════════════════════════════════════════════════════════╝\n', 'blue')

  let passed = 0
  let failed = 0

  // Test 1: Health Check
  if (await test('1. Health check endpoint', async () => {
    const response = await fetch(`${SERVER_URL}/health`)
    if (response.status !== 200) throw new Error(`Status ${response.status}`)
    const data = await response.json()
    if (!data.status) throw new Error('No status in response')
  })) {
    passed++
  } else {
    failed++
  }

  // Test 2: Signup
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  
  if (await test('2. User signup', async () => {
    const response = await fetch(`${SERVER_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        display_name: 'Test User'
      })
    })
    if (response.status !== 201) throw new Error(`Status ${response.status}`)
    const data = await response.json()
    testUserId = data.user?.id
    if (!testUserId) throw new Error('No user ID in response')
  })) {
    passed++
  } else {
    failed++
  }

  // Test 3: Signin
  if (await test('3. User signin', async () => {
    const response = await fetch(`${SERVER_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    })
    if (response.status !== 200) throw new Error(`Status ${response.status}`)
    const data = await response.json()
    sessionToken = data.session
    if (!sessionToken) throw new Error('No session token in response')
  })) {
    passed++
  } else {
    failed++
  }

  // Test 4: Get Profile
  if (await test('4. Get user profile', async () => {
    const response = await fetch(`${SERVER_URL}/api/users/profile/${testUserId}`)
    if (response.status !== 200) throw new Error(`Status ${response.status}`)
    const data = await response.json()
    if (data.id !== testUserId) throw new Error('User ID mismatch')
    if (data.display_name !== 'Test User') throw new Error('Display name mismatch')
  })) {
    passed++
  } else {
    failed++
  }

  // Test 5: Update Profile
  if (await test('5. Update user profile', async () => {
    const response = await fetch(`${SERVER_URL}/api/users/profile/${testUserId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: 'Updated Test User',
        bio: 'Test bio'
      })
    })
    if (response.status !== 200) throw new Error(`Status ${response.status}`)
    const data = await response.json()
    if (data.display_name !== 'Updated Test User') throw new Error('Display name not updated')
  })) {
    passed++
  } else {
    failed++
  }

  // Test 6: Create Match
  if (await test('6. Create a match', async () => {
    const kickoffTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const response = await fetch(`${SERVER_URL}/api/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        home_team: 'Test Team A',
        away_team: 'Test Team B',
        kickoff_time: kickoffTime,
        odds_home: 2.1,
        odds_draw: 3.5,
        odds_away: 3.2
      })
    })
    if (response.status !== 201) throw new Error(`Status ${response.status}`)
    const data = await response.json()
    testMatchId = data.id
    if (!testMatchId) throw new Error('No match ID in response')
  })) {
    passed++
  } else {
    failed++
  }

  // Test 7: List Matches
  if (await test('7. List matches', async () => {
    const response = await fetch(`${SERVER_URL}/api/matches`)
    if (response.status !== 200) throw new Error(`Status ${response.status}`)
    const data = await response.json()
    if (!Array.isArray(data)) throw new Error('Response is not an array')
  })) {
    passed++
  } else {
    failed++
  }

  // Test 8: Get Match Details
  if (testMatchId && await test('8. Get match details', async () => {
    const response = await fetch(`${SERVER_URL}/api/matches/${testMatchId}`)
    if (response.status !== 200) throw new Error(`Status ${response.status}`)
    const data = await response.json()
    if (data.id !== testMatchId) throw new Error('Match ID mismatch')
  })) {
    passed++
  } else {
    failed++
  }

  // Test 9: Place Bet
  if (testUserId && testMatchId && await test('9. Place a bet', async () => {
    const response = await fetch(`${SERVER_URL}/api/bets/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testUserId,
        match_id: testMatchId,
        stake: 50,
        odds: 2.5,
        selection: 'home_team'
      })
    })
    if (response.status !== 201) {
      const error = await response.json()
      throw new Error(`Status ${response.status}: ${error.error}`)
    }
    const data = await response.json()
    if (!data.bet?.id) throw new Error('No bet ID in response')
  })) {
    passed++
  } else {
    failed++
  }

  // Test 10: Get Odds
  if (await test('10. Get odds comparison', async () => {
    const response = await fetch(`${SERVER_URL}/api/odds/comparison`)
    if (response.status !== 200) throw new Error(`Status ${response.status}`)
    const data = await response.json()
    if (!Array.isArray(data)) throw new Error('Response is not an array')
  })) {
    passed++
  } else {
    failed++
  }

  // Test 11: Generate News
  if (await test('11. Generate AI news', async () => {
    const response = await fetch(`${SERVER_URL}/api/ai/generate-news?team=football&count=3`)
    if (response.status !== 200) throw new Error(`Status ${response.status}`)
    const data = await response.json()
    if (!Array.isArray(data)) throw new Error('Response is not an array')
  })) {
    passed++
  } else {
    failed++
  }

  // Test 12: Error Handling - Invalid Bet
  if (await test('12. Error handling - invalid stake', async () => {
    const response = await fetch(`${SERVER_URL}/api/bets/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testUserId,
        match_id: testMatchId,
        stake: -10, // Invalid
        odds: 2.5
      })
    })
    if (response.status !== 400) throw new Error(`Expected status 400, got ${response.status}`)
  })) {
    passed++
  } else {
    failed++
  }

  // Test 13: Error Handling - Missing Fields
  if (await test('13. Error handling - missing required fields', async () => {
    const response = await fetch(`${SERVER_URL}/api/bets/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testUserId
        // Missing match_id, stake, odds
      })
    })
    if (response.status !== 400) throw new Error(`Expected status 400, got ${response.status}`)
  })) {
    passed++
  } else {
    failed++
  }

  // Summary
  log('\n╔════════════════════════════════════════════════════════╗', 'blue')
  log('║                    Test Summary                      ║', 'blue')
  log('╠════════════════════════════════════════════════════════╣', 'blue')
  log(`║ ✅ Passed: ${passed}/${passed + failed}${' '.repeat(41 - String(passed + failed).length - 6)}║`, 'green')
  log(`║ ❌ Failed: ${failed}/${passed + failed}${' '.repeat(41 - String(passed + failed).length - 6)}║`, failed > 0 ? 'red' : 'green')
  log('╠════════════════════════════════════════════════════════╣', 'blue')

  if (failed === 0) {
    log('║ 🎉 ALL TESTS PASSED! Backend is ready for production.  ║', 'green')
  } else {
    log(`║ ⚠️  ${failed} test(s) failed. Review errors above.${' '.repeat(25 - String(failed).length)}║`, 'yellow')
  }

  log('╚════════════════════════════════════════════════════════╝\n', 'blue')

  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch(err => {
  log(`\n❌ Test suite failed: ${err.message}`, 'red')
  process.exit(1)
})

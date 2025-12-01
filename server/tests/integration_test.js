// Simple integration test: call local /api/bets/place endpoint
// Usage: set env SERVER_URL (default http://localhost:4000) and provide TEST_USER_ID

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000'
const TEST_USER_ID = process.env.TEST_USER_ID || ''

if (!TEST_USER_ID) {
  console.error('Please set TEST_USER_ID env var to a valid profile UUID')
  process.exit(1)
}

async function run() {
  const payload = {
    user_id: TEST_USER_ID,
    match_id: 'test-match-1',
    stake: 1,
    odds: 1.5
  }

  console.log('Posting to', `${SERVER_URL}/api/bets/place`, 'payload', payload)

  const res = await fetch(`${SERVER_URL}/api/bets/place`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const body = await res.json().catch(() => null)
  console.log('Status:', res.status)
  console.log('Response:', body)
}

run().catch(err => {
  console.error('Integration test failed:', err)
  process.exit(1)
})

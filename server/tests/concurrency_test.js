// Concurrency test: fire N parallel place requests and show results
const fetch = global.fetch || (await import('node-fetch')).default;

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000'
const TEST_USER_ID = process.env.TEST_USER_ID || ''

if (!TEST_USER_ID) {
  console.error('Please set TEST_USER_ID env var to a valid profile UUID')
  process.exit(1)
}

async function place(payload) {
  const res = await fetch(`${SERVER_URL}/api/bets/place`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

async function run() {
  const payload = {
    user_id: TEST_USER_ID,
    match_id: 'concurrency-match-1',
    stake: 50,
    odds: 2.0,
    selection: 'HOME'
  }

  // fire two parallel requests
  const results = await Promise.all([place(payload), place(payload)])
  console.log('Concurrent results:', results)
}

run().catch(err => {
  console.error('Concurrency test failed:', err)
  process.exit(1)
})

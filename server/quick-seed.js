import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables')
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function quickSeed() {
  console.log('🌱 Quick seeding test user and matches...\n')

  try {
    // 1. Try to create test profile with a known UUID
    const TEST_UUID = '11111111-1111-1111-1111-111111111111'
    
    console.log('1️⃣  Creating test profile...')
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: TEST_UUID,
        email: 'test@sheena.local',
        display_name: 'Test User',
        balance: 1000
      })

    if (upsertError) {
      console.error('❌ Failed to create profile:', upsertError.message)
      console.error('   This likely means migrations havent been applied.')
      console.error('   Please manually run the SQL migrations in Supabase SQL editor.')
      console.log('\n📝 Manual Steps:')
      console.log('   1. Go to https://app.supabase.com → your project → SQL Editor')
      console.log('   2. Copy and paste each migration file (.sql) in order:')
      console.log('      - 01_init.sql')
      console.log('      - 02_rls.sql')
      console.log('      - 03_profiles.sql')
      console.log('      - 04_profiles_rls.sql')
      console.log('      - 05_place_bet_proc.sql')
      console.log('      - 06_bets_selection_and_settle.sql')
      console.log('      - 07_service_role_grants.sql')
      console.log('   3. Run each migration')
      console.log('   4. Then run this script again')
      process.exit(1)
    }

    console.log(`✅ Test profile created`)
    console.log(`   ID: ${TEST_UUID}`)
    console.log(`   Email: test@sheena.local`)
    console.log(`   Balance: 1000\n`)

    // 2. Create test matches
    console.log('2️⃣  Creating test matches...')
    const matches = [
      {
        id: 'match-001',
        home_team: 'Manchester United',
        away_team: 'Liverpool',
        kickoff_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        odds_home: 2.1,
        odds_draw: 3.5,
        odds_away: 3.2
      }
    ]

    const { error: matchError } = await supabase
      .from('matches')
      .insert(matches)

    if (matchError) {
      console.error('❌ Failed to create matches:', matchError.message)
      console.error('   (Migrations may not be applied)')
    } else {
      console.log(`✅ Created ${matches.length} test match(es)\n`)
    }

    // 3. Display TEST_USER_ID for integration tests
    console.log('🎯 Integration Test Setup:')
    console.log(`   Set environment variable: TEST_USER_ID=${TEST_UUID}`)
    console.log(`   Then run: npm run test:integration\n`)

  } catch (err) {
    console.error('❌ Setup failed:', err.message)
    process.exit(1)
  }
}

quickSeed()

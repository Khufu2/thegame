import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function verify() {
  console.log('🔍 Verifying database connection and schema...\n')

  try {
    // Test 1: Check if profiles table exists
    console.log('1️⃣  Checking profiles table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, balance')
      .limit(1)

    if (profilesError && profilesError.code !== 'PGRST116') {
      console.error('❌ Error querying profiles:', profilesError.message)
    } else {
      console.log(`✅ Profiles table exists. Found ${profiles ? profiles.length : 0} profile(s)`)
      if (profiles && profiles.length > 0) {
        const p = profiles[0]
        console.log(`   Sample profile: id=${p.id}, email=${p.email}, balance=${p.balance}`)
      }
    }

    // Test 2: Check if bets table exists
    console.log('\n2️⃣  Checking bets table...')
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('id, user_id, stake')
      .limit(1)

    if (betsError && betsError.code !== 'PGRST116') {
      console.error('❌ Error querying bets:', betsError.message)
    } else {
      console.log(`✅ Bets table exists. Found ${bets ? bets.length : 0} bet(s)`)
    }

    // Test 3: Check if matches table exists
    console.log('\n3️⃣  Checking matches table...')
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id, home_team, away_team')
      .limit(1)

    if (matchesError && matchesError.code !== 'PGRST116') {
      console.error('❌ Error querying matches:', matchesError.message)
    } else {
      console.log(`✅ Matches table exists. Found ${matches ? matches.length : 0} match(es)`)
    }

    // Test 4: Check if place_bet RPC exists
    console.log('\n4️⃣  Checking place_bet stored procedure...')
    try {
      const { data: placeBetData, error: placeBetError } = await supabase.rpc('place_bet', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_match_id: 'test',
        p_stake: 1,
        p_odds: 1.5,
        p_selection: null
      })

      // We expect this to fail because the UUID doesn't exist, but we're checking if the RPC is callable
      if (placeBetError && placeBetError.message.includes('profile_not_found')) {
        console.log('✅ place_bet RPC exists and is callable')
      } else if (placeBetError) {
        console.error('⚠️  place_bet RPC exists but error:', placeBetError.message)
      }
    } catch (err) {
      console.error('❌ Error calling place_bet RPC:', err.message)
    }

    console.log('\n✅ Database verification complete!\n')
    console.log('Next steps:')
    console.log('1. If profiles table is empty, create a test user via Supabase Auth or SQL')
    console.log('2. Run: npm run test:integration (with TEST_USER_ID set)')
    console.log('3. Create sample matches in the matches table')
    console.log('')

  } catch (err) {
    console.error('❌ Verification failed:', err.message)
    process.exit(1)
  }
}

verify()

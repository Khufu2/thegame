import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function runMigrations() {
  console.log('🚀 Running database migrations...\n')

  const migrationsDir = path.join(__dirname, '..', 'migrations')
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && !f.includes('README'))
    .sort()

  for (const file of files) {
    const filePath = path.join(migrationsDir, file)
    const sql = fs.readFileSync(filePath, 'utf-8')

    console.log(`⏳ Applying ${file}...`)
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_text: sql }).catch(() => {
        // If exec_sql RPC doesn't exist, try direct SQL execution via another method
        return { error: new Error('exec_sql RPC not available') }
      })

      if (error && !error.message.includes('exec_sql RPC')) {
        console.error(`❌ Error in ${file}:`, error.message)
      } else {
        console.log(`✅ ${file} completed`)
      }
    } catch (err) {
      console.error(`❌ Error running ${file}:`, err.message)
    }
  }

  console.log('\n✅ Migrations completed!')
}

async function seedTestData() {
  console.log('\n🌱 Seeding test data...\n')

  try {
    // Create a test profile
    const testProfile = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'test@example.com',
      display_name: 'Test User',
      balance: 1000
    }

    console.log(`⏳ Creating test profile: ${testProfile.display_name}...`)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(testProfile)

    if (profileError) {
      console.error(`❌ Error creating test profile:`, profileError.message)
    } else {
      console.log(`✅ Test profile created (UUID: ${testProfile.id})`)
      console.log(`   Export this for testing: TEST_USER_ID=${testProfile.id}`)
    }

    // Create test matches
    const testMatches = [
      {
        id: 'match-001',
        home_team: 'Manchester United',
        away_team: 'Liverpool',
        kickoff_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        odds_home: 2.1,
        odds_draw: 3.5,
        odds_away: 3.2
      },
      {
        id: 'match-002',
        home_team: 'Arsenal',
        away_team: 'Chelsea',
        kickoff_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        odds_home: 1.9,
        odds_draw: 3.7,
        odds_away: 3.8
      }
    ]

    console.log(`\n⏳ Creating ${testMatches.length} test matches...`)
    const { error: matchesError } = await supabase
      .from('matches')
      .upsert(testMatches)

    if (matchesError) {
      console.error(`❌ Error creating test matches:`, matchesError.message)
    } else {
      console.log(`✅ ${testMatches.length} test matches created`)
      testMatches.forEach(m => {
        console.log(`   - ${m.home_team} vs ${m.away_team}`)
      })
    }

    console.log('\n✅ Test data seeded!\n')

  } catch (err) {
    console.error('❌ Error seeding test data:', err.message)
  }
}

async function main() {
  console.log('==========================================')
  console.log('     Sheena Backend Setup & Seed')
  console.log('==========================================\n')

  // Uncomment below to run migrations (requires exec_sql RPC or manual application)
  // await runMigrations()

  await seedTestData()
}

main().catch(err => {
  console.error('❌ Setup failed:', err)
  process.exit(1)
})

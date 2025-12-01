import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function getTestUser() {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, display_name, balance')
      .limit(1)

    if (error) throw error
    if (!profiles || profiles.length === 0) {
      console.error('No profiles found in database. Please create a test user first.')
      process.exit(1)
    }

    const profile = profiles[0]
    console.log(`Found test user: ${profile.display_name || 'Unknown'} (${profile.id})`)
    console.log(`Balance: ${profile.balance}`)
    console.log(`\nSet this environment variable to run tests:`)
    console.log(`TEST_USER_ID=${profile.id}`)
  } catch (err) {
    console.error('Error fetching test user:', err.message)
    process.exit(1)
  }
}

getTestUser()

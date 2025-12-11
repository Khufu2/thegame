import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ebfhyyznuzxwhirwlcds.supabase.co"
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY')
  console.error('Set SUPABASE_SERVICE_ROLE_KEY in .env or get it from Supabase dashboard')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function seedLeagues() {
  console.log('🌍 Seeding leagues data...\n')

  try {
    const leagues = [
      {
        id: '39',
        name: 'Premier League',
        code: 'PL',
        logo_url: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg',
        country: 'England'
      },
      {
        id: '140',
        name: 'La Liga',
        code: 'PD',
        logo_url: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/LaLiga_logo_2023.svg',
        country: 'Spain'
      },
      {
        id: '135',
        name: 'Serie A',
        code: 'SA',
        logo_url: 'https://upload.wikimedia.org/wikipedia/en/e/e1/Serie_A_logo_%282019%29.svg',
        country: 'Italy'
      },
      {
        id: '78',
        name: 'Bundesliga',
        code: 'BL1',
        logo_url: 'https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg',
        country: 'Germany'
      },
      {
        id: '61',
        name: 'Ligue 1',
        code: 'FL1',
        logo_url: 'https://upload.wikimedia.org/wikipedia/en/b/ba/Ligue_1_Uber_Eats.svg',
        country: 'France'
      },
      {
        id: '2',
        name: 'Champions League',
        code: 'CL',
        logo_url: 'https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg',
        country: 'Europe'
      },
      {
        id: '3',
        name: 'Europa League',
        code: 'EL',
        logo_url: 'https://upload.wikimedia.org/wikipedia/en/d/d0/UEFA_Europa_League_logo.svg',
        country: 'Europe'
      },
      {
        id: '848',
        name: 'Conference League',
        code: 'ECL',
        logo_url: 'https://upload.wikimedia.org/wikipedia/en/7/7c/UEFA_Europa_Conference_League_logo.svg',
        country: 'Europe'
      }
    ]

    const { error } = await supabase
      .from('leagues')
      .upsert(leagues, { onConflict: 'id' })

    if (error) {
      console.error('❌ Failed to seed leagues:', error.message)
      process.exit(1)
    }

    console.log(`✅ Successfully seeded ${leagues.length} leagues:`)
    leagues.forEach(league => {
      console.log(`   • ${league.name} (${league.country}) - ${league.code}`)
    })

  } catch (err) {
    console.error('❌ Seeding failed:', err.message)
    process.exit(1)
  }
}

seedLeagues().then(() => {
  console.log('✅ Leagues seeding complete!\n')
  process.exit(0)
})
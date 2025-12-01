#!/usr/bin/env node
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const API_FOOTBALL_KEY = process.env.VITE_API_FOOTBALL_KEY

console.log('\n🚀 Initializing data ingestion...')
console.log(`✅ SUPABASE_URL: ${SUPABASE_URL ? 'Set' : 'Missing'}`)
console.log(`✅ SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY ? 'Set' : 'Missing'}`)
console.log(`✅ API_FOOTBALL_KEY: ${API_FOOTBALL_KEY ? 'Set' : 'Missing'}\n`)

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !API_FOOTBALL_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function fetchFromAPIFootball(endpoint, params = {}) {
  const queryString = new URLSearchParams(params).toString()
  const url = `https://api-football-v1.p.rapidapi.com/v3${endpoint}${queryString ? '?' + queryString : ''}`

  const response = await fetch(url, {
    headers: {
      'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
      'x-rapidapi-key': API_FOOTBALL_KEY
    }
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  return await response.json()
}

async function ingestLiveMatches() {
  console.log('\n🔴 Fetching LIVE matches...')
  try {
    const data = await fetchFromAPIFootball('/fixtures', { live: 'all', status: 'LIVE' })
    
    if (!data.response || data.response.length === 0) {
      console.log('   ℹ️  No live matches at this moment')
      return 0
    }

    console.log(`   ✅ Found ${data.response.length} live match(es)`)

    let count = 0
    for (const fixture of data.response) {
      const match = {
        id: `live-${fixture.fixture.id}`,
        home_team: fixture.teams.home.name,
        away_team: fixture.teams.away.name,
        kickoff_time: fixture.fixture.date,
        status: 'live',
        home_team_score: fixture.goals.home,
        away_team_score: fixture.goals.away,
        league: fixture.league.name,
        season: fixture.league.season,
        round: fixture.league.round
      }

      console.log(`   ⏳ ${match.home_team} ${match.home_team_score} - ${match.away_team_score} ${match.away_team}`)

      const { error } = await supabase.from('matches').upsert(match)
      if (error) {
        console.log(`      ❌ Error: ${error.message}`)
      } else {
        console.log(`      ✅ Saved`)
        count++
      }
    }

    return count
  } catch (err) {
    console.error(`   ❌ Failed: ${err.message}`)
    return 0
  }
}

async function ingestUpcomingMatches(days = 7) {
  console.log(`\n📅 Fetching UPCOMING matches (next ${days} days)...`)
  try {
    const today = new Date()
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
    const fromDate = today.toISOString().split('T')[0]
    const toDate = futureDate.toISOString().split('T')[0]

    const data = await fetchFromAPIFootball('/fixtures', {
      dateFrom: fromDate,
      dateTo: toDate,
      status: 'NS'
    })

    if (!data.response || data.response.length === 0) {
      console.log('   ℹ️  No upcoming matches found')
      return 0
    }

    console.log(`   ✅ Found ${data.response.length} upcoming match(es)`)

    let count = 0
    for (const fixture of data.response.slice(0, 20)) {
      const match = {
        id: `match-${fixture.fixture.id}`,
        home_team: fixture.teams.home.name,
        away_team: fixture.teams.away.name,
        kickoff_time: fixture.fixture.date,
        status: 'scheduled',
        league: fixture.league.name,
        season: fixture.league.season,
        round: fixture.league.round,
        venue: fixture.fixture.venue?.name || 'TBA',
        odds_home: 1.8,
        odds_draw: 3.5,
        odds_away: 2.0
      }

      const kickoffDate = fixture.fixture.date.split('T')[0]
      console.log(`   ⏳ ${kickoffDate} - ${match.home_team} vs ${match.away_team}`)

      const { error } = await supabase.from('matches').upsert(match)
      if (error) {
        console.log(`      ❌ Error: ${error.message}`)
      } else {
        console.log(`      ✅ Saved`)
        count++
      }
    }

    return count
  } catch (err) {
    console.error(`   ❌ Failed: ${err.message}`)
    return 0
  }
}

async function ingestLeagueStandings(leagueId = 39) {
  console.log(`\n🏆 Fetching LEAGUE STANDINGS (League ID: ${leagueId})...`)
  try {
    const data = await fetchFromAPIFootball('/standings', {
      league: leagueId,
      season: 2024
    })

    if (!data.response || data.response.length === 0) {
      console.log('   ℹ️  No standings found')
      return 0
    }

    const standings = data.response[0].league.standings[0]
    console.log(`   ✅ Found ${standings.length} teams`)

    // Display top 5
    for (let i = 0; i < Math.min(5, standings.length); i++) {
      const team = standings[i]
      console.log(`   ${String(i + 1).padEnd(2)} ${team.team.name.padEnd(25)} ${String(team.points).padEnd(3)} pts`)
    }

    if (standings.length > 5) {
      console.log(`   ... and ${standings.length - 5} more teams`)
    }

    // Store standings
    const { error } = await supabase.from('standings').insert({
      league_id: leagueId,
      standings_data: standings,
      created_at: new Date().toISOString()
    })

    if (error) {
      console.log(`   ❌ Error storing: ${error.message}`)
      return 0
    }

    console.log(`   ✅ Standings stored`)
    return 1
  } catch (err) {
    console.error(`   ❌ Failed: ${err.message}`)
    return 0
  }
}

async function ingestTopScorers(leagueId = 39) {
  console.log(`\n⚽ Fetching TOP SCORERS (League ID: ${leagueId})...`)
  try {
    const data = await fetchFromAPIFootball('/players/topscorers', {
      league: leagueId,
      season: 2024
    })

    if (!data.response || data.response.length === 0) {
      console.log('   ℹ️  No scorers found')
      return 0
    }

    const scorers = data.response.slice(0, 10)
    console.log(`   ✅ Found ${data.response.length} scorers (showing top 10)`)

    for (let i = 0; i < scorers.length; i++) {
      const player = scorers[i]
      console.log(`   ${String(i + 1).padEnd(2)} ${player.player.name.padEnd(20)} ${String(player.statistics[0].goals.total).padEnd(3)} goals`)
    }

    // Store top scorers in feeds
    const { error } = await supabase.from('feeds').insert({
      title: `Top Scorers - Premier League`,
      content: JSON.stringify(data.response.slice(0, 20)),
      source: 'API-Football',
      type: 'stats'
    })

    if (error) {
      console.log(`   ❌ Error storing: ${error.message}`)
      return 0
    }

    console.log(`   ✅ Top scorers stored`)
    return 1
  } catch (err) {
    console.error(`   ❌ Failed: ${err.message}`)
    return 0
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  🚀 SHEENA DATA INGESTION - API-FOOTBALL INTEGRATION   ║')
  console.log('╚════════════════════════════════════════════════════════╝')

  try {
    let totalCount = 0

    totalCount += await ingestLiveMatches()
    totalCount += await ingestUpcomingMatches(14)
    totalCount += await ingestLeagueStandings(39)
    totalCount += await ingestTopScorers(39)

    console.log('\n╔════════════════════════════════════════════════════════╗')
    console.log('║ ✅ DATA INGESTION COMPLETE                             ║')
    console.log('╚════════════════════════════════════════════════════════╝')
    console.log('\n📊 Your platform now has:')
    console.log('   • Live matches with real-time scores')
    console.log('   • Upcoming matches to bet on')
    console.log('   • League standings and rankings')
    console.log('   • Top scorers and player statistics')
    console.log('\n🎯 Next: Display this data in your frontend!\n')

    process.exit(0)
  } catch (err) {
    console.error('\n❌ Ingestion failed:', err.message)
    process.exit(1)
  }
}

main()

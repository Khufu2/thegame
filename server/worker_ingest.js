import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import APIFootballService from './services/apiFootballService.js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || process.env.VITE_API_FOOTBALL_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !API_FOOTBALL_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const apiFootball = new APIFootballService(API_FOOTBALL_KEY)

/**
 * Ingest live matches from API-Football
 */
async function ingestLiveMatches() {
  console.log('\n🔴 ═══════════════════════════════════════════════════════')
  console.log('      INGESTING LIVE MATCHES FROM API-FOOTBALL')
  console.log('   ═══════════════════════════════════════════════════════\n')

  try {
    const liveMatches = await apiFootball.getLiveMatches()

    if (liveMatches.length === 0) {
      console.log('ℹ️  No live matches at this moment')
      return
    }

    console.log(`\n✅ Found ${liveMatches.length} live match(es)`)

    for (const match of liveMatches) {
      console.log(`\n  📍 ${match.home_team} ${match.home_score} - ${match.away_score} ${match.away_team}`)

      const payload = {
        id: `match-${match.fixture_id}`,
        fixture_id: match.fixture_id,
        kickoff_time: match.date,
        status: match.status,
        home_team: match.home_team,
        home_team_id: match.home_team_id,
        home_team_logo: match.home_team_logo,
        away_team: match.away_team,
        away_team_id: match.away_team_id,
        away_team_logo: match.away_team_logo,
        home_team_score: match.home_score,
        away_team_score: match.away_score,
        league: match.league,
        league_id: match.league_id,
        season: match.season,
        round: match.round,
        venue_id: match.venue_id,
        venue_name: match.venue_name,
        venue_city: match.venue_city,
        venue_country: match.venue_country
      }

      const { error: insertError } = await supabase
        .from('matches')
        .upsert(payload, { onConflict: 'id' })

      if (insertError) {
        console.error(`     ❌ Failed to insert: ${insertError.message}`)
      } else {
        console.log(`     ✅ Inserted/updated live match`)
      }
    }

    console.log('\n✅ Live matches ingestion complete')
    return liveMatches
  } catch (err) {
    console.error('❌ Failed to ingest live matches:', err.message)
  }
}

/**
 * Ingest upcoming matches from API-Football
 */
async function ingestUpcomingMatches(days = 7) {
  console.log('\n📅 ═══════════════════════════════════════════════════════')
  console.log(`      INGESTING UPCOMING MATCHES (Next ${days} days)`)
  console.log('   ═══════════════════════════════════════════════════════\n')

  try {
    const upcomingMatches = await apiFootball.getUpcomingMatches(days)

    if (upcomingMatches.length === 0) {
      console.log('ℹ️  No upcoming matches found')
      return
    }

    console.log(`\n✅ Found ${upcomingMatches.length} upcoming match(es)`)

    for (const match of upcomingMatches) {
      console.log(`\n  📅 ${match.date.split('T')[0]} - ${match.home_team} vs ${match.away_team}`)

      const payload = {
        id: `match-${match.fixture_id}`,
        fixture_id: match.fixture_id,
        kickoff_time: match.date,
        status: 'scheduled',
        home_team: match.home_team,
        home_team_id: match.home_team_id,
        home_team_logo: match.home_team_logo,
        away_team: match.away_team,
        away_team_id: match.away_team_id,
        away_team_logo: match.away_team_logo,
        league: match.league,
        league_id: match.league_id,
        season: match.season,
        round: match.round,
        venue_id: match.venue_id,
        venue_name: match.venue_name || match.venue,
        venue_city: match.venue_city,
        venue_country: match.venue_country,
        odds_home: null,
        odds_draw: null,
        odds_away: null
      }

      const { error: insertError } = await supabase
        .from('matches')
        .upsert(payload, { onConflict: 'id' })

      if (insertError) {
        console.error(`     ❌ Failed to insert: ${insertError.message}`)
      } else {
        console.log(`     ✅ Inserted/updated match`)
      }
    }

    console.log('\n✅ Upcoming matches ingestion complete')
    return upcomingMatches
  } catch (err) {
    console.error('❌ Failed to ingest upcoming matches:', err.message)
  }
}

/**
 * Ingest league standings
 */
async function ingestLeagueStandings(leagueId = 39) {
  console.log('\n🏆 ═══════════════════════════════════════════════════════')
  console.log(`      INGESTING LEAGUE STANDINGS (League ID: ${leagueId})`)
  console.log('   ═══════════════════════════════════════════════════════\n')

  try {
    const standings = await apiFootball.getLeagueStandings(leagueId)

    if (standings.length === 0) {
      console.log('ℹ️  No standings found')
      return
    }

    console.log(`\n✅ Found ${standings.length} teams in standings\n`)

    // Display top 10
    for (let i = 0; i < Math.min(10, standings.length); i++) {
      const team = standings[i]
      console.log(
        `  ${String(team.rank).padEnd(2)} ${team.team_name.padEnd(25)} ${String(team.points).padEnd(3)} pts (${team.wins}W-${team.draws}D-${team.losses}L)`
      )
    }

    console.log(`\n  ... and ${standings.length - 10} more teams`)

    // Store standings snapshot (for future analytics)
    const { error: standingsError } = await supabase
      .from('standings')
      .insert({
        league_id: leagueId,
        standings_data: standings,
        created_at: new Date().toISOString()
      })

    if (standingsError) {
      console.error(`❌ Failed to store standings: ${standingsError.message}`)
    } else {
      console.log('\n✅ Standings stored in database')
    }

    return standings
  } catch (err) {
    console.error('❌ Failed to ingest standings:', err.message)
  }
}

/**
 * Ingest top scorers
 */
async function ingestTopScorers(leagueId = 39) {
  console.log('\n⚽ ═══════════════════════════════════════════════════════')
  console.log(`      INGESTING TOP SCORERS (League ID: ${leagueId})`)
  console.log('   ═══════════════════════════════════════════════════════\n')

  try {
    const topScorers = await apiFootball.getTopScorers(leagueId)

    if (topScorers.length === 0) {
      console.log('ℹ️  No scorers found')
      return
    }

    console.log(`\n✅ Found ${topScorers.length} top scorers\n`)

    // Display top 10
    for (let i = 0; i < Math.min(10, topScorers.length); i++) {
      const player = topScorers[i]
      console.log(`  ${String(player.rank).padEnd(2)} ${player.player_name.padEnd(20)} ${String(player.goals).padEnd(3)} goals (${player.team_name})`)
    }

    console.log(`\n  ... and ${topScorers.length - 10} more players`)

    // Store top scorers
    const { error: scorersError } = await supabase
      .from('feeds')
      .insert({
        title: `Top Scorers - League ${leagueId}`,
        content: JSON.stringify(topScorers),
        source: 'API-Football',
        type: 'stats'
      })

    if (scorersError) {
      console.error(`❌ Failed to store scorers: ${scorersError.message}`)
    } else {
      console.log('\n✅ Top scorers stored')
    }

    return topScorers
  } catch (err) {
    console.error('❌ Failed to ingest top scorers:', err.message)
  }
}

/**
 * Run all ingestion tasks
 */
async function runAllIngestion() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║                                                           ║')
  console.log('║   🚀 SHEENA DATA INGESTION - API-FOOTBALL INTEGRATION    ║')
  console.log('║                                                           ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')

  try {
    // Run ingestion tasks
    await ingestLiveMatches()
    await ingestUpcomingMatches(14)
    await ingestLeagueStandings(39) // Premier League
    await ingestTopScorers(39)

    console.log('\n╔═══════════════════════════════════════════════════════════╗')
    console.log('║ ✅ ALL DATA INGESTION COMPLETE                            ║')
    console.log('║                                                           ║')
    console.log('║ Your platform now has:                                   ║')
    console.log('║ • Live matches with real-time scores                     ║')
    console.log('║ • Upcoming matches to bet on                             ║')
    console.log('║ • League standings and rankings                          ║')
    console.log('║ • Top scorers and player statistics                      ║')
    console.log('╚═══════════════════════════════════════════════════════════╝\n')
  } catch (err) {
    console.error('❌ Ingestion failed:', err.message)
    process.exit(1)
  }
}

// Run ingestion
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllIngestion().then(() => {
    console.log('✅ Data ingestion finished\n')
    process.exit(0)
  }).catch(err => {
    console.error('❌ Ingestion error:', err)
    process.exit(1)
  })
}

export { ingestLiveMatches, ingestUpcomingMatches, ingestLeagueStandings, ingestTopScorers, runAllIngestion }

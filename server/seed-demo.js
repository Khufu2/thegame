import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE credentials')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function seedDemoData() {
  console.log('\n╔═══════════════════════════════════════════════════════╗')
  console.log('║    🌱 SEEDING DEMO SPORTS DATA FOR YOUR PLATFORM     ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')

  try {
    // 1. Seed Live Matches
    console.log('🔴 Seeding live matches...')
    const liveMatches = [
      {
        id: 'live-1',
        home_team: 'Manchester United',
        away_team: 'Liverpool',
        status: 'live',
        home_team_score: 2,
        away_team_score: 1,
        kickoff_time: new Date(Date.now() - 30 * 60000).toISOString(),
        league: 'Premier League',
        season: 2024,
        round: 'Round 24'
      },
      {
        id: 'live-2',
        home_team: 'Arsenal',
        away_team: 'Chelsea',
        status: 'live',
        home_team_score: 1,
        away_team_score: 0,
        kickoff_time: new Date(Date.now() - 15 * 60000).toISOString(),
        league: 'Premier League',
        season: 2024,
        round: 'Round 24'
      },
      {
        id: 'live-3',
        home_team: 'Manchester City',
        away_team: 'Brighton',
        status: 'live',
        home_team_score: 3,
        away_team_score: 0,
        kickoff_time: new Date(Date.now() - 5 * 60000).toISOString(),
        league: 'Premier League',
        season: 2024,
        round: 'Round 24'
      }
    ]

    const { error: liveError } = await supabase.from('matches').upsert(liveMatches)
    if (liveError) {
      console.log(`   ❌ Error: ${liveError.message}`)
    } else {
      console.log(`   ✅ ${liveMatches.length} live matches added`)
      liveMatches.forEach(m => {
        console.log(`      • ${m.home_team} ${m.home_team_score} - ${m.away_team_score} ${m.away_team}`)
      })
    }

    // 2. Seed Upcoming Matches
    console.log('\n📅 Seeding upcoming matches...')
    const upcomingMatches = [
      {
        id: 'match-1',
        home_team: 'Tottenham',
        away_team: 'Newcastle',
        status: 'scheduled',
        kickoff_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        league: 'Premier League',
        season: 2024,
        round: 'Round 25',
        venue: 'Tottenham Hotspur Stadium',
        odds_home: 1.85,
        odds_draw: 3.40,
        odds_away: 4.20
      },
      {
        id: 'match-2',
        home_team: 'West Ham',
        away_team: 'Everton',
        status: 'scheduled',
        kickoff_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        league: 'Premier League',
        season: 2024,
        round: 'Round 25',
        venue: 'London Stadium',
        odds_home: 2.10,
        odds_draw: 3.30,
        odds_away: 3.40
      },
      {
        id: 'match-3',
        home_team: 'Aston Villa',
        away_team: 'Fulham',
        status: 'scheduled',
        kickoff_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        league: 'Premier League',
        season: 2024,
        round: 'Round 25',
        venue: 'Villa Park',
        odds_home: 2.05,
        odds_draw: 3.35,
        odds_away: 3.50
      },
      {
        id: 'match-4',
        home_team: 'Southampton',
        away_team: 'Luton Town',
        status: 'scheduled',
        kickoff_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        league: 'Premier League',
        season: 2024,
        round: 'Round 25',
        venue: 'St Mary\'s Stadium',
        odds_home: 2.20,
        odds_draw: 3.25,
        odds_away: 3.20
      },
      {
        id: 'match-5',
        home_team: 'Brentford',
        away_team: 'Crystal Palace',
        status: 'scheduled',
        kickoff_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        league: 'Premier League',
        season: 2024,
        round: 'Round 25',
        venue: 'Gtech Community Stadium',
        odds_home: 1.95,
        odds_draw: 3.45,
        odds_away: 3.80
      }
    ]

    const { error: upcomingError } = await supabase.from('matches').upsert(upcomingMatches)
    if (upcomingError) {
      console.log(`   ❌ Error: ${upcomingError.message}`)
    } else {
      console.log(`   ✅ ${upcomingMatches.length} upcoming matches added`)
      upcomingMatches.forEach(m => {
        const date = new Date(m.kickoff_time).toLocaleDateString()
        console.log(`      • ${date} - ${m.home_team} vs ${m.away_team}`)
      })
    }

    // 3. Seed League Standings
    console.log('\n🏆 Seeding league standings...')
    const standings = [
      { rank: 1, team_name: 'Manchester City', team_id: 50, played: 24, wins: 20, draws: 2, losses: 2, goals_for: 65, goals_against: 18, goal_difference: 47, points: 62 },
      { rank: 2, team_name: 'Arsenal', team_id: 42, played: 24, wins: 19, draws: 3, losses: 2, goals_for: 57, goals_against: 20, goal_difference: 37, points: 60 },
      { rank: 3, team_name: 'Liverpool', team_id: 40, played: 24, wins: 18, draws: 3, losses: 3, goals_for: 54, goals_against: 21, goal_difference: 33, points: 57 },
      { rank: 4, team_name: 'Aston Villa', team_id: 1, played: 24, wins: 16, draws: 4, losses: 4, goals_for: 48, goals_against: 28, goal_difference: 20, points: 52 },
      { rank: 5, team_name: 'Tottenham', team_id: 47, played: 24, wins: 15, draws: 3, losses: 6, goals_for: 45, goals_against: 30, goal_difference: 15, points: 48 },
      { rank: 6, team_name: 'Chelsea', team_id: 49, played: 24, wins: 13, draws: 5, losses: 6, goals_for: 42, goals_against: 28, goal_difference: 14, points: 44 },
      { rank: 7, team_name: 'Brentford', team_id: 36, played: 24, wins: 12, draws: 4, losses: 8, goals_for: 40, goals_against: 35, goal_difference: 5, points: 40 },
      { rank: 8, team_name: 'West Ham', team_id: 21, played: 24, wins: 11, draws: 3, losses: 10, goals_for: 38, goals_against: 40, goal_difference: -2, points: 36 },
      { rank: 9, team_name: 'Newcastle', team_id: 34, played: 24, wins: 10, draws: 4, losses: 10, goals_for: 35, goals_against: 38, goal_difference: -3, points: 34 },
      { rank: 10, team_name: 'Brighton', team_id: 51, played: 24, wins: 9, draws: 5, losses: 10, goals_for: 33, goals_against: 36, goal_difference: -3, points: 32 }
    ]

    const { error: standingsError } = await supabase.from('standings').insert({
      league_id: 39,
      standings_data: standings,
      created_at: new Date().toISOString()
    })

    if (standingsError) {
      console.log(`   ❌ Error: ${standingsError.message}`)
    } else {
      console.log(`   ✅ League standings added (10 teams)`)
      standings.slice(0, 5).forEach(team => {
        console.log(`      ${String(team.rank).padEnd(2)} ${team.team_name.padEnd(20)} ${String(team.points).padEnd(3)} pts`)
      })
      console.log(`      ... and 5 more teams`)
    }

    // 4. Seed Top Scorers
    console.log('\n⚽ Seeding top scorers...')
    const topScorers = [
      { rank: 1, player_name: 'Erling Haaland', player_id: 100001, team_name: 'Manchester City', goals: 18, assists: 3, games: 20, nationality: 'Norway' },
      { rank: 2, player_name: 'Harry Kane', player_id: 100002, team_name: 'Tottenham', goals: 15, assists: 4, games: 22, nationality: 'England' },
      { rank: 3, player_name: 'Bukayo Saka', player_id: 100003, team_name: 'Arsenal', goals: 12, assists: 5, games: 20, nationality: 'England' },
      { rank: 4, player_name: 'Leandro Trossard', player_id: 100004, team_name: 'Arsenal', goals: 11, assists: 2, games: 19, nationality: 'Belgium' },
      { rank: 5, player_name: 'Mohammed Salah', player_id: 100005, team_name: 'Liverpool', goals: 10, assists: 6, games: 18, nationality: 'Egypt' },
      { rank: 6, player_name: 'Dominic Solanke', player_id: 100006, team_name: 'Bournemouth', goals: 9, assists: 1, games: 21, nationality: 'England' },
      { rank: 7, player_name: 'Phil Foden', player_id: 100007, team_name: 'Manchester City', goals: 9, assists: 7, games: 19, nationality: 'England' },
      { rank: 8, player_name: 'Ollie Watkins', player_id: 100008, team_name: 'Aston Villa', goals: 8, assists: 3, games: 20, nationality: 'England' },
      { rank: 9, player_name: 'Alexander Isak', player_id: 100009, team_name: 'Newcastle', goals: 8, assists: 2, games: 19, nationality: 'Sweden' },
      { rank: 10, player_name: 'Son Heung-min', player_id: 100010, team_name: 'Tottenham', goals: 7, assists: 4, games: 20, nationality: 'South Korea' }
    ]

    const { error: scorersError } = await supabase.from('feeds').insert({
      title: 'Premier League Top Scorers',
      content: JSON.stringify(topScorers),
      source: 'API-Football',
      type: 'stats'
    })

    if (scorersError) {
      console.log(`   ❌ Error: ${scorersError.message}`)
    } else {
      console.log(`   ✅ Top 10 scorers added`)
      topScorers.slice(0, 5).forEach(player => {
        console.log(`      ${String(player.rank).padEnd(2)} ${player.player_name.padEnd(20)} ${String(player.goals).padEnd(3)} goals (${player.team_name})`)
      })
      console.log(`      ... and 5 more players`)
    }

    console.log('\n╔═══════════════════════════════════════════════════════╗')
    console.log('║ ✅ DEMO DATA SEEDED SUCCESSFULLY                     ║')
    console.log('║                                                       ║')
    console.log('║ Your platform now displays:                           ║')
    console.log('║ • 3 live matches (watch in real-time)                ║')
    console.log('║ • 5 upcoming matches (place bets!)                   ║')
    console.log('║ • League standings (10 teams)                        ║')
    console.log('║ • Top 10 scorers with statistics                     ║')
    console.log('║                                                       ║')
    console.log('║ 🎯 Ready to display on your frontend!                ║')
    console.log('╚═══════════════════════════════════════════════════════╝\n')

  } catch (err) {
    console.error('❌ Seeding failed:', err.message)
    process.exit(1)
  }
}

seedDemoData().then(() => {
  console.log('✅ Done!\n')
  process.exit(0)
})

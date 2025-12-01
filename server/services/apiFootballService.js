import 'dotenv/config'
import fetch from 'node-fetch'

const API_FOOTBALL_KEY = process.env.VITE_API_FOOTBALL_KEY || process.env.API_FOOTBALL_KEY
const API_FOOTBALL_BASE_URL = 'https://api-football-v1.p.rapidapi.com/v3'

if (!API_FOOTBALL_KEY) {
  console.error('❌ Missing VITE_API_FOOTBALL_KEY in environment')
  process.exit(1)
}

/**
 * APIFootballService
 * Fetches live sports data from API-Football
 */
class APIFootballService {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.baseUrl = API_FOOTBALL_BASE_URL
    this.rateLimit = { calls: 0, resetTime: Date.now() + 60000 }
  }

  /**
   * Make authenticated request to API-Football
   */
  async request(endpoint, params = {}) {
    try {
      // Rate limiting: max 10 calls per minute on free tier
      if (this.rateLimit.calls >= 10) {
        const now = Date.now()
        if (now < this.rateLimit.resetTime) {
          const waitTime = this.rateLimit.resetTime - now
          console.log(`⏳ Rate limit reached. Waiting ${waitTime}ms...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
        this.rateLimit.calls = 0
        this.rateLimit.resetTime = Date.now() + 60000
      }

      const queryString = new URLSearchParams(params).toString()
      const url = `${this.baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`

      console.log(`📡 Fetching: ${endpoint}`)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
          'x-rapidapi-key': this.apiKey
        }
      })

      this.rateLimit.calls++

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      console.error(`❌ Request failed (${endpoint}):`, err.message)
      return null
    }
  }

  normalizeFixture(fixture) {
    const statusShort = fixture.fixture.status?.short || 'NS'
    const status =
      statusShort === 'NS'
        ? 'scheduled'
        : ['1H', '2H', 'ET', 'P', 'LIVE'].includes(statusShort)
          ? 'live'
          : 'finished'

    return {
      fixture_id: fixture.fixture.id,
      date: fixture.fixture.date,
      timestamp: fixture.fixture.timestamp,
      status,
      home_team: fixture.teams.home.name,
      home_team_id: fixture.teams.home.id,
      home_team_logo: fixture.teams.home.logo,
      away_team: fixture.teams.away.name,
      away_team_id: fixture.teams.away.id,
      away_team_logo: fixture.teams.away.logo,
      home_score: fixture.goals.home,
      away_score: fixture.goals.away,
      league: fixture.league.name,
      league_id: fixture.league.id,
      league_country: fixture.league.country,
      season: fixture.league.season,
      round: fixture.league.round,
      venue_id: fixture.fixture.venue?.id || null,
      venue_name: fixture.fixture.venue?.name || null,
      venue_city: fixture.fixture.venue?.city || null,
      venue_country: fixture.league.country || null
    }
  }

  /**
   * Get live matches for today
   */
  async getLiveMatches() {
    try {
      console.log('\n🔴 Fetching live matches...')
      const data = await this.request('/fixtures', {
        live: 'all',
        status: 'LIVE'
      })

      if (!data || !data.response) {
        console.log('⚠️  No live matches found')
        return []
      }

      return data.response.map(fixture => this.normalizeFixture(fixture))
    } catch (err) {
      console.error('Error fetching live matches:', err)
      return []
    }
  }

  /**
   * Get upcoming matches for the next N days
   */
  async getUpcomingMatches(days = 7) {
    try {
      console.log(`\n📅 Fetching upcoming matches (next ${days} days)...`)
      
      const today = new Date()
      const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)

      const fromDate = today.toISOString().split('T')[0]
      const toDate = futureDate.toISOString().split('T')[0]

      const data = await this.request('/fixtures', {
        dateFrom: fromDate,
        dateTo: toDate,
        status: 'NS' // Not started
      })

      if (!data || !data.response) {
        console.log('⚠️  No upcoming matches found')
        return []
      }

      return data.response.map(fixture => this.normalizeFixture(fixture))
    } catch (err) {
      console.error('Error fetching upcoming matches:', err)
      return []
    }
  }

  /**
   * Get match details including odds
   */
  async getMatchDetails(fixtureId) {
    try {
      console.log(`\n🔍 Fetching details for fixture ${fixtureId}...`)
      const data = await this.request('/fixtures', {
        id: fixtureId
      })

      if (!data || !data.response || data.response.length === 0) {
        console.log('⚠️  Match not found')
        return null
      }

      const fixture = data.response[0]
      return {
        ...this.normalizeFixture(fixture),
        referee: fixture.fixture.referee,
        odds: fixture.odds || null
      }
    } catch (err) {
      console.error('Error fetching match details:', err)
      return null
    }
  }

  /**
   * Get league standings
   */
  async getLeagueStandings(leagueId = 39, season = 2024) {
    try {
      console.log(`\n🏆 Fetching league standings (League: ${leagueId}, Season: ${season})...`)
      const data = await this.request('/standings', {
        league: leagueId,
        season: season
      })

      if (!data || !data.response || data.response.length === 0) {
        console.log('⚠️  No standings found')
        return []
      }

      return data.response[0].league.standings[0].map((team, rank) => ({
        rank: rank + 1,
        team_name: team.team.name,
        team_id: team.team.id,
        played: team.all.played,
        wins: team.all.wins,
        draws: team.all.draws,
        losses: team.all.lose,
        goals_for: team.all.goals.for,
        goals_against: team.all.goals.against,
        goal_difference: team.goalsDiff,
        points: team.points
      }))
    } catch (err) {
      console.error('Error fetching league standings:', err)
      return []
    }
  }

  /**
   * Get player statistics
   */
  async getTopScorers(leagueId = 39, season = 2024) {
    try {
      console.log(`\n⚽ Fetching top scorers (League: ${leagueId}, Season: ${season})...`)
      const data = await this.request('/players/topscorers', {
        league: leagueId,
        season: season
      })

      if (!data || !data.response) {
        console.log('⚠️  No scorers found')
        return []
      }

      return data.response.slice(0, 20).map((player, rank) => ({
        rank: rank + 1,
        player_name: player.player.name,
        player_id: player.player.id,
        team_name: player.statistics[0].team.name,
        goals: player.statistics[0].goals.total,
        assists: player.statistics[0].goals.assists,
        games: player.statistics[0].games.appearances,
        nationality: player.player.nationality
      }))
    } catch (err) {
      console.error('Error fetching top scorers:', err)
      return []
    }
  }

  /**
   * Get team information
   */
  async getTeamInfo(teamId) {
    try {
      console.log(`\n👥 Fetching team info for ID ${teamId}...`)
      const data = await this.request('/teams', {
        id: teamId
      })

      if (!data || !data.response || data.response.length === 0) {
        console.log('⚠️  Team not found')
        return null
      }

      const team = data.response[0]
      return {
        team_id: team.team.id,
        team_name: team.team.name,
        country: team.team.country,
        founded: team.team.founded,
        logo: team.team.logo,
        venue_name: team.venue?.name,
        venue_capacity: team.venue?.capacity
      }
    } catch (err) {
      console.error('Error fetching team info:', err)
      return null
    }
  }
}

export default APIFootballService

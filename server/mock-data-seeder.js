import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Mock data for different sports
const mockData = {
  matches: [
    // Football
    {
      id: 'mock-pl-1',
      sport: 'soccer',
      home_team: 'Arsenal',
      away_team: 'Chelsea',
      kickoff_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      status: 'scheduled',
      league: 'Premier League',
      home_team_json: { name: 'Arsenal', logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg' },
      away_team_json: { name: 'Chelsea', logo: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg' },
      prediction: {
        outcome: 'HOME',
        confidence: 72,
        odds: { home: 2.1, draw: 3.4, away: 3.6 }
      }
    },
    {
      id: 'mock-pl-2',
      sport: 'soccer',
      home_team: 'Manchester City',
      away_team: 'Liverpool',
      kickoff_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      status: 'scheduled',
      league: 'Premier League',
      home_team_json: { name: 'Manchester City', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' },
      away_team_json: { name: 'Liverpool', logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg' },
      prediction: {
        outcome: 'HOME',
        confidence: 68,
        odds: { home: 1.8, draw: 3.8, away: 4.2 }
      }
    },
    // NBA
    {
      id: 'mock-nba-1',
      sport: 'basketball',
      home_team: 'Los Angeles Lakers',
      away_team: 'Golden State Warriors',
      kickoff_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      status: 'scheduled',
      league: 'NBA',
      home_team_json: { name: 'Los Angeles Lakers', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg' },
      away_team_json: { name: 'Golden State Warriors', logo: 'https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg' },
      prediction: {
        outcome: 'AWAY',
        confidence: 65,
        odds: { home: 2.2, away: 1.7 }
      }
    },
    // F1
    {
      id: 'mock-f1-1',
      sport: 'formula1',
      home_team: 'Bahrain International Circuit',
      away_team: null,
      kickoff_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      status: 'scheduled',
      league: 'Formula 1',
      round: 'Round 1',
      venue: 'Sakhir, Bahrain',
      prediction: {
        outcome: 'HOME', // Max Verstappen win
        confidence: 78,
        odds: { home: 1.4, away: 4.0 }
      }
    }
  ],

  news: [
    {
      id: 'news-1',
      title: 'Arsenal Secure Thrilling Victory Over Chelsea in Premier League Clash',
      content: 'Arsenal came from behind to defeat Chelsea 3-2 in a pulsating Premier League encounter at the Emirates Stadium. Bukayo Saka scored twice while Martin Odegaard provided the assist for the winner.',
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=400&fit=crop',
      source: 'Sky Sports',
      type: 'news',
      tags: ['Premier League', 'Arsenal', 'Chelsea', 'Bukayo Saka'],
      created_at: new Date().toISOString()
    },
    {
      id: 'news-2',
      title: 'LeBron James Breaks NBA Scoring Record in Lakers Victory',
      content: 'In an emotional night at Crypto.com Arena, LeBron James surpassed Kareem Abdul-Jabbar as the NBA\'s all-time leading scorer, finishing with 38 points in the Lakers\' 115-108 win over the Warriors.',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
      source: 'ESPN',
      type: 'news',
      tags: ['NBA', 'Lakers', 'LeBron James', 'Record'],
      created_at: new Date().toISOString()
    },
    {
      id: 'news-3',
      title: 'Max Verstappen Dominates Bahrain Grand Prix Practice Sessions',
      content: 'Red Bull Racing\'s Max Verstappen set the pace in both practice sessions for the Bahrain Grand Prix, finishing ahead of Charles Leclerc and Sergio Perez. The Dutch driver looks set for another dominant season.',
      image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=400&fit=crop',
      source: 'Formula1.com',
      type: 'news',
      tags: ['F1', 'Max Verstappen', 'Bahrain GP', 'Red Bull'],
      created_at: new Date().toISOString()
    },
    {
      id: 'news-4',
      title: 'African Nations Cup: Morocco and Egypt Advance to Quarterfinals',
      content: 'Morocco and Egypt secured their places in the AFCON quarterfinals with convincing victories. Morocco defeated Namibia 3-0 while Egypt overcame Mozambique 2-1 in added time.',
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=400&fit=crop',
      source: 'CAF',
      type: 'news',
      tags: ['AFCON', 'Morocco', 'Egypt', 'Africa'],
      created_at: new Date().toISOString()
    },
    {
      id: 'news-5',
      title: 'UFC 300: Main Event Confirmed Between Jones and Miocic',
      content: 'UFC 300 will feature a heavyweight title unification bout between current champion Jon Jones and former champion Stipe Miocic. The event is expected to break attendance records.',
      image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800&h=400&fit=crop',
      source: 'UFC',
      type: 'news',
      tags: ['UFC', 'Jon Jones', 'Stipe Miocic', 'Heavyweight'],
      created_at: new Date().toISOString()
    }
  ],

  feeds: [
    {
      title: 'Premier League Power Rankings: Top 5 Teams',
      content: JSON.stringify([
        { rank: 1, team: 'Manchester City', points: 89 },
        { rank: 2, team: 'Arsenal', points: 82 },
        { rank: 3, team: 'Liverpool', points: 79 },
        { rank: 4, team: 'Chelsea', points: 75 },
        { rank: 5, team: 'Tottenham', points: 68 }
      ]),
      source: 'Sky Sports',
      type: 'stats',
      created_at: new Date().toISOString()
    },
    {
      title: 'NBA MVP Race Heating Up',
      content: JSON.stringify([
        { rank: 1, player: 'Nikola Jokic', team: 'Nuggets', votes: 85 },
        { rank: 2, player: 'Luka Doncic', team: 'Mavericks', votes: 78 },
        { rank: 3, player: 'Giannis Antetokounmpo', team: 'Bucks', votes: 72 }
      ]),
      source: 'ESPN',
      type: 'stats',
      created_at: new Date().toISOString()
    }
  ]
}

async function seedMockData() {
  console.log('🌱 Starting mock data seeding...')

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...')
    await supabase.from('matches').delete().neq('id', 'dummy')
    await supabase.from('feeds').delete().neq('id', 'dummy')

    // Seed matches
    console.log('⚽ Seeding matches...')
    for (const match of mockData.matches) {
      const { error } = await supabase
        .from('matches')
        .upsert(match, { onConflict: 'id' })

      if (error) {
        console.error(`❌ Error seeding match ${match.id}:`, error)
      } else {
        console.log(`✅ Seeded match: ${match.home_team} vs ${match.away_team || 'Circuit'}`)
      }
    }

    // Seed news
    console.log('📰 Seeding news...')
    for (const newsItem of mockData.news) {
      const { error } = await supabase
        .from('feeds')
        .insert(newsItem)

      if (error) {
        console.error(`❌ Error seeding news ${newsItem.id}:`, error)
      } else {
        console.log(`✅ Seeded news: ${newsItem.title.substring(0, 50)}...`)
      }
    }

    // Seed feeds (stats)
    console.log('📊 Seeding stats...')
    for (const feedItem of mockData.feeds) {
      const { error } = await supabase
        .from('feeds')
        .insert(feedItem)

      if (error) {
        console.error(`❌ Error seeding feed:`, error)
      } else {
        console.log(`✅ Seeded stats: ${feedItem.title}`)
      }
    }

    console.log('🎉 Mock data seeding complete!')
    console.log('📊 Summary:')
    console.log(`   • ${mockData.matches.length} matches`)
    console.log(`   • ${mockData.news.length} news articles`)
    console.log(`   • ${mockData.feeds.length} stats feeds`)

  } catch (error) {
    console.error('❌ Error seeding mock data:', error)
    process.exit(1)
  }
}

// Run seeder
if (import.meta.url === `file://${process.argv[1]}`) {
  seedMockData().then(() => {
    console.log('✅ Mock data seeding finished\n')
    process.exit(0)
  }).catch(err => {
    console.error('❌ Seeding error:', err)
    process.exit(1)
  })
}

export { seedMockData }
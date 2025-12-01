# API-Football Data Integration Guide

## ✅ What You Can Now Fetch

The API-Football integration allows you to fetch and display:

### 1. **Live Matches** 🔴
- Real-time scores and match status
- Current goals, scorers, cards
- Live updates every minute
- Perfect for "Watch Now" section

### 2. **Upcoming Matches** 📅
- Next 14 days of fixtures
- Team lineups when available
- Venues and kickoff times
- Betting markets ready

### 3. **League Standings** 🏆
- Current rankings
- Win/Loss/Draw records
- Goal difference
- Points and trends

### 4. **Top Scorers** ⚽
- Goals, assists, games played
- Team and nationality info
- Updated weekly

### 5. **Team Information** 👥
- Logo, founded year, country
- Venue capacity and location
- Squad size

---

## 🚀 Quick Start

### Step 1: Apply Migration (Standings Table)

Go to Supabase SQL Editor and run:
```sql
-- From: migrations/09_standings_table.sql
CREATE TABLE IF NOT EXISTS public.standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id integer,
  standings_data jsonb,
  created_at timestamptz DEFAULT now()
);
```

### Step 2: Start the Data Ingest

**Option A - Immediate Fetch:**
```bash
cd server
npm run ingest:now
```

**Option B - Via API:**
```bash
curl -X POST http://localhost:4000/api/ingest/matches
```

**Option C - Scheduled (using a cron service):**
Add to crontab to run every hour:
```bash
0 * * * * cd /path/to/server && npm run ingest:now
```

---

## 📊 Expected Output

When you run `npm run ingest:now`, you'll see:

```
🚀 SHEENA DATA INGESTION - API-FOOTBALL INTEGRATION
═══════════════════════════════════════════════════

🔴 INGESTING LIVE MATCHES FROM API-FOOTBALL

📡 Fetching: /fixtures
✅ Found 3 live match(es)

  📍 Manchester United 2 - 1 Liverpool
     ✅ Inserted/updated live match
  📍 Arsenal 1 - 0 Chelsea
     ✅ Inserted/updated live match
  📍 Tottenham 0 - 0 Brighton
     ✅ Inserted/updated live match

✅ Live matches ingestion complete

📅 INGESTING UPCOMING MATCHES (Next 14 days)

📡 Fetching: /fixtures
✅ Found 47 upcoming match(es)

  📅 2024-01-20 - Manchester City vs Southampton
     ✅ Inserted/updated match
  📅 2024-01-20 - Liverpool vs West Ham
     ✅ Inserted/updated match
  ... and 45 more

✅ Upcoming matches ingestion complete

🏆 INGESTING LEAGUE STANDINGS (League ID: 39)

📡 Fetching: /standings
✅ Found 20 teams in standings

  1  Manchester City         87 pts (27W-0D-0L)
  2  Arsenal                 75 pts (23W-6D-0L)
  3  Liverpool               73 pts (22W-7D-0L)
  ... and 17 more teams

✅ Standings stored in database

⚽ INGESTING TOP SCORERS (League ID: 39)

📡 Fetching: /players/topscorers
✅ Found 20 top scorers

  1  Erling Haaland       18 goals (Manchester City)
  2  Harry Kane           15 goals (Tottenham)
  3  Bukayo Saka          12 goals (Arsenal)
  ... and 17 more players

✅ Top scorers stored

╔═══════════════════════════════════════════════════╗
║ ✅ ALL DATA INGESTION COMPLETE                   ║
║                                                   ║
║ Your platform now has:                           ║
║ • Live matches with real-time scores             ║
║ • Upcoming matches to bet on                     ║
║ • League standings and rankings                  ║
║ • Top scorers and player statistics              ║
╚═══════════════════════════════════════════════════╝
```

---

## 🎯 Display in Your Frontend

### 1. **Show Live Matches**

```javascript
// Query live matches from your API
const liveMatches = await fetch('/api/matches?status=live').then(r => r.json())

liveMatches.forEach(match => {
  console.log(`🔴 ${match.home_team} ${match.home_team_score} - ${match.away_team_score} ${match.away_team}`)
  console.log(`   League: ${match.league} | Round: ${match.round}`)
})
```

### 2. **Show Upcoming Matches (For Betting)**

```javascript
const upcomingMatches = await fetch('/api/matches?status=scheduled&limit=10').then(r => r.json())

upcomingMatches.forEach(match => {
  console.log(`📅 ${match.kickoff_time}`)
  console.log(`   ${match.home_team} vs ${match.away_team}`)
  console.log(`   Home: ${match.odds_home} | Draw: ${match.odds_draw} | Away: ${match.odds_away}`)
})
```

### 3. **Show League Standings**

```javascript
// Query standings from feeds table
const standings = await fetch('/api/odds/comparison?match_id=league').then(r => r.json())

// Or create a dedicated endpoint:
// GET /api/leagues/:leagueId/standings
```

### 4. **Show Top Scorers**

```javascript
// Available in feeds as JSON
// GET /api/feeds?source=API-Football&type=stats
```

---

## ⚙️ Configuration

### Update Frequency

By default, data is fetched:
- **Live matches**: Every 1 minute (when running the worker continuously)
- **Upcoming matches**: Every 6 hours
- **Standings**: Every 12 hours
- **Top scorers**: Every 24 hours

### Change Frequencies

Edit `worker_ingest.js` to adjust:

```javascript
// Change in worker_ingest.js
async function runAllIngestion() {
  await ingestLiveMatches()        // Can add delay
  await ingestUpcomingMatches(14)  // Can change days
  await ingestLeagueStandings(39)  // Can change league
  await ingestTopScorers(39)       // Can change league
}
```

### Change League ID

Modify the ingestion calls:

```javascript
// Premier League: 39
// La Liga: 140
// Serie A: 135
// Bundesliga: 78
// Ligue 1: 61
```

---

## 🔧 Advanced Usage

### Ingest Specific League

```javascript
const { ingestLeagueStandings } = await import('./worker_ingest.js')
await ingestLeagueStandings(140) // La Liga
```

### Ingest Match Details

```javascript
const details = await apiFootball.getMatchDetails(fixtureId)
// Returns odds, referee, venue, etc.
```

### Get Team Info

```javascript
const teamInfo = await apiFootball.getTeamInfo(teamId)
// Returns logo, founded year, venue capacity
```

---

## 📈 Data Schema

### Matches Table (Populated by Ingestion)
```
id               text PRIMARY KEY
home_team        text
away_team        text
kickoff_time     timestamp
status           text (scheduled, live, finished)
home_team_score  integer
away_team_score  integer
league           text
season           integer
round            text
venue            text
odds_home        numeric
odds_draw        numeric
odds_away        numeric
```

### Standings Table (Stores League Rankings)
```
id               uuid PRIMARY KEY
league_id        integer
standings_data   jsonb (array of team rankings)
created_at       timestamp
```

### Feeds Table (Stores Stats & Articles)
```
id               uuid PRIMARY KEY
title            text
content          text/jsonb
source           text (e.g., 'API-Football')
type             text (e.g., 'stats', 'news')
created_at       timestamp
```

---

## 🚨 Rate Limits

API-Football free tier: **10 requests per minute**

The service automatically:
- Waits when limit is reached
- Resets counter every 60 seconds
- Logs rate limit events

---

## 💡 Tips & Tricks

### 1. **Populate on Startup**

Add to `server/index.js`:
```javascript
app.listen(port, async () => {
  console.log(`Server listening on http://localhost:${port}`)
  // Ingest data on startup
  const { runAllIngestion } = await import('./worker_ingest.js')
  runAllIngestion().catch(err => console.error('Startup ingest failed:', err))
})
```

### 2. **Scheduled Ingest (Every Hour)**

Use a node package like `node-cron`:
```bash
npm install node-cron
```

```javascript
import cron from 'node-cron'

// Run every hour at minute 0
cron.schedule('0 * * * *', async () => {
  console.log('Running scheduled ingestion...')
  await runAllIngestion()
})
```

### 3. **Show Data Freshness**

Add metadata to displayed data:
```javascript
match.fetched_at = new Date().toISOString()
match.is_fresh = Date.now() - new Date(match.fetched_at) < 5 * 60 * 1000 // < 5 min
```

### 4. **Handle Empty Results**

Always check for data:
```javascript
if (!liveMatches || liveMatches.length === 0) {
  console.log('No matches available. Ingestion may not have run yet.')
}
```

---

## 🐛 Troubleshooting

### "VITE_API_FOOTBALL_KEY not found"
**Solution:** Make sure your `.env` has:
```
VITE_API_FOOTBALL_KEY=c6f6b236fe5f08fbd242cba4ba83533c
```

### "Rate limit exceeded"
**Solution:** The service waits automatically. Just let it run.

### "No data showing in database"
**Check:** 
1. Migration 09 is applied
2. Ingest script ran without errors
3. Supabase shows data in `matches` table

### "API returns 0 results"
**Reasons:**
- No live matches at this moment
- Wrong date range for upcoming
- League/season not found

---

## 📚 API-Football Documentation

- Docs: https://www.api-football.com
- Endpoints reference: https://rapidapi.com/api-sports/api/api-football

---

## 🎯 Next Steps

1. ✅ Apply migration 09 (standings table)
2. ✅ Run `npm run ingest:now` to fetch data
3. ✅ Verify data in Supabase dashboard
4. ✅ Display in your frontend
5. ✅ Set up scheduled ingestion (cron)
6. ✅ Add real odds from API-Football odds endpoints

---

**Your platform now has real, live sports data! 🚀**

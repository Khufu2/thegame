# 🚀 COMPLETE DATA INTEGRATION GUIDE

## ⚠️ Important: Apply Migrations First

Before we can seed and ingest data, your database needs the migrations applied. The error shows that the `matches` table doesn't have the expected columns yet.

## Step 1: Apply All Database Migrations

**Go to Supabase SQL Editor and apply each migration in order:**

https://app.supabase.com/ → Your Project → SQL Editor

### Execute these migrations in order:

```sql
-- 01_init.sql - Core schema
CREATE TABLE public.matches (
  id text PRIMARY KEY,
  home_team text,
  away_team text,
  kickoff_time timestamptz,
  status text DEFAULT 'scheduled',
  home_team_score integer,
  away_team_score integer,
  result text,
  league text,
  season integer,
  round text,
  venue text,
  odds_home numeric,
  odds_draw numeric,
  odds_away numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rest of 01_init.sql... (copy from migrations/01_init.sql)
```

**Apply these files in order:**
1. `migrations/01_init.sql`
2. `migrations/02_rls.sql`
3. `migrations/03_profiles.sql`
4. `migrations/04_profiles_rls.sql`
5. `migrations/05_place_bet_proc.sql`
6. `migrations/06_bets_selection_and_settle.sql`
7. `migrations/07_service_role_grants.sql`
8. `migrations/08_feeds_and_odds.sql`
9. `migrations/09_standings_table.sql` ⬅️ NEW

---

## Step 2: After Migrations Are Applied

Once all migrations are applied, run:

```bash
cd server
node seed-demo.js
```

This will populate your database with:
- ✅ 3 live matches
- ✅ 5 upcoming matches  
- ✅ League standings (10 teams)
- ✅ Top 10 scorers

---

## Step 3: Display Data in Your Frontend

Once seeded, you can fetch and display the data:

### Get Live Matches
```javascript
const liveMatches = await fetch('/api/matches?status=live').then(r => r.json())

// Display live matches
liveMatches.forEach(match => {
  console.log(`🔴 LIVE: ${match.home_team} ${match.home_team_score} - ${match.away_team_score} ${match.away_team}`)
})
```

### Get Upcoming Matches (for betting)
```javascript
const upcomingMatches = await fetch('/api/matches?status=scheduled&limit=10').then(r => r.json())

// Display upcoming matches with odds
upcomingMatches.forEach(match => {
  console.log(`📅 ${match.kickoff_time}`)
  console.log(`${match.home_team} vs ${match.away_team}`)
  console.log(`Odds: Home ${match.odds_home} | Draw ${match.odds_draw} | Away ${match.odds_away}`)
})
```

### Get League Standings
```javascript
// Query from feeds/standings table
const standings = await fetch('/api/standings').then(r => r.json())

standings.forEach(team => {
  console.log(`${team.rank}. ${team.team_name} - ${team.points} pts`)
})
```

### Get Top Scorers
```javascript
const feeds = await fetch('/api/feeds?source=API-Football&type=stats').then(r => r.json())
const topScorers = JSON.parse(feeds[0].content)

topScorers.forEach(player => {
  console.log(`${player.player_name}: ${player.goals} goals`)
})
```

---

## Step 4: Real API Integration (Later)

Once demo data is working, integrate with real API-Football:

```bash
# Fetch real data from API-Football
node ingest-data.js
```

This will replace demo data with live data from the API.

---

## 📚 File Reference

### Data Ingestion Files

| File | Purpose | Command |
|------|---------|---------|
| `seed-demo.js` | Populate with demo sports data | `npm run seed:demo` |
| `ingest-data.js` | Fetch from real API-Football | `node ingest-data.js` |
| `worker_ingest.js` | Background data ingestion | `npm run worker:ingest` |
| `apiFootballService.js` | API-Football service client | (imported by other files) |

### New Migration

| File | Purpose |
|------|---------|
| `migrations/09_standings_table.sql` | Stores league rankings |

### New Documentation

| File | Purpose |
|------|---------|
| `API_FOOTBALL_INTEGRATION.md` | Comprehensive integration guide |
| `DATA_FETCHING_GUIDE.md` | This file |

---

## 🎯 Quick Checklist

- [ ] Apply migration `01_init.sql`
- [ ] Apply migration `02_rls.sql`
- [ ] Apply migration `03_profiles.sql`
- [ ] Apply migration `04_profiles_rls.sql`
- [ ] Apply migration `05_place_bet_proc.sql`
- [ ] Apply migration `06_bets_selection_and_settle.sql`
- [ ] Apply migration `07_service_role_grants.sql`
- [ ] Apply migration `08_feeds_and_odds.sql`
- [ ] Apply migration `09_standings_table.sql` ⬅️ NEW
- [ ] Run: `cd server && node seed-demo.js`
- [ ] Verify data in Supabase dashboard
- [ ] Display data in frontend
- [ ] Set up scheduled real API ingestion

---

## 🔗 Database Schema

### matches table
```
id                text PRIMARY KEY
home_team         text
away_team         text
kickoff_time      timestamptz
status            text (scheduled, live, finished)
home_team_score   integer
away_team_score   integer
result            text (home_win, draw, away_win)
league            text
season            integer
round             text
venue             text
odds_home         numeric
odds_draw         numeric
odds_away         numeric
```

### standings table (NEW)
```
id                uuid PRIMARY KEY
league_id         integer
standings_data    jsonb (array of team standings)
created_at        timestamptz
```

### feeds table
```
id                uuid PRIMARY KEY
title             text
content           text/jsonb
source            text (API-Football, etc)
type              text (news, stats, alert)
created_at        timestamptz
```

---

## ✅ What's Ready

✅ Database schema defined (migrations)  
✅ Demo data seeding script ready  
✅ Real API integration script ready  
✅ Frontend endpoints to display data  
✅ Documentation for all steps  

## ⏭️ Next Steps

1. **Apply all 9 migrations** to Supabase
2. **Run seed demo**: `node seed-demo.js`
3. **Display on frontend** using the fetch examples above
4. **Set up real API** integration for live data

---

**Your platform is ready to display sports data! 🚀**

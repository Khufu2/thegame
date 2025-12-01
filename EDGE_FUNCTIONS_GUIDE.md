# 🚀 EDGE FUNCTIONS: Real-Time Sports Data

## Why Edge Functions? 

**Smart choice over backend polling:**
- ⚡ **Serverless** - No server costs, scales automatically
- 🔒 **Secure** - API keys never exposed to frontend
- ⏱️ **Scheduled** - Runs on cron schedule (every 30 min)
- 📊 **Real-time** - Fresh data without client requests
- 💰 **Cost-effective** - Free tier generous, pays only when used

## 📁 Edge Functions Structure

```
supabase/
  functions/
    fetch-matches/
      └─ index.ts           # Fetch live & upcoming matches
    fetch-standings/
      └─ index.ts           # Fetch league standings (5 leagues)
    fetch-scorers/
      └─ index.ts           # Fetch top 10 scorers per league
```

## 🔧 Setup Instructions

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Link Your Project

```bash
cd c:\Users\DELL\Documents\Projects\sheena-redone
supabase login
supabase link --project-ref <your-project-ref>
```

### Step 3: Set Environment Variables

Go to Supabase Dashboard → Project Settings → Edge Functions and add:

```
API_FOOTBALL_KEY=c6f6b236fe5f08fbd242cba4ba83533c
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
```

### Step 4: Deploy Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy fetch-matches
supabase functions deploy fetch-standings
supabase functions deploy fetch-scorers
```

### Step 5: Test Locally

```bash
supabase start
supabase functions serve
```

Then in another terminal:

```bash
curl http://localhost:54321/functions/v1/fetch-matches \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 📋 Function Details

### fetch-matches
- **Purpose**: Fetch live and upcoming matches (7 days)
- **Schedule**: Every 30 minutes
- **Output**: Saves to `matches` table with status (live/scheduled/finished)
- **Data**: Match ID, teams, score, kickoff time, odds

### fetch-standings
- **Purpose**: Fetch league standings for 5 major leagues
- **Leagues**: Premier League, La Liga, Bundesliga, Serie A, Ligue 1
- **Schedule**: Daily at 2 AM UTC
- **Output**: Saves to `standings` table with full league standings JSON

### fetch-scorers
- **Purpose**: Fetch top 10 scorers from each league
- **Schedule**: Every 12 hours
- **Output**: Saves to `feeds` table with type='stats'
- **Data**: Player name, goals, league

---

## ⏰ Setting Up Scheduled Runs

### Option 1: GitHub Actions (Recommended)

Create `.github/workflows/schedule-matches.yml` (repeat for odds/standings/scorers/weather as needed):

```yaml
name: Sync Sports Data

on:
  schedule:
    # Every 30 minutes
    - cron: '*/30 * * * *'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Fetch Matches
        run: |
          curl -X POST \
            https://<your-project>.supabase.co/functions/v1/fetch-matches \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -d '{}'

      - name: Fetch Standings (daily)
        if: github.event.schedule == '0 2 * * *'
        run: |
          curl -X POST \
            https://<your-project>.supabase.co/functions/v1/fetch-standings \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -d '{}'

      - name: Fetch Scorers (12h)
        if: github.event.schedule == '0 */12 * * *'
        run: |
          curl -X POST \
            https://<your-project>.supabase.co/functions/v1/fetch-scorers \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -d '{}'
```

### Option 2: Vercel Cron Jobs

In your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/sync/matches",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/sync/standings",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/sync/scorers",
      "schedule": "0 */12 * * *"
    }
  ]
}
```

---

## 🔌 Frontend Integration

### Call Edge Functions from React

```typescript
// hooks/useSportsData.ts
import { useEffect, useState } from 'react'

export const useFetchMatches = () => {
  const [matches, setMatches] = useState([])
  
  useEffect(() => {
    const fetchMatches = async () => {
      const response = await fetch(
        'https://<project>.supabase.co/functions/v1/fetch-matches',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      )
      
      if (response.ok) {
        // Edge function saves to DB, so query matches table
        const { data } = await supabase
          .from('matches')
          .select('*')
          .eq('status', 'live')
        
        setMatches(data)
      }
    }
    
    fetchMatches()
  }, [])
  
  return matches
}

// Usage in component
export const MatchesPage = () => {
  const liveMatches = useFetchMatches()
  
  return (
    <div>
      {liveMatches.map(match => (
        <div key={match.id}>
          <h3>{match.home_team} vs {match.away_team}</h3>
          <p>Score: {match.home_team_score} - {match.away_team_score}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## 📊 Database Schema

### matches (populated by fetch-matches)
```
id                text PRIMARY KEY
home_team         text
away_team         text
kickoff_time      timestamptz
status            text ('scheduled', 'live', 'finished')
home_team_score   integer
away_team_score   integer
result            text ('home_win', 'draw', 'away_win')
league            text
odds_home         numeric
odds_draw         numeric
odds_away         numeric
```

### standings (populated by fetch-standings)
```
id                uuid PRIMARY KEY
league_id         integer
standings_data    jsonb (array of team standings)
created_at        timestamptz
```

### feeds (populated by fetch-scorers)
```
id                uuid PRIMARY KEY
title             text
content           text (JSON array of scorers)
source            text ('API-Football')
type              text ('stats')
created_at        timestamptz
```

---

## 🚨 Error Handling

Each function includes:
- ✅ Rate limiting (max 10 calls/min)
- ✅ Try-catch blocks with logging
- ✅ Graceful fallbacks
- ✅ CORS headers for frontend calls
- ✅ Proper error responses

---

## 📈 Monitoring

Check function logs:

```bash
supabase functions logs fetch-matches
```

Monitor in Supabase Dashboard → Edge Functions → Logs

---

## 🎯 Deployment Checklist

- [ ] Install Supabase CLI
- [ ] Link project with `supabase link`
- [ ] Add environment variables (API_FOOTBALL_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Deploy functions with `supabase functions deploy`
- [ ] Test functions locally with `supabase functions serve`
- [ ] Set up scheduled runs (GitHub Actions or Vercel)
- [ ] Verify data appears in Supabase dashboard
- [ ] Connect frontend to edge functions
- [ ] Monitor logs for errors

---

## 🔗 Useful Links

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/usage)
- [API-Football Documentation](https://www.api-football.com/documentation-v3)
- [Deno Manual](https://deno.land/manual)

---

**Your platform is now real-time enabled! ⚡**

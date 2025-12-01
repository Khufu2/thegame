# ⚡ EDGE FUNCTIONS: Quick Start

## What You Got

3 serverless edge functions that automatically fetch live sports data:

| Function | Data | Schedule | Location |
|----------|------|----------|----------|
| `fetch-matches` | Live & upcoming matches (7 days) | Every 30 min | `supabase/functions/fetch-matches/` |
| `fetch-standings` | League standings (5 leagues) | Daily 2 AM UTC | `supabase/functions/fetch-standings/` |
| `fetch-scorers` | Top 10 scorers per league | Every 12 hours | `supabase/functions/fetch-scorers/` |

---

## 🚀 Deploy in 5 Steps

### 1️⃣ Install Supabase CLI
```bash
npm install -g supabase
```

### 2️⃣ Link Your Project
```bash
supabase login
supabase link --project-ref <your-project-ref>
```

**Get your project ref from:** Supabase Dashboard → Settings → General → Reference ID

### 3️⃣ Add Secrets
Go to **Supabase Dashboard → Edge Functions → Manage Secrets** and add:

```
API_FOOTBALL_KEY = c6f6b236fe5f08fbd242cba4ba83533c
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY = <paste-from-settings-api-keys>
```

### 4️⃣ Deploy Functions
```bash
supabase functions deploy
```

### 5️⃣ Set Up Automation (GitHub)
Push to GitHub and add these secrets:
- `SUPABASE_PROJECT_ID` - Your project ID
- `SUPABASE_ANON_KEY` - Your anon key

The `.github/workflows/schedule-*.yml` set will run automatically! 🎉

---

## 📊 Data Flow

```
┌─────────────────────┐
│   API-Football      │
│   (RapidAPI)        │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────────────────┐
│  Edge Functions (Deno)          │
│  ├─ fetch-matches              │
│  ├─ fetch-standings            │
│  └─ fetch-scorers              │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│   Supabase PostgreSQL           │
│   ├─ matches table              │
│   ├─ standings table            │
│   └─ feeds table                │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│   React Frontend                │
│   ├─ Live Matches              │
│   ├─ Leaderboard               │
│   └─ Top Scorers               │
└─────────────────────────────────┘
```

---

## 🔍 Test Locally

```bash
# Start Supabase locally
supabase start

# In another terminal, serve edge functions
supabase functions serve

# In third terminal, test a function
curl -X POST http://localhost:54321/functions/v1/fetch-matches \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 📈 Monitor in Production

### View Logs
```bash
supabase functions logs fetch-matches
supabase functions logs fetch-standings
supabase functions logs fetch-scorers
```

### Monitor Dashboard
1. Supabase Dashboard → Edge Functions
2. Select each function to see invocations and logs
3. Watch real-time execution status

---

## 🎯 Frontend Usage

### Query Live Data
```typescript
// Get live matches
const { data: liveMatches } = await supabase
  .from('matches')
  .select('*')
  .eq('status', 'live')

// Display
<div>
  {liveMatches?.map(match => (
    <Card key={match.id}>
      <h3>{match.home_team} vs {match.away_team}</h3>
      <p>{match.home_team_score} - {match.away_team_score}</p>
    </Card>
  ))}
</div>
```

### Get Top Scorers
```typescript
const { data: feeds } = await supabase
  .from('feeds')
  .select('content')
  .eq('type', 'stats')
  .eq('source', 'API-Football')
  .order('created_at', { ascending: false })
  .limit(1)

const topScorers = JSON.parse(feeds[0].content)
```

### Display Standings
```typescript
const { data: standings } = await supabase
  .from('standings')
  .select('standings_data')
  .eq('league_id', 39) // Premier League
  .order('created_at', { ascending: false })
  .limit(1)

const standings_data = standings[0].standings_data
// standings_data is array of teams with rank, points, etc
```

---

## 🛠️ Troubleshooting

### Functions not deploying?
```bash
# Check CLI is authenticated
supabase projects list

# Verify secrets are set
supabase secrets list
```

### Functions timing out?
- Edge functions have 15-second timeout
- API-Football might be rate limited
- Check logs: `supabase functions logs <name>`

### Data not appearing in database?
- Verify migrations were applied (8 migrations)
- Check service role key is correct
- Look at function logs for errors

### Getting 429 Too Many Requests?
- API-Football is rate limiting
- We have rate limiting built-in (10 calls/min)
- Try again in 60 seconds

---

## 📚 Full Documentation

See these files for more details:

| File | Purpose |
|------|---------|
| `EDGE_FUNCTIONS_GUIDE.md` | Comprehensive guide (setup, monitoring, architecture) |
| `API_FOOTBALL_INTEGRATION.md` | API-Football integration details |
| `supabase.json` | Edge functions configuration |
| `.github/workflows/schedule-*.yml` | Automated scheduling |

---

## ✅ Checklist

- [ ] Run `supabase link`
- [ ] Add 3 secrets (API key, URL, service key)
- [ ] Deploy with `supabase functions deploy`
- [ ] Test one function locally
- [ ] Push to GitHub (workflows auto-trigger)
- [ ] Check Supabase dashboard for data appearing
- [ ] Display data in React frontend
- [ ] Monitor logs in production

---

## 🚀 You're Live!

Your platform now has:
- ✅ **Real-time matches** - Updated every 30 minutes
- ✅ **Live standings** - Updated daily
- ✅ **Top scorers** - Updated every 12 hours
- ✅ **Automatic scheduling** - GitHub Actions handles it
- ✅ **Zero backend load** - All serverless
- ✅ **Free tier eligible** - Supabase generous limits

**Start displaying this data in your frontend and watch your betting platform come alive!** 🎉

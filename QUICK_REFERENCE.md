# 📋 EDGE FUNCTIONS: QUICK REFERENCE CARD

## 🚀 One-Minute Deployment

```bash
# 1. Install CLI
npm install -g supabase

# 2. Login & Link
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>

# 3. Add Secrets (via Supabase Dashboard)
# Dashboard → Edge Functions → Manage Secrets:
# - API_FOOTBALL_KEY=c6f6b236fe5f08fbd242cba4ba83533c
# - SUPABASE_URL=https://your-project.supabase.co
# - SUPABASE_SERVICE_ROLE_KEY=<paste-from-settings>

# 4. Deploy
supabase functions deploy

# 5. Done! ✅
```

---

## 📊 What Gets Created

| Item | Schedule | Data | Location |
|------|----------|------|----------|
| 🔴 Live Matches | Every 30 min | Current scores | `matches` table |
| 📅 Upcoming Matches | Every 30 min | Next 7 days | `matches` table |
| 🏆 Standings | Daily 2 AM | 5 leagues | `standings` table |
| ⚽ Top Scorers | Every 12 hours | 10 players/league | `feeds` table |

---

## 🎯 Frontend Usage

```typescript
// Import hooks
import {
  useLiveMatches,
  useUpcomingMatches,
  useLeagueStandings,
  useTopScorers
} from '@/context/useSportsData'

// Use in components
export const MyPage = () => {
  const { matches } = useLiveMatches()
  const { matches: upcoming } = useUpcomingMatches()
  const { standings } = useLeagueStandings(39) // Premier League
  const { scorers } = useTopScorers()

  return (
    <div>
      {matches.map(m => <MatchCard match={m} />)}
      {upcoming.map(m => <BetCard match={m} />)}
      {standings?.standings_data[0]?.map(t => <TeamRow team={t} />)}
      {scorers.map(s => <ScorerRow scorer={s} />)}
    </div>
  )
}
```

---

## 📁 Files Created

```
supabase/functions/
├─ fetch-matches/index.ts           (165 lines)
├─ fetch-standings/index.ts          (120 lines)
└─ fetch-scorers/index.ts            (130 lines)

supabase/tsconfig.json

.github/workflows/
└─ schedule-*.yml                    (automatic scheduling)

context/
└─ useSportsData.ts                  (React hooks)

Documentation:
├─ EDGE_FUNCTIONS_QUICKSTART.md      (quick start)
├─ EDGE_FUNCTIONS_GUIDE.md           (comprehensive)
├─ EDGE_FUNCTIONS_DEPLOYMENT.md      (setup guide)
├─ EDGE_FUNCTIONS_SUMMARY.md         (overview)
└─ ARCHITECTURE.md                   (diagrams)
```

---

## 🔗 API-Football Data Fetched

```
Leagues:
├─ 39 - Premier League (England)
├─ 140 - La Liga (Spain)
├─ 78 - Bundesliga (Germany)
├─ 135 - Serie A (Italy)
└─ 61 - Ligue 1 (France)

Per Match:
├─ ID, teams, scores
├─ Kickoff time, status
├─ Odds (home/draw/away)
├─ League, season, round
└─ Venue

Per League Standing:
├─ Team rank & points
├─ Wins, draws, losses
├─ Goal diff, form
└─ Head-to-head records

Per Player:
├─ Name & team
├─ Goals scored
├─ Assists
└─ Matches played
```

---

## ✅ Health Checks

```bash
# Check Supabase connection
supabase projects list

# Verify secrets
supabase secrets list

# Test function locally
supabase start
supabase functions serve
curl -X POST http://localhost:54321/functions/v1/fetch-matches \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# View logs in production
supabase functions logs fetch-matches
supabase functions logs fetch-standings
supabase functions logs fetch-scorers

# Check GitHub Actions
# GitHub → Actions → Sync Sports Data

# Monitor Supabase dashboard
# Dashboard → Edge Functions → Select function
```

---

## 🔧 Environment Variables

```env
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Supabase Secrets (Edge Functions)
API_FOOTBALL_KEY=c6f6b236fe5f08fbd242cba4ba83533c
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here

# GitHub Secrets
SUPABASE_PROJECT_ID=your_project_id
SUPABASE_ANON_KEY=your_anon_key
```

---

## 📈 Monitoring

```
Supabase Dashboard:
├─ Edge Functions → Logs (real-time)
├─ Edge Functions → Invocations (chart)
├─ Database → Query statistics
└─ Authentication → User activity

GitHub Actions:
├─ Actions tab → Sync Sports Data
├─ Check run history & timing
└─ View logs if failed

Frontend:
├─ React DevTools (check hook state)
├─ Network tab (API calls)
└─ Browser console (errors)
```

---

## 🐛 Quick Troubleshooting

| Error | Solution |
|-------|----------|
| 403/429 from API | API-Football rate limited, wait 60s |
| No data in DB | Check migrations applied + function logs |
| Workflow not running | Verify secrets in GitHub + .yml file in `.github/workflows/` |
| Import errors | Normal for Deno edge functions, ignore lint errors |
| "command not found" | `npm install -g supabase` |

---

## 📞 Support

| Resource | Purpose |
|----------|---------|
| `EDGE_FUNCTIONS_QUICKSTART.md` | Start here |
| `EDGE_FUNCTIONS_GUIDE.md` | Detailed reference |
| `ARCHITECTURE.md` | System design |
| `context/useSportsData.ts` | Code examples |

---

## 🎯 Next Steps

- [ ] Deploy edge functions (`supabase functions deploy`)
- [ ] Verify data in Supabase dashboard
- [ ] Connect React frontend with hooks
- [ ] Display matches/standings/scorers
- [ ] Monitor GitHub Actions workflows
- [ ] Check edge function logs
- [ ] Enable real-time subscriptions
- [ ] Deploy to Vercel

---

**You're ready to launch! 🚀**

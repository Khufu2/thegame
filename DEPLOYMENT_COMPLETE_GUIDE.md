# 🚀 Complete Backend Deployment Guide

This guide covers deploying the complete Sheena Sports backend to production.

---

## 📋 Prerequisites

### Required Accounts & Services:
1. ✅ **Supabase** - Database & Auth
2. ✅ **Vercel** - Serverless hosting
3. ⚠️ **API-Football (RapidAPI)** - Enable fixtures + odds modules
4. ⚠️ **Tavily API** - Get API key from https://tavily.com
5. ⚠️ **Google Gemini API** - Get API key from https://makersuite.google.com/app/apikey
6. ⚠️ **Stripe** - Get API keys from https://dashboard.stripe.com
7. ⚠️ **Telegram Bot** - Create bot via @BotFather
8. ⚠️ **WhatsApp Business Cloud API** - Meta developer access token + phone number ID
9. ⚠️ **OpenWeather / Tomorrow.io** - Weather overlays for match cards

---

## 🔧 Step 1: Apply Database Migrations

**CRITICAL:** All migrations must be applied before deployment.

1. Go to https://app.supabase.com → Your Project → SQL Editor
2. Apply migrations in order:
   - `migrations/01_init.sql`
   - `migrations/02_rls.sql`
   - `migrations/03_profiles.sql`
   - `migrations/04_profiles_rls.sql`
   - `migrations/05_place_bet_proc.sql`
   - `migrations/06_bets_selection_and_settle.sql`
   - `migrations/07_service_role_grants.sql`
   - `migrations/08_feeds_and_odds.sql`
   - `migrations/09_standings_table.sql` (if exists)
   - `migrations/10_transactions_and_chat.sql` ⭐ NEW
   - `migrations/11_add_balance_function.sql` ⭐ NEW
   - `migrations/12_match_metadata.sql` ⭐ NEW

3. Verify all tables exist:
   ```bash
   cd server
   node verify_db.js
   ```

---

## 🔑 Step 2: Set Up Environment Variables

### Supabase Edge Functions Secrets

Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets

Add these secrets:
```
API_FOOTBALL_KEY=your_rapidapi_key
TAVILY_API_KEY=your_tavily_key
GEMINI_API_KEY=your_gemini_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
WHATSAPP_DEFAULT_TO=15551234567
OPENWEATHER_API_KEY=your_weather_key
TRON_WALLET_ADDRESS=your_tron_wallet_address
```

### Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these for Production:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://your-frontend.vercel.app
ENABLE_SOCKET_IO=true
NODE_ENV=production
```

---

## 📦 Step 3: Deploy Supabase Edge Functions

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy fetch-matches
supabase functions deploy fetch-standings
supabase functions deploy fetch-scorers
supabase functions deploy fetch-odds
supabase functions deploy fetch-weather
supabase functions deploy search-news
supabase functions deploy generate-news
supabase functions deploy verify-tron-payment
supabase functions deploy telegram-broadcast
supabase functions deploy whatsapp-broadcast
```

### Option B: Manual Deployment via Dashboard

1. Go to Supabase Dashboard → Edge Functions
2. For each function in `supabase/functions/`:
   - Click "Create Function"
   - Copy-paste the code from `index.ts`
   - Set environment variables
   - Deploy

---

## 🚀 Step 4: Deploy Express Server to Vercel

### Option A: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
cd server
vercel link

# Deploy
vercel deploy --prod
```

### Option B: GitHub Integration

1. Push code to GitHub
2. Go to Vercel Dashboard → Add New Project
3. Import your GitHub repository
4. Set root directory to `server/`
5. Configure build settings:
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Install Command: `npm install`
6. Add environment variables
7. Deploy

### Option C: Serverless Function Setup

Create `api/index.js` in root:

```javascript
import app from '../server/index.js'

export default app
```

Then configure `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.js"
    }
  ]
}
```

---

## ⚙️ Step 5: Set Up Scheduled Jobs

### Option A: GitHub Actions (Recommended)

1. Go to GitHub → Your Repo → Settings → Secrets
2. Add secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Workflows `.github/workflows/schedule-*.yml` will run automatically on their cron schedules

### Option B: Vercel Cron Jobs

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/ingest/matches",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

---

## 🧪 Step 6: Test Everything

### 1. Test API Endpoints

```bash
# Health check
curl https://your-api.vercel.app/health

# Test odds
curl https://your-api.vercel.app/api/odds/comparison?refresh=true

# Test news generation
curl -X POST https://your-api.vercel.app/api/ai/generate-news \
  -H "Content-Type: application/json" \
  -d '{"topic": "Premier League", "persona": "SHEENA"}'
```

### 2. Test Edge Functions

```bash
# Test fetch-matches
curl -X POST https://your-project.supabase.co/functions/v1/fetch-matches \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Test generate-news
curl -X POST https://your-project.supabase.co/functions/v1/generate-news \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"topic": "Football news"}'
```

### 3. Test Payments

- **Stripe:** Use test mode first
- **Crypto:** Test with small amounts
- **Webhooks:** Use Stripe CLI for local testing

---

## 📊 Step 7: Monitor & Verify

### Check Logs

**Vercel:**
```bash
vercel logs https://your-api.vercel.app
```

**Supabase:**
- Dashboard → Edge Functions → View Logs

### Verify Database

```bash
cd server
node verify_db.js
```

### Check Scheduled Jobs

- GitHub Actions: Check workflow runs
- Vercel Cron: Check function invocations

---

## 🔐 Step 8: Security Checklist

- [ ] All API keys in environment variables (never in code)
- [ ] Service role key never exposed to frontend
- [ ] RLS policies enabled on all tables
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Webhook secrets set
- [ ] HTTPS enabled (automatic on Vercel)

---

## 🐛 Troubleshooting

### "Edge function not found"
- Verify function is deployed
- Check function name matches exactly
- Verify environment variables are set

### "Permission denied"
- Check RLS policies
- Verify service role key is correct
- Check migration `07_service_role_grants.sql` is applied

### "API key not found"
- Check Supabase secrets are set
- Verify Vercel environment variables
- Check variable names match exactly

### "Socket.io not working"
- Set `ENABLE_SOCKET_IO=true` in Vercel
- Install `socket.io` dependency
- Check CORS settings

---

## 📚 Next Steps

1. ✅ Set up monitoring (Sentry, LogRocket, etc.)
2. ✅ Configure error alerts
3. ✅ Set up database backups
4. ✅ Test all payment flows
5. ✅ Load test API endpoints
6. ✅ Set up CI/CD pipeline

---

## 🎉 You're Live!

Your backend is now production-ready with:
- ✅ API integrations (API-Football data + odds, Tavily, Gemini)
- ✅ Payment processing (Stripe + Crypto)
- ✅ Real-time features (Socket.io)
- ✅ Bot broadcasting (Telegram + WhatsApp)
- ✅ Scheduled data sync
- ✅ Complete database schema

**Happy launching! 🚀**



# ⚡ Quick Start - Production Deployment

**Get your backend live in 30 minutes!**

---

## 🎯 Prerequisites Checklist

Before starting, ensure you have:
- [ ] Supabase project created
- [ ] Vercel account
- [ ] GitHub repository
- [ ] API keys ready (see below)

---

## 📝 Step 1: Get API Keys (10 minutes)

### Critical (Required):
1. **API-Football (RapidAPI)** - Enable fixtures + odds modules
2. **Tavily API** - Sign up at https://tavily.com → Get API key
3. **Gemini API** - Go to https://makersuite.google.com/app/apikey → Create key
4. **Stripe** - Sign up at https://dashboard.stripe.com → Get test keys
5. **WhatsApp Business Cloud API** - Meta developer access token & phone number ID
6. **OpenWeather / Tomorrow.io** - Weather overlays

### Optional:
7. **Telegram Bot** - Message @BotFather on Telegram → Create bot → Get token

---

## 🗄️ Step 2: Apply Database Migrations (5 minutes)

1. Go to https://app.supabase.com → Your Project → SQL Editor
2. Copy-paste and run each migration in order:
   - `migrations/10_transactions_and_chat.sql`
   - `migrations/11_add_balance_function.sql`
   - `migrations/12_match_metadata.sql`
3. Verify: Run `cd server && node verify_db.js`

---

## 🔑 Step 3: Set Supabase Secrets (5 minutes)

Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets

Add:
```
API_FOOTBALL_KEY=your_key
THE_ODDS_API_KEY=your_key
TAVILY_API_KEY=your_key
GEMINI_API_KEY=your_key
TELEGRAM_BOT_TOKEN=your_token (optional)
TELEGRAM_CHAT_ID=your_chat_id (optional)
TWILIO_ACCOUNT_SID=your_sid (optional)
TWILIO_AUTH_TOKEN=your_token (optional)
TRON_WALLET_ADDRESS=your_address (optional)
```

---

## 🚀 Step 4: Deploy Edge Functions (5 minutes)

### Option A: Supabase CLI
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy fetch-odds
supabase functions deploy search-news
supabase functions deploy generate-news
supabase functions deploy verify-tron-payment
supabase functions deploy telegram-broadcast
supabase functions deploy whatsapp-broadcast
```

### Option B: Manual (via Dashboard)
1. Go to Edge Functions → Create Function
2. For each function in `supabase/functions/`:
   - Copy code from `index.ts`
   - Paste into function editor
   - Set secrets
   - Deploy

---

## 🌐 Step 5: Deploy to Vercel (5 minutes)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd server
vercel deploy --prod
```

**Or via GitHub:**
1. Push code to GitHub
2. Go to Vercel → New Project
3. Import repository
4. Set root to `server/`
5. Add environment variables (see below)
6. Deploy

---

## ⚙️ Step 6: Set Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key
SUPABASE_ANON_KEY=your_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://your-frontend.vercel.app
ENABLE_SOCKET_IO=true
```

---

## ✅ Step 7: Test (5 minutes)

```bash
# Health check
curl https://your-api.vercel.app/health

# Test odds
curl "https://your-api.vercel.app/api/odds/comparison?refresh=true"

# Test news
curl -X POST https://your-api.vercel.app/api/ai/generate-news \
  -H "Content-Type: application/json" \
  -d '{"topic": "Premier League"}'
```

---

## 🎉 Done!

Your backend is live! 

**Next:** Update your frontend to use the new API endpoints.

---

## 🆘 Troubleshooting

**"Function not found"**
- Check function name matches exactly
- Verify deployment succeeded

**"API key not found"**
- Check Supabase secrets are set
- Verify variable names match

**"Permission denied"**
- Check migrations are applied
- Verify service role key is correct

---

## 📚 Full Documentation

- `DEPLOYMENT_COMPLETE_GUIDE.md` - Detailed deployment guide
- `IMPLEMENTATION_SUMMARY.md` - What was implemented
- `COMPLETE_BACKEND_IMPLEMENTATION_PLAN.md` - Full plan

---

**Need help?** Check the troubleshooting section in `DEPLOYMENT_COMPLETE_GUIDE.md`


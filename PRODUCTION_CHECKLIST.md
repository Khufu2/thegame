# Production Readiness Checklist

Use this checklist to verify the backend is ready for production deployment on Vercel.

## ✅ Infrastructure

- [ ] **Express Server**
  - [ ] Server starts without errors on port 4000
  - [ ] Health check endpoint responds (GET /health)
  - [ ] CORS and body-parser middleware configured
  - [ ] Error handling in place for all endpoints

- [ ] **Environment Variables**
  - [ ] `.env` created with all required variables
  - [ ] `.env.example` has all variable names (no secrets)
  - [ ] `.env` added to `.gitignore`
  - [ ] Vercel environment variables set in dashboard
  - [ ] Service role key is never committed to git

- [ ] **Dependencies**
  - [ ] All required packages installed (`npm install`)
  - [ ] No security vulnerabilities (`npm audit`)
  - [ ] Package-lock.json committed to git

## ✅ Database

- [ ] **Migrations Applied**
  - [ ] `01_init.sql` - Core tables created ✓
  - [ ] `02_rls.sql` - RLS policies enabled ✓
  - [ ] `03_profiles.sql` - Profiles table + triggers ✓
  - [ ] `04_profiles_rls.sql` - Profile policies ✓
  - [ ] `05_place_bet_proc.sql` - Bet placement procedure ✓
  - [ ] `06_bets_selection_and_settle.sql` - Selection + settlement ✓
  - [ ] `07_service_role_grants.sql` - Service role permissions ✓
  - [ ] `08_feeds_and_odds.sql` - News feeds + odds tables ✓

- [ ] **Database Schema**
  - [ ] All tables verified to exist
  - [ ] Indexes created for performance
  - [ ] Foreign key relationships working
  - [ ] RLS policies allowing service_role to bypass

- [ ] **Test Data**
  - [ ] Sample user profile created
  - [ ] Sample matches created
  - [ ] Seed script working (`npm run seed`)

## ✅ API Endpoints

### Authentication
- [ ] **POST /api/auth/signup**
  - [ ] Creates user via Supabase Auth
  - [ ] Auto-creates profile via trigger
  - [ ] Returns user ID and email
  - [ ] Validates input (email, password)

- [ ] **POST /api/auth/signin**
  - [ ] Authenticates existing user
  - [ ] Returns session token
  - [ ] Handles invalid credentials

- [ ] **GET /api/users/profile/:userId**
  - [ ] Returns profile info
  - [ ] Only shows public fields to anonymous users
  - [ ] Shows all fields to authenticated owner

- [ ] **PUT /api/users/profile/:userId**
  - [ ] Updates profile fields
  - [ ] Returns updated profile
  - [ ] Validates input

### Matches
- [ ] **GET /api/matches**
  - [ ] Lists all matches
  - [ ] Filtering by status/sport works
  - [ ] Pagination works (limit/offset)

- [ ] **GET /api/matches/:matchId**
  - [ ] Returns match details
  - [ ] Includes odds data
  - [ ] Returns 404 if not found

- [ ] **POST /api/matches**
  - [ ] Creates new match
  - [ ] Returns created match with ID
  - [ ] Validates required fields

### Bets
- [ ] **POST /api/bets/place**
  - [ ] Places bet atomically (via stored procedure)
  - [ ] Deducts stake from user balance
  - [ ] Returns 201 with bet data
  - [ ] Returns 400 if insufficient balance
  - [ ] Returns 404 if user/match not found
  - [ ] Handles concurrent requests safely

### Odds
- [ ] **GET /api/odds/comparison**
  - [ ] Returns odds from multiple bookmakers
  - [ ] Can filter by match_id
  - [ ] Includes timestamp (fetched_at)

### News/AI
- [ ] **GET /api/ai/generate-news**
  - [ ] Generates news articles
  - [ ] Saves to feeds table
  - [ ] Returns articles with sentiment

### Health
- [ ] **GET /health**
  - [ ] Returns status: ok
  - [ ] Returns current timestamp

## ✅ Testing

- [ ] **Integration Tests**
  - [ ] Run: `TEST_USER_ID=<uuid> npm run test:integration`
  - [ ] Tests /api/bets/place endpoint
  - [ ] Returns 201 on success
  - [ ] Verifies bet is created in database

- [ ] **Concurrency Tests**
  - [ ] Run: `npm run test:concurrency`
  - [ ] Tests race conditions in bet placement
  - [ ] Verifies no double-spending
  - [ ] Confirms atomic transactions

- [ ] **E2E Tests**
  - [ ] Run: `npm run test:e2e`
  - [ ] Tests full flow: signup → signin → profile → match → bet
  - [ ] Tests error handling
  - [ ] Verifies all critical paths
  - [ ] All tests pass ✓

## ✅ Security

- [ ] **Secrets Management**
  - [ ] No secrets in `.env.example`
  - [ ] No secrets in git history (`git log --all -S "SECRET"`)
  - [ ] Service role key never exposed to frontend
  - [ ] Only anon key available to frontend
  - [ ] All `.env` entries use Vercel secrets

- [ ] **Row Level Security (RLS)**
  - [ ] RLS enabled on all tables
  - [ ] Policies block unauthorized access
  - [ ] Service role bypasses RLS correctly
  - [ ] Public views for data sharing

- [ ] **Input Validation**
  - [ ] All endpoints validate input
  - [ ] Stake amount > 0
  - [ ] Odds are reasonable
  - [ ] Email format validated
  - [ ] Passwords meet requirements

- [ ] **Error Handling**
  - [ ] No sensitive data in error messages
  - [ ] 500 errors logged but not exposed
  - [ ] Proper HTTP status codes used

## ✅ Performance

- [ ] **Response Times**
  - [ ] Bet placement < 1s
  - [ ] Match queries < 500ms
  - [ ] No N+1 query problems

- [ ] **Database**
  - [ ] Indexes on frequently queried fields
  - [ ] Pagination implemented for large datasets
  - [ ] Connection pooling configured

- [ ] **Cold Start**
  - [ ] Vercel deployment cold start < 5s (target)
  - [ ] Bundle size reasonable

## ✅ Deployment

- [ ] **Vercel Setup**
  - [ ] Vercel project created
  - [ ] GitHub repo connected
  - [ ] Environment variables set
  - [ ] Custom domain configured
  - [ ] HTTPS enabled (automatic)

- [ ] **Build & Deploy**
  - [ ] `vercel deploy --prod` succeeds
  - [ ] No build errors
  - [ ] Production URL accessible
  - [ ] Health check passes on production

- [ ] **Monitoring**
  - [ ] Vercel analytics enabled
  - [ ] Error tracking configured (Sentry recommended)
  - [ ] Logs accessible
  - [ ] Alerts set up for errors

## ✅ Documentation

- [ ] **README**
  - [ ] Backend setup instructions
  - [ ] Database schema overview
  - [ ] API endpoint list
  - [ ] Local dev quickstart
  - [ ] Deployment instructions

- [ ] **API Documentation**
  - [ ] All endpoints documented
  - [ ] Request/response examples
  - [ ] Error codes explained
  - [ ] Available at `API_DOCUMENTATION.md` ✓

- [ ] **Backend Setup Guide**
  - [ ] Migration instructions clear
  - [ ] Troubleshooting guide included
  - [ ] Available at `BACKEND_SETUP.md` ✓

## ✅ Vercel Deployment

- [ ] **Environment Variables in Vercel Dashboard**
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] SUPABASE_ANON_KEY
  - [ ] NODE_ENV=production

- [ ] **Serverless Functions** (if using)
  - [ ] Express app wrapped in handler
  - [ ] Execution time < 60s
  - [ ] Memory allocation sufficient

## ✅ Scaling & Maintenance

- [ ] **Database Backups**
  - [ ] Automatic backups enabled in Supabase
  - [ ] Manual backup procedure documented
  - [ ] Restore procedure tested

- [ ] **Monitoring & Alerts**
  - [ ] Error rate monitored
  - [ ] Response time monitored
  - [ ] Alerts for >5% error rate
  - [ ] Alerts for response time > 5s

- [ ] **Maintenance Windows**
  - [ ] Scheduled maintenance planned
  - [ ] Procedure for database migrations
  - [ ] Rollback procedure documented

## ✅ Final Pre-Launch Checks

- [ ] Run `npm run test:all` - All tests pass ✓
- [ ] Verify `/health` endpoint ✓
- [ ] Test all API endpoints manually
- [ ] Check database backups are working
- [ ] Verify monitoring & alerts are active
- [ ] Team reviewed security checklist
- [ ] Performance targets met
- [ ] Budget for API calls reviewed

## 🚀 Launch!

Once all checks are complete:

```bash
# Verify production deployment
curl https://api.sheena.app/health

# Monitor for errors
vercel logs https://api.sheena.app

# You're ready!
echo "🎉 Backend is live!"
```

## 📞 Post-Launch

- [ ] Monitor error rate for first 24 hours
- [ ] Check response times and performance
- [ ] Verify data is being saved correctly
- [ ] Set up regular backup verification
- [ ] Plan for scaling if needed
- [ ] Schedule security audit

---

**Note:** Update this checklist as you discover new requirements or issues during development.

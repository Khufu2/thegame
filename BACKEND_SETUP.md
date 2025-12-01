# Backend Setup & Testing Guide

## Current Status
✅ Server is running on `http://localhost:4000`
✅ Express API is configured and listening
⏳ Database migrations need to be applied
⏳ Test data needs to be seeded

## Step 1: Apply Database Migrations

The database migrations are located in `/migrations/`. You need to apply them manually in Supabase:

1. **Go to Supabase Dashboard:**
   - Visit https://app.supabase.com
   - Select your project: `rodbspuilueblujgdtol`
   - Click **"SQL Editor"** in the left sidebar

2. **Apply each migration in order:**
   - Create a new query for each file
   - Copy the entire contents of each `.sql` file
   - Run the query
   - Verify it completes without errors

3. **Apply these migrations in this exact order:**
   ```
   01_init.sql                        - Creates core tables (bets, matches, odds, etc.)
   02_rls.sql                         - Sets up Row Level Security policies
   03_profiles.sql                    - Creates profiles table + auth triggers
   04_profiles_rls.sql                - RLS policies for profiles
   05_place_bet_proc.sql              - Creates place_bet() stored procedure
   06_bets_selection_and_settle.sql   - Adds selection column and settle_bets() procedure
   07_service_role_grants.sql         - Grants permissions for service role
   ```

## Step 2: Seed Test Data

Once migrations are applied, run the seed script:

```bash
cd server
node quick-seed.js
```

This will:
- Create a test user profile (UUID: `11111111-1111-1111-1111-111111111111`)
- Create sample matches for testing
- Display the TEST_USER_ID to use for integration tests

## Step 3: Run Integration Tests

```bash
cd server
TEST_USER_ID=11111111-1111-1111-1111-111111111111 npm run test:integration
```

Expected output:
```
Posting to http://localhost:4000/api/bets/place payload { ... }
Status: 201
Response: { bet: { id, user_id, match_id, stake, odds, ... } }
```

## Step 4: Verify Settlement Worker

```bash
cd server
npm run worker:settle
```

This should:
- Find unsettled bets
- Mark them as WON/LOST based on match outcomes
- Update user balances accordingly

## Troubleshooting

### "permission denied for table profiles"
**Solution:** Make sure you applied migration `07_service_role_grants.sql`

### "RPC place_bet not found"
**Solution:** Make sure you applied migration `05_place_bet_proc.sql`

### Server won't start
**Solution:** 
- Check `.env` file contains `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check that you're in the `server/` directory
- Run: `npm install` to ensure dependencies are installed

### Integration test fails with ECONNREFUSED
**Solution:**
- Make sure server is running: `npm start`
- Try in a separate terminal window
- Check if port 4000 is available: `netstat -ano | findstr :4000`

## Database Schema Overview

### tables
- `profiles` - User profiles linked to auth.users
- `bets` - Placed bets with odds, stake, status
- `matches` - Sports matches with teams, odds, results
- `odds_history` - Historical odds for comparison
- `feeds` - News articles and feed content
- `messages` - Chat messages (for later)
- `leagues` - Sports leagues

### stored procedures
- `place_bet(p_user_id, p_match_id, p_stake, p_odds, p_selection)` - Atomic bet placement
- `settle_bets(p_match_id, p_result)` - Settle bets for a match

## Next Steps After Testing

1. **Implement additional endpoints:**
   - `/api/matches` - List/create matches
   - `/api/auth/signup` - User registration
   - `/api/auth/signin` - User login
   - `/api/ai/generate-news` - AI news generation

2. **Add more integrations:**
   - API-Football for live match data
   - API-Football odds endpoint for betting odds
   - Tavily + Gemini for AI news

3. **Prepare for Vercel deployment:**
   - Set environment variables in Vercel dashboard
   - Create serverless function wrappers
   - Test cold start performance

## Commands Reference

```bash
# Development
npm start                     # Start server
npm run test:integration      # Run integration tests
npm run test:concurrency      # Run concurrency tests
npm run worker:settle         # Run settlement worker

# Utilities
node verify_db.js             # Check database schema
node get_test_user.js         # Get existing test user
node quick-seed.js            # Seed test data
```


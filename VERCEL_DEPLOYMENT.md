# Vercel Deployment Guide

This guide covers deploying the Sheena backend to Vercel using serverless functions.

## Prerequisites

- Vercel CLI installed: `npm install -g vercel`
- GitHub account (for repo integration)
- Supabase project set up
- Environment variables ready

## Step 1: Prepare Environment Variables

In Vercel dashboard, set these environment variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_ANON_KEY=<your-anon-key>
NODE_ENV=production
```

**NEVER commit `.env` to GitHub**

## Step 2: Create Vercel Configuration

Create `vercel.json` in the root directory:

```json
{
  "buildCommand": "cd server && npm install",
  "outputDirectory": "server",
  "env": {
    "SUPABASE_URL": "@supabase_url",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key"
  },
  "functions": {
    "server/**/*.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

## Step 3: Create Serverless Function Wrapper

Create `server/api/index.js`:

```javascript
import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'

// Import all route handlers
import { setupAuthRoutes } from '../routes/auth.js'
import { setupMatchRoutes } from '../routes/matches.js'
import { setupBetRoutes } from '../routes/bets.js'
import { setupOddsRoutes } from '../routes/odds.js'

const app = express()

// Middleware
app.use(cors())
app.use(bodyParser.json())

// Initialize Supabase
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Make supabase available to routes
app.use((req, res, next) => {
  req.supabase = supabase
  next()
})

// Routes
setupAuthRoutes(app)
setupMatchRoutes(app)
setupBetRoutes(app)
setupOddsRoutes(app)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: 'production', timestamp: new Date().toISOString() })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Internal Server Error' })
})

export default app
```

## Step 4: Refactor Routes into Modules

For better organization, split routes into separate files:

### `server/routes/auth.js`
```javascript
export function setupAuthRoutes(app) {
  app.post('/api/auth/signup', async (req, res) => {
    // ... signup logic
  })

  app.post('/api/auth/signin', async (req, res) => {
    // ... signin logic
  })
}
```

### `server/routes/matches.js`
```javascript
export function setupMatchRoutes(app) {
  app.get('/api/matches', async (req, res) => {
    // ... matches logic
  })
}
```

(Similar for `bets.js` and `odds.js`)

## Step 5: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel deploy --prod
```

## Step 6: Configure Custom Domain

In Vercel dashboard:
1. Go to your project settings
2. Add custom domain (e.g., `api.sheena.app`)
3. Configure DNS records

## Step 7: Set Environment Variables in Production

1. Go to Vercel dashboard → Project → Settings → Environment Variables
2. Add all required variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`

## Step 8: Verify Deployment

```bash
# Test health endpoint
curl https://api.sheena.app/health

# Expected response:
# {"status":"ok","environment":"production","timestamp":"2024-01-15T12:00:00Z"}
```

## Monitoring & Logs

### View Real-time Logs
```bash
vercel logs <project-url>
```

### Monitor Performance
1. Vercel Dashboard → Analytics
2. View cold start time, execution time, and memory usage

### Set Up Error Tracking
Integrate Sentry:

```bash
npm install @sentry/node
```

In `server/index.js`:
```javascript
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
})
```

## Troubleshooting

### "Function exceeds maximum size"
**Solution:** Split handlers into multiple functions or optimize dependencies

### "Cold start takes > 5s"
**Solution:** 
- Reduce bundle size
- Use lightweight alternatives for heavy packages
- Consider Vercel Pro for faster cold starts

### "SUPABASE_URL not defined"
**Solution:** 
- Verify environment variables in Vercel dashboard
- Redeploy after adding variables: `vercel redeploy`

### "Service role key exposed"
**Solution:** 
- Ensure `.env` is in `.gitignore`
- Use Vercel's environment variable feature
- Rotate the key immediately if exposed

## Database Backups

Supabase automatically backs up your database daily. You can also create manual backups:

1. Go to Supabase dashboard → Backups
2. Click "Create backup"
3. Download backup if needed

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Custom domain configured
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Database migrations applied
- [ ] Error tracking (Sentry) configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Service role key rotation schedule set
- [ ] Monitoring alerts configured
- [ ] Backup strategy in place

## Rolling Back a Deployment

```bash
# View deployment history
vercel list

# Promote previous deployment
vercel promote <deployment-url>
```

## Next Steps

1. ✅ Deploy backend to Vercel
2. ✅ Update frontend `.env` to use production API URL
3. ✅ Run full e2e tests in production
4. ✅ Set up monitoring and alerts
5. ✅ Plan scaling strategy


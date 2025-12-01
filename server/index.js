import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import rateLimit from 'express-rate-limit'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment before starting the server')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const app = express()
app.use(cors())
app.use(bodyParser.json())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', limiter)

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 requests per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
})

app.use('/api/auth/', authLimiter)

// Authentication middleware
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = user
    next()
  } catch (err) {
    console.error('Auth middleware error:', err)
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

// Optional auth middleware (doesn't fail if no token)
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user } } = await supabaseAuth.auth.getUser(token)
      if (user) {
        req.user = user
      }
    }
    next()
  } catch (err) {
    // Continue without auth if token is invalid
    next()
  }
}

// POST /api/bets/place
// Body: { user_id, match_id, stake, odds }
// NOTE: This example performs sequential checks/updates. For production, implement this as a DB-side transaction (stored procedure) to avoid race conditions.
app.post('/api/bets/place', async (req, res) => {
  try {
    const { user_id, match_id, stake, odds } = req.body
    if (!user_id || !match_id || stake == null || odds == null) {
      return res.status(400).json({ error: 'Missing required fields: user_id, match_id, stake, odds' })
    }

    // Use DB-side stored procedure for atomic placement
    const stakeNum = Number(stake)
    if (isNaN(stakeNum) || stakeNum <= 0) return res.status(400).json({ error: 'Invalid stake' })

    const selection = req.body.selection || req.body.outcome || null

    const { data: rpcData, error: rpcErr } = await supabase.rpc('place_bet', {
      p_user_id: user_id,
      p_match_id: match_id,
      p_stake: stakeNum,
      p_odds: Number(odds),
      p_selection: selection
    })

    if (rpcErr) {
      // Map common errors thrown by the function to HTTP status codes
      if (rpcErr.message && rpcErr.message.includes('profile_not_found')) return res.status(404).json({ error: 'User profile not found' })
      if (rpcErr.message && rpcErr.message.includes('insufficient_funds')) return res.status(400).json({ error: 'Insufficient balance' })
      console.error('RPC error place_bet:', rpcErr)
      return res.status(500).json({ error: rpcErr.message || String(rpcErr) })
    }

    // rpc returns an array of rows for a TABLE return type
    const bet = Array.isArray(rpcData) && rpcData[0]
    return res.status(201).json({ bet })
  } catch (err) {
    console.error('Error in /api/bets/place', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// POST /api/auth/signup
// Body: { email, password, display_name }
// Creates a new user and profile
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, display_name } = req.body
    if (!email || !password || !display_name) {
      return res.status(400).json({ error: 'Missing required fields: email, password, display_name' })
    }

    // Create user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    })

    if (authError) {
      return res.status(400).json({ error: authError.message })
    }

    const userId = authData.user?.id
    if (!userId) {
      return res.status(500).json({ error: 'Failed to create user' })
    }

    // Profile auto-created via trigger, but let's update display_name
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ display_name })
      .eq('id', userId)

    if (profileError) {
      console.error('Warning: profile update failed:', profileError.message)
    }

    return res.status(201).json({
      user: { id: userId, email },
      message: 'Signup successful. Check your email for confirmation.'
    })
  } catch (err) {
    console.error('Error in /api/auth/signup', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// POST /api/auth/signin
// Body: { email, password }
// Returns session token
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields: email, password' })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return res.status(401).json({ error: error.message })
    }

    const { user, session } = data
    return res.json({
      user: { id: user.id, email: user.email },
      session: session.access_token
    })
  } catch (err) {
    console.error('Error in /api/auth/signin', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// GET /api/users/profile/:userId
// Returns user profile
app.get('/api/users/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, avatar_url, bio, balance, created_at')
      .eq('id', userId)
      .single()

    if (error) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    return res.json(profile)
  } catch (err) {
    console.error('Error in /api/users/profile', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// PUT /api/users/profile/:userId
// Updates user profile (requires auth token in header)
app.put('/api/users/profile/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params
    const { display_name, avatar_url, bio } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ display_name, avatar_url, bio })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.json(profile)
  } catch (err) {
    console.error('Error in PUT /api/users/profile', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// ============================================
// MATCHES ENDPOINTS
// ============================================

// GET /api/matches
// Query params: ?status=scheduled|live|finished&sport=football
// Returns list of matches
app.get('/api/matches', async (req, res) => {
  try {
    const { status, sport, limit = 20, offset = 0 } = req.query

    let query = supabase
      .from('matches')
      .select('id, home_team, away_team, kickoff_time, status, odds_home, odds_draw, odds_away')
      .order('kickoff_time', { ascending: true })

    if (status) query = query.eq('status', status)
    if (sport) query = query.eq('sport', sport)

    const { data: matches, error } = await query
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.json(matches || [])
  } catch (err) {
    console.error('Error in GET /api/matches', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// GET /api/matches/:matchId
// Returns single match details
app.get('/api/matches/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params

    const { data: match, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (error) {
      return res.status(404).json({ error: 'Match not found' })
    }

    return res.json(match)
  } catch (err) {
    console.error('Error in GET /api/matches/:matchId', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// POST /api/matches
// Admin: Create a new match
// Body: { home_team, away_team, kickoff_time, odds_home, odds_draw, odds_away }
app.post('/api/matches', async (req, res) => {
  try {
    const { home_team, away_team, kickoff_time, odds_home, odds_draw, odds_away } = req.body

    if (!home_team || !away_team || !kickoff_time) {
      return res.status(400).json({ error: 'Missing required fields: home_team, away_team, kickoff_time' })
    }

    const matchId = `${home_team.toLowerCase()}-${away_team.toLowerCase()}-${Date.now()}`

    const { data: match, error } = await supabase
      .from('matches')
      .insert({
        id: matchId,
        home_team,
        away_team,
        kickoff_time,
        status: 'scheduled',
        odds_home: odds_home || 2.0,
        odds_draw: odds_draw || 3.5,
        odds_away: odds_away || 2.0
      })
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(201).json(match)
  } catch (err) {
    console.error('Error in POST /api/matches', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// ============================================
// AI NEWS ENDPOINTS
// ============================================

// POST /api/ai/generate-news
// Body: { topic, match_id?, persona?, tone?, language?, useGrounding? }
// Generates AI news articles using Tavily + Gemini via edge function
app.post('/api/ai/generate-news', async (req, res) => {
  try {
    const { topic, match_id, persona, tone, language, useGrounding } = req.body

    // Call Supabase edge function
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/generate-news`
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({
        topic: topic || 'sports news',
        match_id,
        persona: persona || 'SHEENA',
        tone: tone || 'RECAP',
        language: language || 'ENGLISH',
        useGrounding: useGrounding !== false
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Edge function error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return res.json(data)
  } catch (err) {
    console.error('Error in POST /api/ai/generate-news', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// ============================================
// ODDS ENDPOINTS
// ============================================

// GET /api/odds/comparison
// Query params: ?match_id=xxx
// Returns odds comparison from different bookmakers
app.get('/api/odds/comparison', async (req, res) => {
  try {
    const { match_id, limit = 10, refresh = false } = req.query

    // If refresh requested, fetch latest odds from API-Football
    if (refresh === 'true') {
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/fetch-odds`
      const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

      try {
        await fetch(`${edgeFunctionUrl}?limit=${limit}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${anonKey}`
          }
        })
        // Don't wait for completion, just trigger it
      } catch (err) {
        console.error('Error triggering odds fetch:', err)
      }
    }

    let query = supabase
      .from('odds')
      .select('id, bookmaker, odds_home, odds_draw, odds_away, fetched_at, match_id')
      .order('fetched_at', { ascending: false })

    if (match_id) query = query.eq('match_id', match_id)

    const { data: odds, error } = await query.limit(Number(limit))

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.json(odds || [])
  } catch (err) {
    console.error('Error in GET /api/odds/comparison', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// ============================================
// DATA INGESTION ENDPOINTS
// ============================================

// POST /api/ingest/matches
// Fetch and ingest live & upcoming matches from API-Football
app.post('/api/ingest/matches', async (req, res) => {
  try {
    console.log('📡 Starting match ingestion...')
    
    // Dynamically import the ingest worker
    const { runAllIngestion } = await import('./worker_ingest.js')
    
    // Run ingestion in background
    runAllIngestion().catch(err => console.error('Ingestion error:', err))
    
    return res.status(202).json({
      message: 'Data ingestion started in background',
      status: 'processing'
    })
  } catch (err) {
    console.error('Error in /api/ingest/matches', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// GET /api/ingest/status
// Check ingestion status (placeholder for now)
app.get('/api/ingest/status', (req, res) => {
  res.json({
    status: 'ready',
    lastIngestion: new Date().toISOString(),
    nextScheduledIngestion: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  })
})

// ============================================
// PAYMENT ENDPOINTS
// ============================================

// POST /api/payments/stripe/create-checkout
// Body: { user_id, amount, currency }
// Creates Stripe checkout session
app.post('/api/payments/stripe/create-checkout', async (req, res) => {
  try {
    const { user_id, amount, currency = 'usd' } = req.body

    if (!user_id || !amount) {
      return res.status(400).json({ error: 'Missing required fields: user_id, amount' })
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return res.status(500).json({ error: 'Stripe not configured' })
    }

    // Import stripe dynamically (install: npm install stripe)
    const stripe = (await import('stripe')).default(stripeKey)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'Sheena Credits',
              description: `Add ${amount} credits to your account`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancel`,
      metadata: {
        user_id: user_id,
        amount: amount.toString(),
      },
    })

    // Store transaction in database
    await supabase.from('transactions').insert({
      user_id: user_id,
      type: 'deposit',
      amount: amount,
      currency: currency,
      status: 'pending',
      payment_method: 'stripe',
      external_id: session.id,
    })

    return res.json({ sessionId: session.id, url: session.url })
  } catch (err) {
    console.error('Error in POST /api/payments/stripe/create-checkout', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// POST /api/payments/stripe/webhook
// Handles Stripe webhook events
app.post('/api/payments/stripe/webhook', async (req, res) => {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!stripeKey || !webhookSecret) {
      return res.status(500).json({ error: 'Stripe webhook not configured' })
    }

    const stripe = (await import('stripe')).default(stripeKey)
    const sig = req.headers['stripe-signature']

    let event
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    } catch (err) {
      return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.user_id
      const amount = parseFloat(session.metadata?.amount || '0')

      // Update transaction status
      await supabase
        .from('transactions')
        .update({ status: 'completed', external_id: session.id })
        .eq('external_id', session.id)

      // Add balance to user
      const { error: balanceError } = await supabase.rpc('add_balance', {
        p_user_id: userId,
        p_amount: amount,
      })

      if (balanceError) {
        console.error('Error adding balance:', balanceError)
      }
    }

    return res.json({ received: true })
  } catch (err) {
    console.error('Error in POST /api/payments/stripe/webhook', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// POST /api/payments/crypto/generate-address
// Body: { user_id, amount, currency }
// Generates TRON address for payment
app.post('/api/payments/crypto/generate-address', async (req, res) => {
  try {
    const { user_id, amount, currency = 'USDT' } = req.body

    if (!user_id || !amount) {
      return res.status(400).json({ error: 'Missing required fields: user_id, amount' })
    }

    // Generate unique payment ID
    const paymentId = `tron_${Date.now()}_${user_id.substring(0, 8)}`
    
    // Use your TRON wallet address (store in env)
    const tronWalletAddress = process.env.TRON_WALLET_ADDRESS
    if (!tronWalletAddress) {
      return res.status(500).json({ error: 'TRON wallet not configured' })
    }

    // Store pending transaction
    await supabase.from('transactions').insert({
      user_id: user_id,
      type: 'deposit',
      amount: amount,
      currency: currency,
      status: 'pending',
      payment_method: 'tron',
      external_id: paymentId,
      metadata: {
        wallet_address: tronWalletAddress,
        payment_id: paymentId,
      },
    })

    return res.json({
      address: tronWalletAddress,
      paymentId: paymentId,
      amount: amount,
      currency: currency,
      network: 'TRC20',
      memo: paymentId, // Use payment ID as memo for tracking
    })
  } catch (err) {
    console.error('Error in POST /api/payments/crypto/generate-address', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// POST /api/payments/crypto/verify
// Body: { payment_id, transaction_hash }
// Verifies TRON transaction
app.post('/api/payments/crypto/verify', async (req, res) => {
  try {
    const { payment_id, transaction_hash } = req.body

    if (!payment_id || !transaction_hash) {
      return res.status(400).json({ error: 'Missing required fields: payment_id, transaction_hash' })
    }

    // Call edge function to verify transaction
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/verify-tron-payment`
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        payment_id,
        transaction_hash,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Verification error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    if (data.verified) {
      // Update transaction and add balance
      const { data: transaction } = await supabase
        .from('transactions')
        .select('user_id, amount')
        .eq('external_id', payment_id)
        .single()

      if (transaction) {
        await supabase
          .from('transactions')
          .update({ status: 'completed', metadata: { transaction_hash } })
          .eq('external_id', payment_id)

        await supabase.rpc('add_balance', {
          p_user_id: transaction.user_id,
          p_amount: transaction.amount,
        })
      }
    }

    return res.json(data)
  } catch (err) {
    console.error('Error in POST /api/payments/crypto/verify', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// ============================================
// COMMUNITY & CHAT ENDPOINTS
// ============================================

// POST /api/community/:channelId/message
// Body: { user_id, message }
// Stores chat message
app.post('/api/community/:channelId/message', async (req, res) => {
  try {
    const { channelId } = req.params
    const { user_id, message } = req.body

    if (!user_id || !message) {
      return res.status(400).json({ error: 'Missing required fields: user_id, message' })
    }

    const { data: chatMessage, error } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: channelId,
        user_id: user_id,
        message: message,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Emit to Socket.io if available (will be set up below)
    if (req.app.get('io')) {
      req.app.get('io').to(channelId).emit('new_message', chatMessage)
    }

    return res.status(201).json(chatMessage)
  } catch (err) {
    console.error('Error in POST /api/community/:channelId/message', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// GET /api/community/:channelId/messages
// Returns chat messages for a channel
app.get('/api/community/:channelId/messages', async (req, res) => {
  try {
    const { channelId } = req.params
    const { limit = 50, offset = 0 } = req.query

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*, profiles(id, display_name, avatar_url)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.json(messages || [])
  } catch (err) {
    console.error('Error in GET /api/community/:channelId/messages', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// POST /api/community/:channelId/poll/vote
// Body: { user_id, option }
// Handles poll voting
app.post('/api/community/:channelId/poll/vote', async (req, res) => {
  try {
    const { channelId } = req.params
    const { user_id, option, poll_id } = req.body

    if (!user_id || option === undefined || !poll_id) {
      return res.status(400).json({ error: 'Missing required fields: user_id, option, poll_id' })
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('poll_votes')
      .select('id')
      .eq('poll_id', poll_id)
      .eq('user_id', user_id)
      .single()

    if (existingVote) {
      return res.status(400).json({ error: 'User already voted' })
    }

    // Record vote
    const { data: vote, error } = await supabase
      .from('poll_votes')
      .insert({
        poll_id: poll_id,
        user_id: user_id,
        option: option,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Emit poll update
    if (req.app.get('io')) {
      req.app.get('io').to(channelId).emit('poll_update', { poll_id, option })
    }

    return res.status(201).json(vote)
  } catch (err) {
    console.error('Error in POST /api/community/:channelId/poll/vote', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// ============================================
// BROADCAST ENDPOINTS
// ============================================

// POST /api/alerts/broadcast
// Body: { message, channels: ['telegram', 'whatsapp'] }
// Broadcasts alert to Telegram/WhatsApp
app.post('/api/alerts/broadcast', async (req, res) => {
  try {
    const { message, channels = ['telegram'] } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Missing required field: message' })
    }

    const results = []

    // Broadcast to Telegram
    if (channels.includes('telegram')) {
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/telegram-broadcast`
      const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

      try {
        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ message }),
        })

        const data = await response.json()
        results.push({ channel: 'telegram', success: response.ok, data })
      } catch (err) {
        results.push({ channel: 'telegram', success: false, error: err.message })
      }
    }

    // Broadcast to WhatsApp
    if (channels.includes('whatsapp')) {
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/whatsapp-broadcast`
      const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

      try {
        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ message }),
        })

        const data = await response.json()
        results.push({ channel: 'whatsapp', success: response.ok, data })
      } catch (err) {
        results.push({ channel: 'whatsapp', success: false, error: err.message })
      }
    }

    // Log broadcast
    await supabase.from('broadcasts').insert({
      message: message,
      channels: channels,
      results: results,
      created_at: new Date().toISOString(),
    })

    return res.json({ status: 'success', results })
  } catch (err) {
    console.error('Error in POST /api/alerts/broadcast', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ============================================
// SOCKET.IO SETUP (Optional - for real-time chat)
// ============================================

let server
const port = process.env.PORT || 4000

// Check if Socket.io should be enabled
if (process.env.ENABLE_SOCKET_IO === 'true') {
  try {
    const { Server } = await import('socket.io')
    const http = await import('http')
    const httpServer = http.createServer(app)
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
      },
    })

    app.set('io', io)

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      socket.on('join_channel', (channelId) => {
        socket.join(channelId)
        console.log(`Client ${socket.id} joined channel ${channelId}`)
      })

      socket.on('leave_channel', (channelId) => {
        socket.leave(channelId)
        console.log(`Client ${socket.id} left channel ${channelId}`)
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })

    server = httpServer
    server.listen(port, () => console.log(`Server with Socket.io listening on http://localhost:${port}`))
  } catch (err) {
    console.warn('Socket.io not available, running without real-time features:', err.message)
    server = app.listen(port, () => console.log(`Server listening on http://localhost:${port}`))
  }
} else {
  server = app.listen(port, () => console.log(`Server listening on http://localhost:${port}`))
}

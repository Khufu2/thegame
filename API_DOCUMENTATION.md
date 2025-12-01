# Sheena API Documentation

Base URL: `http://localhost:4000` (development) or `https://api.sheena.app` (production)

## Authentication

All protected endpoints require an `Authorization` header with a valid JWT token from Supabase Auth:

```
Authorization: Bearer <access_token>
```

Tokens are obtained via `/api/auth/signin`.

---

## Endpoints

### Health & Status

#### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

### Authentication

#### POST `/api/auth/signup`
Create a new user account and profile.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "display_name": "John Doe"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "message": "Signup successful. Check your email for confirmation."
}
```

**Errors:**
- `400` - Missing fields or invalid email
- `400` - Email already registered

---

#### POST `/api/auth/signin`
Authenticate and get a session token.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400` - Missing fields
- `401` - Invalid email or password

---

### Users & Profiles

#### GET `/api/users/profile/:userId`
Fetch a user's profile information.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "John Doe",
  "avatar_url": "https://...",
  "bio": "Sports enthusiast",
  "balance": 1500.50,
  "created_at": "2024-01-01T12:00:00Z"
}
```

**Errors:**
- `404` - User not found

---

#### PUT `/api/users/profile/:userId`
Update a user's profile (requires auth token).

**Body:**
```json
{
  "display_name": "John Doe Updated",
  "avatar_url": "https://...",
  "bio": "Updated bio"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "John Doe Updated",
  "avatar_url": "https://...",
  "bio": "Updated bio",
  "balance": 1500.50,
  "created_at": "2024-01-01T12:00:00Z"
}
```

**Errors:**
- `400` - Invalid data
- `401` - Unauthorized

---

### Matches

#### GET `/api/matches`
List all matches with optional filtering.

**Query Parameters:**
- `status` - Filter by status: `scheduled`, `live`, `finished` (optional)
- `sport` - Filter by sport: `football`, `basketball`, etc. (optional)
- `limit` - Results per page (default: 20)
- `offset` - Pagination offset (default: 0)

**Response (200):**
```json
[
  {
    "id": "match-001",
    "home_team": "Manchester United",
    "away_team": "Liverpool",
    "kickoff_time": "2024-01-15T15:00:00Z",
    "status": "scheduled",
    "odds_home": 2.1,
    "odds_draw": 3.5,
    "odds_away": 3.2
  }
]
```

---

#### GET `/api/matches/:matchId`
Fetch detailed information about a specific match.

**Response (200):**
```json
{
  "id": "match-001",
  "home_team": "Manchester United",
  "away_team": "Liverpool",
  "kickoff_time": "2024-01-15T15:00:00Z",
  "status": "scheduled",
  "odds_home": 2.1,
  "odds_draw": 3.5,
  "odds_away": 3.2,
  "home_team_score": null,
  "away_team_score": null,
  "result": null
}
```

**Errors:**
- `404` - Match not found

---

#### POST `/api/matches`
Create a new match (admin only).

**Body:**
```json
{
  "home_team": "Manchester United",
  "away_team": "Liverpool",
  "kickoff_time": "2024-01-15T15:00:00Z",
  "odds_home": 2.1,
  "odds_draw": 3.5,
  "odds_away": 3.2
}
```

**Response (201):**
```json
{
  "id": "match-001",
  "home_team": "Manchester United",
  "away_team": "Liverpool",
  "kickoff_time": "2024-01-15T15:00:00Z",
  "status": "scheduled",
  "odds_home": 2.1,
  "odds_draw": 3.5,
  "odds_away": 3.2
}
```

**Errors:**
- `400` - Missing required fields
- `401` - Admin only

---

### Bets

#### POST `/api/bets/place`
Place a new bet on a match.

**Body:**
```json
{
  "user_id": "uuid",
  "match_id": "match-001",
  "stake": 100.00,
  "odds": 2.5,
  "selection": "home_team"
}
```

**Response (201):**
```json
{
  "bet": {
    "id": "bet-uuid",
    "user_id": "uuid",
    "match_id": "match-001",
    "stake": 100.00,
    "odds": 2.5,
    "selection": "home_team",
    "potential_win": 250.00,
    "status": "open",
    "created_at": "2024-01-15T12:00:00Z"
  }
}
```

**Errors:**
- `400` - Missing fields: `user_id`, `match_id`, `stake`, `odds`
- `400` - Invalid stake amount
- `400` - Insufficient balance
- `404` - User profile not found
- `404` - Match not found

---

### Odds Comparison

#### GET `/api/odds/comparison`
Fetch odds from multiple bookmakers for a match.

**Query Parameters:**
- `match_id` - Match ID (optional)
- `sport` - Sport filter (optional)
- `limit` - Results limit (default: 10)

**Response (200):**
```json
[
  {
    "id": "odds-uuid",
    "bookmaker": "bet365",
    "odds_home": 2.1,
    "odds_draw": 3.5,
    "odds_away": 3.2,
    "fetched_at": "2024-01-15T12:00:00Z"
  },
  {
    "id": "odds-uuid",
    "bookmaker": "william_hill",
    "odds_home": 2.05,
    "odds_draw": 3.6,
    "odds_away": 3.3,
    "fetched_at": "2024-01-15T12:00:00Z"
  }
]
```

---

### AI News

#### GET `/api/ai/generate-news`
Generate AI news articles about sports topics.

**Query Parameters:**
- `team` - Team or topic name (default: `football`)
- `count` - Number of articles (default: 5)

**Response (200):**
```json
[
  {
    "id": "article-uuid",
    "title": "Manchester United beats Liverpool 2-1",
    "content": "AI-generated article content about the match...",
    "source": "AI News Agent",
    "created_at": "2024-01-15T12:00:00Z",
    "sentiment": "positive"
  }
]
```

---

## Error Response Format

All errors follow this format:

```json
{
  "error": "Error description here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (auth token missing/invalid)
- `404` - Not Found
- `500` - Server Error

---

## Rate Limiting

**Coming soon:** Rate limiting will be implemented for production.

---

## Webhooks

**Coming soon:** Webhooks for real-time updates on match results, bet settlements, etc.

---

## SDKs & Client Libraries

### JavaScript/TypeScript
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

// Signup
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})

// Place bet
const response = await fetch('http://localhost:4000/api/bets/place', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: user.id,
    match_id: 'match-001',
    stake: 100,
    odds: 2.5
  })
})
```

---

## Support

For issues or questions, open an issue on GitHub or contact support@sheena.app


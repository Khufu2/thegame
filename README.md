
# 🐙 Sheena Sports - The Bible (Engineering Master Plan)

**Version:** 2.2 (The "Agent & Personas" Update)
**Tech Stack:** React 19, Tailwind CSS, Lucide Icons, Google Gemini AI
**Concept:** The ultimate sports intelligence platform. Blending Bleacher Report-style media with a high-powered Betting Intelligence Terminal.

---

## 🚨 CRITICAL: Real-Time Data Requirements (News Agent)

To make the AI Agent useful for breaking news, **you must connect a Search API**.
Gemini does not know about events that happened 5 minutes ago. It needs "Grounding".

### The "News Agent" Pipeline
1.  **Trigger:** Admin selects a match (e.g., Lakers vs Warriors) in the Command Center.
2.  **Grounding (REQUIRED):** 
    *   The Backend (or Service) calls **Tavily API** or **Google Custom Search API**.
    *   *Query:* "Lakers vs Warriors game highlights, score, and quotes last 2 hours".
    *   *Result:* Returns ~5 text snippets of facts.
3.  **Synthesis:**
    *   Sheena AI takes these facts and writes the story in the selected **Persona** (Sheena, Oracle, Street, etc.).
4.  **Publish:** The result is saved to the Feed.

*See `services/newsAgentService.ts` for the integration point.*

---

## 🏗️ Architecture Overview

The app runs as a **Single Page Application (SPA)** using `react-router-dom`.

*   **Frontend:** React (Vite). Hosts the UI, Pweza Chat, and Admin Dashboard.
*   **Backend (Required for Prod):** Node.js (Express) or Python (FastAPI).
    *   **Role:** Hosts the Database, runs Cron Jobs for live scores, hosts the **Telegram/WhatsApp Bots**, and proxies AI calls.
    *   **Database:** Supabase (PostgreSQL) recommended.

---

## 🤖 The Bot Ecosystem (WhatsApp & Telegram)

**Crucial Note:** Bots cannot run purely in the browser. They need a server that stays online 24/7.

### 1. The Strategy: "The Sheena Broadcaster"
Instead of just a chatbot, use these platforms as a **Distribution Channel**.
*   **Step 1:** Create "Sheena VIP Signals" on Telegram/WhatsApp.
*   **Step 2:** In the **Admin Dashboard (War Room)**, check "Broadcast to Bots".
*   **Step 3:** When you click "Broadcast Alert", the Backend pushes the text to the Bot APIs.

---

## ✅ Feature Set (Implemented)

### 1. The Core Feed (`Feed.tsx`)
*   **Hybrid Stream:** Interleaves News, Matches, and "War Room" alerts.
*   **Smart Filtering:** "For You" tab based on user preferences.
*   **Visual Tiers:** Hero Cards, Daily Locks Rail, Value Radar.

### 2. Explorer & Accumulator (`ExplorePage.tsx`)
*   **Dynamic Acca Builder:** Users can select "Sure Bets" (Confidence > 65%), see combined odds/payout, and edit the slip before adding it.
*   **League Hubs:** Click a league (e.g., EPL) to see a modal with Standings and Upcoming Fixtures.
*   **Trending:** Hot topics search.

### 3. Match Intelligence (`MatchDetailPage.tsx`)
*   **Live Momentum:** Real-time pressure bar.
*   **Visual Pitch:** Interactive lineups.
*   **Granular Stats:** 365Scores-style breakdown.

### 4. Admin Command Center (`AdminPage.tsx`)
*   **Staff Management:** Invite Journalists, Moderators, and Admins.
*   **AI Personas:** Generate news as:
    *   *Sheena (Professional Analyst)*
    *   *The Oracle (Cryptic/Wise/Ancient)*
    *   *Street Hype (High Energy/Slang)*
*   **War Room:** Manual alert broadcasting.

### 5. Utilities
*   **Mkeka Wizard:** Auto-generates slips (Safe/Longshot).
*   **Data Saver:** "Lite Mode" (Disabled by default) to save bandwidth. Replaces heavy images with stylized placeholders.

---

## 🔌 API Checklist (To Go Live)

1.  **Live Scores:** API-Football (api-sports.io)
2.  **Betting Odds:** The Odds API (the-odds-api.com)
3.  **AI Grounding:** Tavily AI (tavily.com) - **MANDATORY for News Agent**
4.  **Database:** Supabase
5.  **Payments:** Stripe (Cards) + TronGrid (Crypto)

---

## 📝 Backend Handoff Checklist

**Frontend Developer:** Here is what the backend team needs to implement to make the app fully functional:

### 1. User System
- [ ] **GET /api/user/:id** - Fetch public profile stats, badges, and recent bets.
- [ ] **POST /api/user/follow** - Follow another user/source.
- [ ] **PUT /api/user/preferences** - Update team/league favorites & notification settings.

### 2. Community & Chat
- [ ] **WS /socket.io** - Real-time chat for `CommunityPage`.
- [ ] **POST /api/community/:id/message** - Store chat messages.
- [ ] **POST /api/community/:id/poll/vote** - Handle poll voting logic.

### 3. Betting Engine
- [ ] **POST /api/bets/place** - Accept a bet slip, validate odds, and deduct virtual currency.
- [ ] **CRON JOB** - Every minute: Check live match results and settle "PENDING" bets (Mark WON/LOST).
- [ ] **GET /api/odds/comparison** - Fetch odds from multiple bookies (FanDuel, DraftKings) for the "Execution Hub".

### 4. AI & News
- [ ] **POST /api/ai/generate-news** - Proxy endpoint for Gemini + Tavily Search (to keep API keys hidden).
- [ ] **POST /api/alerts/broadcast** - Send "War Room" alerts to Telegram Bot API & WhatsApp Business API.

### 5. League Data
- [ ] **GET /api/league/:id/transfers** - Fetch latest transfer news/rumors.
- [ ] **GET /api/league/:id/standings** - Live table data.

---

*Prepared by Sheena Engineering Team*


# 🐙 Sheena Sports - The Bible (Engineering Master Plan)

**Version:** 3.0 (Frontend Complete / Backend Ready)
**Tech Stack:** React 19, Tailwind CSS, Lucide Icons, Google Gemini AI
**Concept:** The ultimate sports intelligence platform. Blending Bleacher Report-style media with a high-powered Betting Intelligence Terminal.

---

## 🏆 Status Report: Frontend 100% Complete + Prediction Models Enhanced

The frontend for Sheena Sports is now **Feature Complete** for the MVP.
All UI components, user flows, and mock interactions are implemented. The application is polished, responsive, and ready for backend integration.

### What's Done?
*   **Authentication:** Login/Signup screens with Email & Phone (WhatsApp) flows. Guest mode included.
*   **Core Feed:** Hybrid stream of News, Live Scores, and "War Room" alerts.
*   **Match Intelligence:** Deep stats, visual lineups, momentum meters, and AI predictions.
*   **Exploration:** League browsing, Search, and "Dynamic Acca" builder.
*   **Community:** Discord-style chat channels, live polls, and user profiles.
*   **Admin Command Center:** News publishing, AI Agent content generation, Team management, and Prediction Analytics.
*   **Support Pages:** Help, Legal, and Notifications centers.
*   **Utilities:** Data Saver mode, Theme switching (Dark/Light), and Localization.

### Prediction Model Enhancements (COMPLETED)
*   **Phase 1:** Enhanced AI Predictions with Confidence Scoring - ✅ DONE
    - Improved Gemini AI prompts with historical data integration
    - Added confidence percentage scoring (0-100%)
    - Enhanced prediction structure with reasoning and key insights
    - Updated UI to display confidence levels and risk indicators

*   **Phase 2:** Advanced ML Models - ✅ DONE
    - **Elo Rating System:** Full implementation with home advantage calculations
    - **Poisson Regression Model:** Statistical goal prediction with Dixon-Coles adjustment
    - **Hybrid Prediction System:** Smart fallback (Elo → AI → Regression → Basic)
    - **Database Infrastructure:** Team Elo ratings, prediction history, performance tracking

*   **Phase 2:** Backtesting Framework - ✅ DONE
    - **Historical Analysis Engine:** Compare predictions vs actual results
    - **Profit/Loss Tracking:** Simulated betting returns ($10 stake model)
    - **Model Performance Breakdown:** Elo vs AI vs Regression accuracy
    - **Admin Dashboard:** Live backtesting with filtering by time/model/league
    - **Confidence Correlation Analysis:** How well confidence predicts outcomes

### Is there anything left?
**Frontend features complete. Prediction models enhanced.** Remaining work is backend integration and additional Phase 2 features.

### Remaining Phase 2 Features (Optional)
*   **Real-time Data Integration:** Live stats, injury reports, weather conditions for enhanced predictions
*   **User Personalization:** Adaptive predictions based on user betting patterns and success rates
*   **Advanced Analytics:** Prediction performance dashboards, ROI tracking, model optimization

### Urgent Fixes Needed (For Current Bot)
*   **Share Function:** Integrate html2canvas library for actual image generation
*   **Admin CMS Issues:**
    - Published news articles not showing in admin for editing/deleting
    - News articles only show title, not body content
    - No way to add images, only links
*   **AI News Generation:** API key connection issues (Gemini/Tavily integration)

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

## 🔌 API Checklist (To Go Live)

1.  **Live Scores:** API-Football (api-sports.io)
2.  **Betting Odds:** API-Football Odds endpoints (api-sports.io)
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

---

## 🔧 Supabase setup (frontend)

Add the following environment variables to your project's `.env` (Vite will expose variables prefixed with `VITE_` to the frontend):

- `VITE_SUPABASE_URL` — your Supabase project URL (e.g. `https://xyzcompany.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public API key

Notes:
- Never commit the Supabase service role key to the repo. Server-only code should use `SUPABASE_SERVICE_ROLE_KEY` with a secure runtime (server, edge function, or CI secret).
- The frontend will use `services/supabaseClient.ts` to initialize the client with the `VITE_` variables.

Important security note:
- I noticed you added `VITE_SUPABASE_SERVICE_ROLE_KEY` to your environment. That exposes the service role key to the browser build and public clients — please remove the `VITE_` prefix and store the key as `SUPABASE_SERVICE_ROLE_KEY` in your server/CI secrets immediately. If this key was pushed or used in client builds, rotate (revoke) the service role key from the Supabase dashboard and create a new one.

Server-side admin client:
- I've added `services/supabaseAdmin.ts`, a server-only Supabase client that reads `SUPABASE_SERVICE_ROLE_KEY` from `process.env`. Use that client only in secure runtimes (server, Edge Functions, or CI), never in frontend code.


If you want me to also scaffold server-side examples (Edge Functions or a small Express server) for admin operations and cron jobs, tell me and I'll add them next.

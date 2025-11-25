# 🐙 Sheena Sports - The Bible (Engineering Master Plan)

**Version:** 2.0 (Production Roadmap)
**Tech Stack:** React 19, Tailwind CSS, Lucide Icons, Google Gemini AI
**Concept:** The ultimate sports intelligence platform. Blending Bleacher Report-style media with a high-powered Betting Intelligence Terminal.

---

## 🏗️ Architecture Overview

The app runs as a **Single Page Application (SPA)** using `react-router-dom`.

*   **Frontend:** React (Vite/Next.js). Hosts the UI, Pweza Chat, and Admin Dashboard.
*   **Backend (Required for Production):** Node.js (Express) or Python (FastAPI).
    *   **Role:** Hosts the Database, runs the Cron Jobs for live scores, hosts the **Telegram/WhatsApp Bots**, and proxies AI calls.
*   **Database:** Supabase (PostgreSQL) or Firebase. Stores Users, Bets, and History.

---

## 🧠 Production AI Workflow (The "Grounding" Layer)

Currently, the AI generates content based on the mock data provided. In production, it must be **Grounded** in real-time internet data.

**The "News Agent" Pipeline:**
1.  **Trigger:** Admin selects a match (e.g., Lakers vs Warriors) in the Admin Dashboard.
2.  **Grounding Step (The Missing Link):** 
    *   The Backend calls **Google Custom Search API** or **Tavily API**.
    *   Query: *"Lakers vs Warriors game highlights, quotes, and injuries last 24 hours"*.
    *   Result: Returns ~5 text snippets of real facts.
3.  **Synthesis:**
    *   The Backend sends a prompt to **Gemini**: *"Using ONLY these facts [Snippets], write a [Hype/Analytical] article..."*
4.  **Publish:** The result is saved to the DB and pushed to the Feed.

---

## 🤖 The Bot Ecosystem (WhatsApp & Telegram)

**Crucial Note:** Bots cannot run in the browser. They need a server that stays online 24/7.

### 1. The Strategy: "The Sheena Broadcaster"
Instead of just a chatbot, use these platforms as a **Distribution Channel**.

*   **Step 1:** You create a "Sheena VIP Signals" Channel on Telegram and a Community on WhatsApp.
*   **Step 2:** In the **Admin Dashboard (War Room)**, you check a box: "Broadcast to Bots".
*   **Step 3:** When you click "Publish Alert", your Backend sends the text to the Telegram/WhatsApp APIs.
*   **Step 4:** Thousands of users get a push notification instantly.
*   **Step 5:** The message includes a deep link: `Check the analysis here: https://sheena.app/match/123`.

### 2. Bot Implementation Details
*   **Telegram:** Use the `telegraf` Node.js library. It's free and easy.
*   **WhatsApp:** Use **Twilio API for WhatsApp** (Paid, Enterprise) or **WhatsApp Cloud API** (Meta, Free tier).
*   **Hosting:** Host the bot code on **Heroku**, **DigitalOcean**, or **AWS Lambda**.

---

## 🔌 The API Checklist (What you need to buy/get)

To go live, you need to sign up for these services:

### 1. Data Feeds (The Lifeblood)
*   **Live Scores & Stats:** 
    *   *Recommendation:* **API-Football (api-sports.io)**.
    *   *Why:* Great coverage of EPL, NBA, and African leagues. Cheap starter tier.
*   **Betting Odds:**
    *   *Recommendation:* **The Odds API (the-odds-api.com)**.
    *   *Why:* US & UK bookmaker lines. Essential for "Odds Shopping" and "Value Radar".

### 2. AI & Search
*   **LLM:** **Google Gemini API** (Vertex AI).
*   **Grounding/Search:** **Tavily AI** (Optimized for LLMs) or **Google Programmable Search**.

### 3. Infrastructure
*   **Database/Auth:** **Supabase**. (Includes Auth, Database, and Realtime subscriptions).
*   **Hosting:** **Vercel** (Frontend) + **Railway/Render** (Backend Node.js).

---

## ✅ Implemented Features (Frontend Complete)

### 1. The Core Feed (`Feed.tsx`)
*   **Hybrid Stream:** Interleaves News, Matches, and "War Room" alerts.
*   **Smart Filtering:** "For You" tab based on user preferences.
*   **Tiered Visuals:** Hero, Daily Locks Rail, Value Radar.

### 2. Match Intelligence (`MatchDetailPage.tsx`)
*   **Live Momentum:** Real-time pressure bar.
*   **Visual Pitch:** Interactive lineups.
*   **Granular Stats:** 365Scores-style breakdown.
*   **Community:** "Banther" section for comments.

### 3. Betting Utilities
*   **Mkeka Wizard (`BetSlipPage.tsx`)**: Auto-generates slips (Safe/Longshot).
*   **The Accumulator (`ExplorePage.tsx`)**: Builds sure bets.
*   **Flash Alerts:** Global notifications.

### 4. Admin CMS (`AdminPage.tsx`)
*   **News Desk:** WYSIWYG editor.
*   **AI Agent:** Interface ready for Grounding integration.
*   **War Room:** Manual alert broadcasting.

### 5. Social & Growth
*   **Leaderboard:** Ranking system.
*   **ScoreShot:** Viral image generator logic.
*   **Profile:** Stats tracking and "Sheena+" upsell.

---

*Prepared by Sheena Engineering Team*

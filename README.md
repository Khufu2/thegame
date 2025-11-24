# 🐙 Sheena Sports - Engineering Handoff Guide

**Version:** 1.0 (High-Fidelity Prototype)  
**Tech Stack:** React 19, Tailwind CSS, Lucide Icons, Google Gemini AI  
**Concept:** The ultimate sports intelligence platform blending Bleacher Report-style media with AI-driven betting insights.

---

## 🏗️ Architecture Overview

The app currently runs as a **Single Page Application (SPA)** using `react-router-dom`.

*   **State Management:** `SportsContext.tsx` acts as the global store. It holds the User state, Betting Slip, Feed Data, and Authentication status. It currently relies on `generateMockData()` to hydrate the app.
*   **AI Layer:** `services/pwezaService.ts` and `newsAgentService.ts` communicate directly with Google's Gemini API.
*   **Styling:** Tailwind CSS with a custom config for "Premium Dark Mode" (colors: `br-bg`, `br-card`, `sheena-primary`).

---

## ✅ Implemented Features (Ready for Backend Integration)

### 1. Core Experience
*   **Smart Feed (`Feed.tsx`)**:
    *   **Logic:** Prioritizes "For You" content based on user preferences.
    *   **Mixed Media:** Interleaves Matches, News, and System Alerts (War Room).
    *   **Tiered Predictions:** distinct visual hierarchy for "Daily Locks" (Rail) vs "Value Radar" (Grid).
*   **Immersive Match Details (`MatchDetailPage.tsx`)**:
    *   **Live Momentum:** Visual pressure bar for live games.
    *   **Visual Lineups:** Soccer pitch visualization with player ratings and events.
    *   **Stats Engine:** Granular stats (xG, heatmap style bars) mimicking 365Scores.
    *   **Timeline:** Vertical play-by-play feed with rich media support.
    *   **Community:** "Banther" tab for live comments and polls.

### 2. Betting Intelligence
*   **The "Mkeka" Wizard (`BetSlipPage.tsx`)**:
    *   **3-Mode Generator:** "Safe Banker", "Longshot", "Goal Fest".
    *   **Logic:** Auto-selects matches from the context based on confidence thresholds.
    *   **Execution Hub:** A modal comparing odds across mocked sportsbooks (FanDuel/DraftKings).
*   **The Accumulator (`ExplorePage.tsx`)**:
    *   A tool to quickly build high-confidence, low-odds parlay slips.
*   **War Room (`AdminPage.tsx` -> Feed)**:
    *   System alerts for "Sharp Money", "Line Moves", and "Critical Injuries".

### 3. Growth & Social
*   **ScoreShot (`ScoreShotModal.tsx`)**:
    *   Generates a viral-ready, 4:5 aspect ratio graphic of the match prediction for Instagram Stories/WhatsApp Status.
*   **Pweza AI Chat (`Pweza.tsx`)**:
    *   **Context Aware:** Knows which match the user clicked on.
    *   **Streaming:** Responses stream in real-time like ChatGPT.

### 4. CMS & Admin (`AdminPage.tsx`)
*   **News Desk:** Editor to write articles with rich blocks (Tweets, Quotes).
*   **AI Agent:** Workflow to auto-generate articles from Match Data (Box Scores) in specific tones (Hype/Analytical) and languages (English/Swahili).

---

## 🚀 Production Roadmap (The "To-Do" List)

To take this live, the next engineer needs to implement the following:

### 1. Backend & Data Layer (CRITICAL)
*   **Database:** Migrate `SportsContext` state to a real DB (Supabase/Firebase).
    *   Tables needed: `Users`, `Matches`, `News`, `Bets`, `Comments`.
*   **Live Data Pipeline:** Replace `generateMockData` with real APIs.
    *   **Scores:** API-Football or SportRadar.
    *   **Odds:** The Odds API.
    *   **News:** RSS feeds or custom editorial input.

### 2. Frontend Logic Updates
*   **ScoreShot Image Generation:**
    *   *Current:* Renders HTML/CSS.
    *   *Action:* Install `html2canvas` or `dom-to-image` to actually convert the DOM element into a `.png` for download.
*   **Authentication:**
    *   *Current:* Mock login in `SportsContext`.
    *   *Action:* Integrate Clerk, Firebase Auth, or Supabase Auth.

### 3. Server-Side AI
*   **Security Risk:** Currently, the Gemini API key is exposed in the client.
*   *Action:* Move `pwezaService.ts` and `newsAgentService.ts` logic to an Edge Function (Vercel/Supabase Functions) and proxy the calls.

### 4. Payments
*   **Sheena+:** The UI exists in `ProfilePage.tsx`.
*   *Action:* Integrate Stripe/LemonSqueezy for subscription management.

---

## 📂 File Structure Guide

*   `components/`
    *   `Feed.tsx`: The main algorithmic home stream.
    *   `MatchDetailPage.tsx`: The complex single-match view.
    *   `BetSlipPage.tsx`: Betting logic and Mkeka Wizard.
    *   `AdminPage.tsx`: CMS for content creators.
    *   `ScoreShotModal.tsx`: The viral graphic generator.
*   `context/`
    *   `SportsContext.tsx`: The "Brain". Mock data lives here currently.
*   `services/`
    *   `pwezaService.ts`: Chatbot AI logic.
    *   `newsAgentService.ts`: Article generation AI logic.
*   `types.ts`: TypeScript definitions for the entire data model.

---

## 🔑 Environment Variables

Create a `.env` file in the root:

```
REACT_APP_GEMINI_API_KEY=your_google_ai_key_here
REACT_APP_SPORTS_API_KEY=your_data_provider_key
```

---

*Prepared by Sheena Engineering Team*

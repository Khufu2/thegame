
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

---

# 📰 **News Aggregation Plan (Bleacher Report Style)**

**Goal:** Transform Sheena Sports into the ultimate sports media platform with automated content aggregation from 50+ sources, rivaling Bleacher Report's dynamic news feed.

## 🎯 **Vision**
Create a comprehensive news ecosystem that automatically aggregates, processes, and publishes sports content from ESPN, SkySports, Twitter, and 50+ other sources - exactly like Bleacher Report's homepage with mixed content types (news, social, videos, highlights).

## 📊 **Current State**
- ✅ Manual news entry via CMS
- ✅ Basic news cards in feed
- ✅ Share functionality implemented
- ❌ No automated content aggregation
- ❌ Limited content variety (text only)

## 🚀 **Implementation Roadmap**

### **Phase 1: Foundation (1-2 weeks)**
#### **1.1 RSS Feed Integration**
- **Sources:** ESPN, SkySports, BBC Sport, The Athletic, Goal.com, Transfermarkt
- **Implementation:**
  ```typescript
  // services/newsAggregator/rssService.ts
  class RSSAggregator {
    async fetchFromESPN() { /* ESPN RSS parsing */ }
    async fetchFromSkySports() { /* SkySports RSS */ }
    async processFeed(feed: RSSFeed): NewsStory[] { /* Convert to our format */ }
  }
  ```
- **Frequency:** Every 5 minutes
- **Content Types:** News articles, transfer updates, injury reports

#### **1.2 Social Media Integration**
- **Twitter/X API:** Player accounts, team accounts, journalists
- **Instagram:** Highlights, stories (via scraping/API)
- **TikTok:** Viral sports content
- **Implementation:**
  ```typescript
  // services/newsAggregator/socialService.ts
  class SocialAggregator {
    async fetchTwitterTimeline(username: string) { /* Player/team tweets */ }
    async processTweet(tweet: Tweet): SocialPost { /* Convert to news format */ }
  }
  ```

#### **1.3 Basic Web Scraping**
- **Puppeteer Setup:** For sites without APIs
- **Targets:** BleacherReport, SportsIllustrated, local sports sites
- **Ethical Scraping:** Respect robots.txt, rate limiting, user-agent rotation

#### **1.4 Content Processing Pipeline**
- **AI Summarization:** Gemini API for content condensation
- **Deduplication:** Remove duplicate stories across sources
- **Categorization:** Auto-tag by sport, league, player, team
- **Sentiment Analysis:** Positive/negative story classification

### **Phase 2: Advanced Features (2-4 weeks)**
#### **2.1 Video Integration**
- **YouTube API:** Official highlights, press conferences
- **Twitch:** Live streams, esports content
- **Auto-embedding:** Video cards in feed with thumbnails

#### **2.2 Real-time Breaking News**
- **WebSocket Connections:** Live updates from major sources
- **Push Notifications:** Breaking news alerts
- **Live Blogging:** Real-time match commentary

#### **2.3 Content Enrichment**
- **Image Optimization:** Auto-resize, compress, alt-text generation
- **Player/Team Tagging:** Automatic entity recognition
- **Cross-linking:** Related stories, player profiles

#### **2.4 Interactive Content**
- **Polls:** "Who wins tonight?" style engagement
- **Live Reactions:** Real-time sentiment tracking
- **User-Generated Content:** Fan reactions, predictions

### **Phase 3: Intelligence Layer (4-6 weeks)**
#### **3.1 Trend Detection**
- **Viral Story Identification:** ML model for trending content
- **Engagement Prediction:** Which stories will perform well
- **Content Scoring:** Quality and relevance ranking

#### **3.2 Cross-platform Correlation**
- **Story Linking:** Connect related content across sources
- **Timeline Building:** Chronological event reconstruction
- **Context Enrichment:** Add background to breaking news

#### **3.3 Automated Publishing**
- **Smart Scheduling:** Optimal posting times
- **A/B Testing:** Content format optimization
- **Performance Analytics:** Engagement tracking

### **Phase 4: Monetization & Scale (6-8 weeks)**
#### **4.1 Premium Content**
- **Sponsored Stories:** Branded content integration
- **Exclusive Sources:** Paywalled content access
- **Early Access:** Breaking news for premium users

#### **4.2 Affiliate Integration**
- **Betting Links:** Relevant odds for stories
- **Merchandise:** Player/team store links
- **Ticket Sales:** Event ticket integration

## 🏗️ **Technical Architecture**

### **Core Components**
```typescript
// Main aggregator service
class NewsAggregator {
  private rssService: RSSService;
  private socialService: SocialService;
  private videoService: VideoService;
  private processingService: ContentProcessor;

  async aggregateAllSources(): Promise<NewsItem[]> {
    const [rssContent, socialContent, videos] = await Promise.all([
      this.rssService.fetchAll(),
      this.socialService.fetchAll(),
      this.videoService.fetchHighlights()
    ]);

    return this.processingService.processAndMerge([
      ...rssContent,
      ...socialContent,
      ...videos
    ]);
  }
}

// Content types
interface NewsItem {
  id: string;
  type: 'article' | 'social' | 'video' | 'highlight';
  title: string;
  content: string;
  source: string;
  author?: string;
  publishedAt: Date;
  tags: string[];
  entities: Entity[];
  sentiment: 'positive' | 'negative' | 'neutral';
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
}
```

### **Database Schema Extensions**
```sql
-- Enhanced news table
ALTER TABLE feeds ADD COLUMN (
  content_type VARCHAR(50) DEFAULT 'article',
  source_url TEXT,
  author_name VARCHAR(255),
  author_avatar TEXT,
  engagement_score INTEGER DEFAULT 0,
  sentiment VARCHAR(20) DEFAULT 'neutral',
  entities JSONB DEFAULT '[]',
  processed_at TIMESTAMP,
  auto_generated BOOLEAN DEFAULT false
);

-- Content relationships
CREATE TABLE content_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_content_id UUID REFERENCES feeds(id),
  related_content_id UUID REFERENCES feeds(id),
  relationship_type VARCHAR(50), -- 'followup', 'correction', 'related'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **API Endpoints Needed**
```typescript
// Aggregation endpoints
POST /api/news/aggregate - Trigger manual aggregation
GET /api/news/sources - List all configured sources
POST /api/news/sources - Add new source
DELETE /api/news/sources/:id - Remove source

// Content management
POST /api/news/process - Process raw content
GET /api/news/trending - Get trending stories
POST /api/news/boost - Manually boost story
```

## 📈 **Content Strategy**

### **Source Categories**
1. **Major Sports Networks:** ESPN, Fox Sports, NBC Sports
2. **League Official:** NFL.com, NBA.com, Premier League
3. **News Agencies:** AP, Reuters, AFP
4. **Social Influencers:** Player accounts, analyst accounts
5. **Fan Communities:** Reddit, Discord, forums
6. **Local Sources:** Regional sports coverage

### **Content Types Priority**
1. **Breaking News:** Scores, injuries, trades (Highest priority)
2. **Analysis:** Game previews, player profiles
3. **Highlights:** Video content, photo galleries
4. **Social Content:** Fan reactions, player posts
5. **Long-form:** In-depth features, investigations

### **Quality Control**
- **Automated Filtering:** Remove low-quality/spam content
- **Source Credibility Scoring:** Weight by source reputation
- **Fact Checking:** Cross-reference major stories
- **Duplicate Detection:** Advanced deduplication algorithms

## 🎯 **Success Metrics**
- **Content Volume:** 500+ stories per day
- **Engagement Rate:** 15%+ click-through rate
- **Freshness:** 95% of content < 30 minutes old
- **Source Diversity:** Content from 50+ sources
- **User Retention:** 40%+ daily active users

## 🚀 **Go-Live Plan**
1. **Week 1:** RSS feeds from 10 major sources
2. **Week 2:** Social media integration (Twitter)
3. **Week 3:** Video content and image optimization
4. **Week 4:** Real-time updates and push notifications
5. **Week 5:** Advanced processing and trend detection
6. **Week 6:** Full automation and monitoring

## 💰 **Cost Analysis**
- **APIs:** $50-200/month (RSS free, social media APIs)
- **Infrastructure:** $20-50/month (additional server capacity)
- **Storage:** $5-15/month (images, videos)
- **Total:** $75-265/month for full automation

## 🔧 **Implementation Priority**
1. **Start with RSS feeds** (easiest, highest impact)
2. **Add social media** (viral content potential)
3. **Implement video** (engagement boost)
4. **Build intelligence layer** (content quality)
5. **Add monetization** (revenue generation)

**Ready to implement Phase 1? Let's start with RSS aggregation from ESPN and SkySports!** 🚀

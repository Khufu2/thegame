
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Feed } from './components/Feed';
import { Pweza } from './components/Pweza';
import { Match, NewsStory, MatchStatus } from './types';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

const generateMockData = () => {
  const matches: Match[] = [
    {
      id: 'm1',
      league: 'PREMIER LEAGUE',
      homeTeam: { 
          id: 't1', 
          name: 'Arsenal', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
          form: ['W', 'W', 'D', 'W', 'L'] 
      },
      awayTeam: { 
          id: 't2', 
          name: 'Liverpool', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
          form: ['W', 'W', 'W', 'D', 'W'] 
      },
      status: MatchStatus.LIVE,
      time: "67'",
      score: { home: 2, away: 1 },
      prediction: {
        outcome: 'HOME',
        confidence: 78,
        scorePrediction: '2-1',
        aiReasoning: 'Arsenal dominating midfield battles (64% poss). Liverpool struggling to create without Trent on the right flank.',
        keyInsight: 'Arsenal to Win & BTTS',
        xG: { home: 2.15, away: 0.88 },
        weather: 'Rain 12°C',
        sentiment: 'POSITIVE',
        injuries: ['Trent AA', 'Alisson']
      }
    },
    {
      id: 'm2',
      league: 'NBA',
      homeTeam: { 
          id: 't3', 
          name: 'Lakers', 
          logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg',
          form: ['L', 'W', 'L', 'L', 'W']
      },
      awayTeam: { 
          id: 't4', 
          name: 'Warriors', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg',
          form: ['W', 'W', 'W', 'L', 'W']
      },
      status: MatchStatus.SCHEDULED,
      time: '8:00 PM',
      prediction: {
        outcome: 'AWAY',
        confidence: 62,
        scorePrediction: '118-112',
        aiReasoning: 'Curry averaging 34pts in last 5. Lakers drop coverage will be exploited. James questionable.',
        keyInsight: 'Over 224.5 Pts',
        xG: { home: 110, away: 118 }, // Projected points in this context
        weather: 'Indoors',
        sentiment: 'NEUTRAL',
        injuries: ['LeBron (GTD)']
      }
    },
    {
      id: 'm3',
      league: 'NFL',
      homeTeam: { 
          id: 't5', 
          name: 'Chiefs', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/e/e1/Kansas_City_Chiefs_logo.svg',
          form: ['W', 'W', 'W', 'W', 'W'] 
      },
      awayTeam: { 
          id: 't6', 
          name: 'Bills', 
          logo: 'https://upload.wikimedia.org/wikipedia/en/7/77/Buffalo_Bills_logo.svg',
          form: ['W', 'L', 'W', 'W', 'D'] 
      },
      status: MatchStatus.SCHEDULED,
      time: 'Sun 4:25',
      score: { home: 0, away: 0},
      prediction: {
        outcome: 'HOME',
        confidence: 55,
        scorePrediction: '27-24',
        aiReasoning: 'Mahomes at home in playoffs is statistically nearly unbeatable. Allen turnover prone in cold weather.',
        keyInsight: 'Chiefs Moneyline',
        xG: { home: 27, away: 24 },
        weather: 'Snow -4°C',
        sentiment: 'POSITIVE',
        injuries: []
      }
    }
  ];

  const news: NewsStory[] = [
    {
      id: 'n1',
      type: 'NEWS',
      title: "Mbappé 'Frustrated' With Ancelotti, Considering Shock Summer Exit",
      summary: "Tensions rise in Madrid as sources claim the French superstar is unhappy with his central role and lack of freedom.",
      imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop",
      source: "B/R Football",
      timestamp: "10m ago",
      likes: 15400,
      comments: 3420,
      isHero: true
    },
    {
      id: 'h1',
      type: 'HIGHLIGHT',
      title: "EDWARDS POSTERIZES WEMBY!",
      summary: "Dunk of the year candidate in Minnesota as Ant Man rises up.",
      imageUrl: "https://images.unsplash.com/photo-1519861531473-9200263931a2?q=80&w=1000&auto=format&fit=crop",
      source: "Hoops Central",
      timestamp: "1h ago",
      likes: 8400,
      comments: 890
    },
    {
      id: 'n3',
      type: 'NEWS',
      title: "Cowboys Owner Jerry Jones Hospitalized as Precaution",
      summary: "Team releases statement saying Jones is in stable condition after minor incident at training facility.",
      imageUrl: "https://images.unsplash.com/photo-1628779238951-be2c9f2a0791?q=80&w=1000&auto=format&fit=crop",
      source: "B/R Gridiron",
      timestamp: "2h ago",
      likes: 2100,
      comments: 540
    }
  ];

  return { matches, news };
};

const AppContent = () => {
  const [isPwezaOpen, setIsPwezaOpen] = useState(false);
  const [feedItems, setFeedItems] = useState<(Match | NewsStory)[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { matches, news } = generateMockData();
    setMatches(matches);
    // Interleave content for a rich feed feel
    setFeedItems([news[0], matches[0], news[1], matches[1], news[2], matches[2]]);
  }, []);

  const currentPage = location.pathname === '/' ? 'home' : location.pathname.replace('/', '');

  return (
    <Layout 
      currentPage={currentPage} 
      onNavigate={(page) => navigate(page === 'home' ? '/' : `/${page}`)}
      onOpenPweza={() => setIsPwezaOpen(true)}
    >
      <Routes>
        <Route path="/" element={<Feed items={feedItems} matches={matches} />} />
        <Route path="/scores" element={<Feed items={matches} matches={matches} />} />
        <Route path="/trending" element={<Feed items={feedItems.filter(i => 'type' in i)} matches={matches} />} />
        <Route path="*" element={<div className="p-20 text-center text-br-muted font-condensed font-bold text-xl">COMING SOON</div>} />
      </Routes>

      <Pweza isOpen={isPwezaOpen} onClose={() => setIsPwezaOpen(false)} />
    </Layout>
  );
};

const App = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;


import React from 'react';
import { Layout } from './components/Layout';
import { Feed } from './components/Feed';
import { Pweza } from './components/Pweza';
import { ArticlePage } from './components/ArticlePage';
import { MatchDetailPage } from './components/MatchDetailPage';
import { ScoresPage } from './components/ScoresPage';
import { BetSlipPage } from './components/BetSlipPage';
import { ProfilePage } from './components/ProfilePage';
import { AuthPage } from './components/AuthPage';
import { Onboarding } from './components/Onboarding';
import { ExplorePage } from './components/ExplorePage'; 
import { AdminPage } from './components/AdminPage';
import { SportsProvider, useSports } from './context/SportsContext';
import { HashRouter, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';

const AppContent = () => {
  const { 
      authState, 
      user, 
      matches, 
      news, 
      feedItems, 
      betSlip, 
      addToSlip, 
      removeFromSlip, 
      clearSlip, 
      addRandomPick, 
      isPwezaOpen, 
      setIsPwezaOpen 
  } = useSports();
  
  const navigate = useNavigate();
  const location = useLocation();

  if (authState === 'UNAUTHENTICATED') {
      return <AuthPage />;
  }

  if (authState === 'ONBOARDING') {
      return <Onboarding />;
  }

  const currentPage = location.pathname === '/' ? 'home' : location.pathname.replace('/', '');

  const ArticleRouteWrapper = () => {
      const { id } = useParams();
      const story = news.find(n => n.id === id);
      if (!story) return <div className="p-20 text-center text-white">Story not found</div>;
      
      const related = news.filter(n => n.id !== id).slice(0, 2);
      return <ArticlePage story={story} relatedStories={related} />;
  }

  const handleOpenPweza = (prompt?: string) => {
      setIsPwezaOpen(true, prompt);
  };

  const MatchRouteWrapper = () => {
      const { id } = useParams();
      const match = matches.find(m => m.id === id);
      if (!match) return <div className="p-20 text-center text-white">Match not found</div>;
      
      return <MatchDetailPage match={match} onOpenPweza={handleOpenPweza} onAddToSlip={() => addToSlip(match)} />;
  }

  const handleTailBet = (matchId: string) => {
      const match = matches.find(m => m.id === matchId);
      if (match) {
          addToSlip(match);
          navigate('/slip');
      }
  };

  return (
    <Layout 
      currentPage={currentPage} 
      onNavigate={(page) => navigate(page === 'home' ? '/' : `/${page}`)}
      onOpenPweza={() => handleOpenPweza()}
    >
      <Routes>
        <Route path="/" element={<Feed items={feedItems} matches={matches} onArticleClick={(id) => navigate(`/article/${id}`)} onOpenPweza={handleOpenPweza} onTailBet={handleTailBet} />} />
        <Route path="/scores" element={<ScoresPage matches={matches} onOpenPweza={handleOpenPweza} />} />
        <Route path="/slip" element={
            <BetSlipPage 
                slipItems={betSlip} 
                onRemoveItem={removeFromSlip} 
                onClearSlip={clearSlip} 
                matches={matches}
                onAddRandomPick={addRandomPick}
                onOpenPweza={() => handleOpenPweza()}
            />
        } />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/profile" element={user ? <ProfilePage user={user} betHistory={betSlip} /> : null} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/article/:id" element={<ArticleRouteWrapper />} />
        <Route path="/match/:id" element={<MatchRouteWrapper />} />
        <Route path="*" element={<div className="p-20 text-center text-[#A1A1A1] font-condensed font-bold text-xl">COMING SOON</div>} />
      </Routes>

      <Pweza isOpen={isPwezaOpen} onClose={() => setIsPwezaOpen(false)} />
    </Layout>
  );
};

const App = () => {
  return (
    <SportsProvider>
        <HashRouter>
            <AppContent />
        </HashRouter>
    </SportsProvider>
  );
};

export default App;

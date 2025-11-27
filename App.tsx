
import React, { useEffect, PropsWithChildren } from 'react';
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
import { LeaderboardPage } from './components/LeaderboardPage';
import { SettingsPage } from './components/SettingsPage';
import { SourceProfilePage } from './components/SourceProfilePage'; // NEW
import { SportsProvider, useSports } from './context/SportsContext';
import { HashRouter, Routes, Route, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';

// Utility to scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Protected Route Wrapper for Guest Handling
const ProtectedRoute = ({ children, guestAllowed = false }: PropsWithChildren<{ guestAllowed?: boolean }>) => {
    const { authState, user } = useSports();
    
    // If not authenticated and not a guest, redirect to Auth
    if (authState === 'UNAUTHENTICATED') {
        return <Navigate to="/" replace />;
    }

    // If Guest trying to access protected route
    if (authState === 'GUEST' && !guestAllowed) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

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
      setIsPwezaOpen,
      logout // Needed to reset from Guest to Auth
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
      
      const handleAdd = () => {
          if (!user) {
              alert("Sign up to create bet slips!");
              return;
          }
          addToSlip(match);
      }
      
      return <MatchDetailPage match={match} onOpenPweza={handleOpenPweza} onAddToSlip={handleAdd} />;
  }

  const handleTailBet = (matchId: string) => {
      if (!user) {
          if (confirm("Sign up to tail bets instantly!")) {
              logout(); // Force back to Auth
          }
          return;
      }
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
      <ScrollToTop />
      <Routes>
        {/* PUBLIC / GUEST ALLOWED ROUTES */}
        <Route path="/" element={<Feed items={feedItems} matches={matches} onArticleClick={(id) => navigate(`/article/${id}`)} onOpenPweza={handleOpenPweza} onTailBet={handleTailBet} />} />
        <Route path="/scores" element={<ScoresPage matches={matches} onOpenPweza={handleOpenPweza} />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/article/:id" element={<ArticleRouteWrapper />} />
        <Route path="/match/:id" element={<MatchRouteWrapper />} />
        <Route path="/source/:id" element={<SourceProfilePage />} />

        {/* PROTECTED ROUTES (Require Login) */}
        <Route path="/slip" element={
            <ProtectedRoute>
                <BetSlipPage 
                    slipItems={betSlip} 
                    onRemoveItem={removeFromSlip} 
                    onClearSlip={clearSlip} 
                    matches={matches}
                    onAddRandomPick={addRandomPick}
                    onOpenPweza={() => handleOpenPweza()}
                />
            </ProtectedRoute>
        } />
        <Route path="/profile" element={
            <ProtectedRoute>
                {user ? <ProfilePage user={user} betHistory={betSlip} /> : <></>}
            </ProtectedRoute>
        } />
        <Route path="/admin" element={
            <ProtectedRoute>
                <AdminPage />
            </ProtectedRoute>
        } />
        <Route path="/leaderboard" element={
             // Leaderboard visible to guests, but maybe limited? Allowing for now.
             <LeaderboardPage />
        } />
        <Route path="/settings" element={
             <ProtectedRoute>
                <SettingsPage />
             </ProtectedRoute>
        } />
        
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

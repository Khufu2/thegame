
import React from 'react';
import { Home, Search, Zap, User, Ticket, Zap as ZapIcon, TrendingUp, Goal, Trophy, Bell } from 'lucide-react';
import { useSports } from '../context/SportsContext';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenPweza: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate, onOpenPweza }) => {
  const { flashAlert } = useSports();

  return (
    <div className="min-h-screen bg-[#F2F2F2] md:bg-black text-black md:text-white font-sans flex flex-col md:flex-row">
      
      {/* FLASH ALERT TOAST */}
      {flashAlert && (
          <div className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[400px] z-[100] animate-in slide-in-from-top duration-300">
              <div className="bg-black/90 backdrop-blur-xl text-white p-4 rounded-xl border border-white/10 shadow-2xl flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${flashAlert.type === 'MOMENTUM' ? 'bg-red-600 animate-pulse' : flashAlert.type === 'GOAL' ? 'bg-[#00FFB2]' : 'bg-indigo-600'}`}>
                      {flashAlert.type === 'MOMENTUM' && <ZapIcon size={20} fill="currentColor" />}
                      {flashAlert.type === 'VALUE' && <TrendingUp size={20} />}
                      {flashAlert.type === 'GOAL' && <Goal size={20} />}
                  </div>
                  <div>
                      <h4 className="font-condensed font-black text-sm uppercase tracking-wide">
                          {flashAlert.type === 'MOMENTUM' ? 'Momentum Shift' : flashAlert.type === 'GOAL' ? 'Goal Alert' : 'Value Detected'}
                      </h4>
                      <p className="text-xs font-medium text-gray-200">{flashAlert.message}</p>
                  </div>
              </div>
          </div>
      )}

      {/* DESKTOP SIDEBAR (New "Glass Tech" Design) */}
      <aside className="hidden md:flex flex-col w-[260px] h-screen fixed left-0 top-0 border-r border-white/5 bg-black/40 backdrop-blur-xl z-50">
        <div className="p-8 flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
           {/* Modern Logo */}
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <span className="font-black text-white text-xl">S</span>
          </div>
          <h1 className="font-sans font-black text-2xl tracking-tight text-white">SHEENA</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <SidebarLink icon={<Home size={20} />} label="Home Feed" active={currentPage === 'home'} onClick={() => onNavigate('home')} />
          <SidebarLink icon={<Search size={20} />} label="Explore" active={currentPage === 'explore'} onClick={() => onNavigate('explore')} />
          <SidebarLink icon={<Zap size={20} />} label="Live Scores" active={currentPage === 'scores'} onClick={() => onNavigate('scores')} />
          <SidebarLink icon={<Ticket size={20} />} label="My Slip" active={currentPage === 'slip'} onClick={() => onNavigate('slip')} />
          <SidebarLink icon={<Trophy size={20} />} label="Leaderboard" active={currentPage === 'leaderboard'} onClick={() => onNavigate('leaderboard')} />
          <SidebarLink icon={<User size={20} />} label="Profile" active={currentPage === 'profile'} onClick={() => onNavigate('profile')} />
          <SidebarLink icon={<Bell size={20} />} label="Notifications" active={currentPage === 'notifications'} onClick={() => onNavigate('notifications')} />
          
          <div className="my-8 border-t border-white/10"></div>
          <div className="px-4 mb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Following</div>
          <TeamRow name="Arsenal" />
          <TeamRow name="Lakers" />
          <TeamRow name="Real Madrid" />
        </nav>

        <div className="p-6">
            <button onClick={onOpenPweza} className="group w-full bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold text-sm uppercase py-3.5 rounded-xl shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] border border-white/10">
                <span className="text-xl group-hover:rotate-12 transition-transform">🐙</span>
                Ask Pweza
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-[260px] min-h-screen relative pb-[70px] md:pb-0">
        
        {/* MOBILE HEADER - Compact (44px standard iOS) */}
        <header className="md:hidden sticky top-0 z-50 bg-[#F2F2F2]/95 backdrop-blur-xl h-[44px] flex items-center justify-between px-4 border-b border-gray-200/50 shadow-sm">
            <div className="flex items-center gap-2">
                <span className="font-condensed font-black text-xl tracking-tighter text-black uppercase italic leading-none pt-1">Sheena</span>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={() => onNavigate('notifications')} className="text-black/60 hover:text-black transition-colors">
                    <Bell size={20} />
                </button>
                <button onClick={onOpenPweza} className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 active:scale-95 transition-transform">
                    <span className="text-lg">🐙</span>
                </button>
            </div>
        </header>

        {children}
      </main>

      {/* MOBILE BOTTOM NAV - 5 Items */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-white/90 backdrop-blur-2xl border-t border-gray-200/50 z-50 flex items-center justify-around px-2 pb-safe shadow-[0_-5px_30px_rgba(0,0,0,0.02)]">
         <NavTab icon={<Home />} label="Home" active={currentPage === 'home'} onClick={() => onNavigate('home')} />
         <NavTab icon={<Search />} label="Explore" active={currentPage === 'explore'} onClick={() => onNavigate('explore')} />
         <NavTab icon={<Zap />} label="Matches" active={currentPage === 'scores'} onClick={() => onNavigate('scores')} />
         <NavTab icon={<Ticket />} label="Slip" active={currentPage === 'slip'} onClick={() => onNavigate('slip')} />
         <NavTab icon={<User />} label="Profile" active={currentPage === 'profile'} onClick={() => onNavigate('profile')} />
      </nav>

    </div>
  );
};

const SidebarLink = ({ icon, label, active, onClick }: any) => (
    <div 
        onClick={onClick} 
        className={`
            flex items-center gap-3 px-4 py-3 mx-2 rounded-lg cursor-pointer transition-all duration-200 group
            ${active 
                ? 'bg-indigo-600/10 text-[#00FFB2] border border-indigo-500/30 shadow-[0_0_15px_rgba(0,255,178,0.05)]' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }
        `}
    >
        <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
        <span className={`font-sans text-sm font-bold tracking-wide ${active ? 'text-white' : ''}`}>{label}</span>
    </div>
);

const TeamRow = ({ name }: { name: string }) => (
    <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 cursor-pointer rounded-lg mx-2 transition-colors group">
        <div className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors flex items-center justify-center text-[10px] font-bold text-gray-500">
            {name[0]}
        </div>
        <span className="font-sans font-medium text-sm text-gray-400 group-hover:text-white transition-colors">{name}</span>
    </div>
);

const NavTab = ({ icon, label, active, onClick }: any) => (
    <div onClick={onClick} className="flex flex-col items-center justify-center gap-1 cursor-pointer w-14 pt-1">
        <div className={`${active ? 'text-indigo-600 transform scale-110' : 'text-gray-400'} transition-all duration-200`}>
            {React.cloneElement(icon, { size: 22, strokeWidth: active ? 2.5 : 2, fill: active ? "currentColor" : "none", fillOpacity: 0.1 })}
        </div>
        <span className={`text-[9px] font-bold tracking-tight uppercase ${active ? 'text-indigo-600' : 'text-gray-400'}`}>{label}</span>
    </div>
);

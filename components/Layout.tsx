

import React from 'react';
import { Home, Search, Zap, User, Ticket, Zap as ZapIcon, TrendingUp, Goal } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F2F2F2] md:bg-br-bg text-black md:text-white font-sans flex flex-col md:flex-row">
      
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

      {/* DESKTOP SIDEBAR (Hidden on Mobile) */}
      <aside className="hidden md:flex flex-col w-[280px] h-screen fixed left-0 top-0 border-r border-br-border bg-br-bg z-50">
        <div className="p-6 flex items-center gap-3 cursor-pointer border-b border-br-border/50" onClick={() => onNavigate('home')}>
          <div className="w-10 h-10 bg-white flex items-center justify-center rounded shadow-lg">
            <span className="font-condensed font-black text-black text-2xl italic tracking-tighter">BR</span>
          </div>
          <h1 className="font-condensed font-black text-3xl italic tracking-tighter text-white">SHEENA</h1>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <SidebarLink icon={<Home size={20} />} label="Home" active={currentPage === 'home'} onClick={() => onNavigate('home')} />
          <SidebarLink icon={<Search size={20} />} label="Explore" active={currentPage === 'explore'} onClick={() => onNavigate('explore')} />
          <SidebarLink icon={<Zap size={20} />} label="Matches" active={currentPage === 'scores'} onClick={() => onNavigate('scores')} />
          <SidebarLink icon={<Ticket size={20} />} label="Slip" active={currentPage === 'slip'} onClick={() => onNavigate('slip')} />
          <SidebarLink icon={<User size={20} />} label="Profile" active={currentPage === 'profile'} onClick={() => onNavigate('profile')} />
          
          <div className="my-6 border-t border-br-border/50"></div>
          <div className="px-4 mb-2 text-xs font-bold text-br-muted uppercase tracking-widest">My Teams</div>
          <TeamRow name="Arsenal" />
          <TeamRow name="Lakers" />
          <TeamRow name="Real Madrid" />
        </nav>

        <div className="p-4 border-t border-br-border">
            <button onClick={onOpenPweza} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-condensed font-bold text-lg uppercase py-3 rounded flex items-center justify-center gap-2 transition-colors">
                <span className="text-xl">🐙</span>
                Ask Pweza
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-[280px] min-h-screen relative pb-[70px] md:pb-0">
        
        {/* MOBILE HEADER - Compact (44px standard iOS) */}
        <header className="md:hidden sticky top-0 z-50 bg-[#F2F2F2]/95 backdrop-blur-xl h-[44px] flex items-center justify-between px-4 border-b border-gray-200/50 shadow-sm">
            <div className="flex items-center gap-2">
                <span className="font-condensed font-black text-xl tracking-tighter text-black uppercase italic leading-none pt-1">Sheena</span>
            </div>
            <div className="flex items-center gap-3">
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
    <div onClick={onClick} className={`flex items-center gap-4 px-4 py-3 rounded cursor-pointer transition-colors ${active ? 'bg-br-surface text-white' : 'text-br-muted hover:bg-br-surface/50 hover:text-white'}`}>
        <span className={active ? 'text-white' : 'text-br-muted'}>{icon}</span>
        <span className="font-condensed font-bold text-lg uppercase tracking-wide">{label}</span>
    </div>
);

const TeamRow = ({ name }: { name: string }) => (
    <div className="flex items-center gap-3 px-4 py-2 hover:bg-br-surface/50 cursor-pointer rounded">
        <div className="w-6 h-6 rounded-full bg-white/10"></div>
        <span className="font-condensed font-medium text-lg text-br-muted hover:text-white">{name}</span>
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
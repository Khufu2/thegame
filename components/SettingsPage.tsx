import React from 'react';
import { useSports } from '../context/SportsContext';
import { ArrowLeft, Bell, Globe, Shield, Moon, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const { user, updatePreferences } = useSports();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans">
        
        {/* HEADER */}
        <div className="sticky top-0 z-40 bg-[#121212] border-b border-[#2C2C2C] px-4 h-[60px] flex items-center gap-4">
             <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-[#1E1E1E] rounded-full transition-colors">
                 <ArrowLeft size={24} className="text-gray-400" />
             </button>
             <span className="font-condensed font-black text-xl uppercase italic tracking-tighter">Settings</span>
        </div>

        <div className="max-w-[600px] mx-auto p-4 space-y-6">
             
             {/* SECTION: PREFERENCES */}
             <section>
                 <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 ml-2">Localization</h3>
                 <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl overflow-hidden">
                     
                     <div className="p-4 border-b border-[#2C2C2C] flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <Globe size={18} className="text-indigo-500" />
                             <div>
                                 <span className="block font-bold text-sm text-white">Odds Format</span>
                                 <span className="text-xs text-gray-500">How betting odds are displayed</span>
                             </div>
                         </div>
                         <div className="flex bg-black rounded p-1">
                             <button 
                                onClick={() => updatePreferences({ oddsFormat: 'DECIMAL' })}
                                className={`px-3 py-1 text-xs font-bold rounded ${user.preferences.oddsFormat === 'DECIMAL' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}
                             >
                                 2.50
                             </button>
                             <button 
                                onClick={() => updatePreferences({ oddsFormat: 'AMERICAN' })}
                                className={`px-3 py-1 text-xs font-bold rounded ${user.preferences.oddsFormat === 'AMERICAN' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}
                             >
                                 +150
                             </button>
                         </div>
                     </div>

                 </div>
             </section>

             {/* SECTION: NOTIFICATIONS */}
             <section>
                 <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 ml-2">Notifications</h3>
                 <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl overflow-hidden">
                     
                     <ToggleRow 
                        label="Game Start Alerts" 
                        description="Get notified when your teams kick off"
                        active={user.preferences.notifications.gameStart}
                        onToggle={() => updatePreferences({ notifications: { ...user.preferences.notifications, gameStart: !user.preferences.notifications.gameStart } })}
                     />
                     <ToggleRow 
                        label="Score Updates" 
                        description="Live score notifications"
                        active={user.preferences.notifications.scoreUpdates}
                        onToggle={() => updatePreferences({ notifications: { ...user.preferences.notifications, scoreUpdates: !user.preferences.notifications.scoreUpdates } })}
                     />
                     <ToggleRow 
                        label="Sharp Money Alerts" 
                        description="War Room intel and line moves"
                        active={user.preferences.notifications.lineMoves}
                        onToggle={() => updatePreferences({ notifications: { ...user.preferences.notifications, lineMoves: !user.preferences.notifications.lineMoves } })}
                     />

                 </div>
             </section>

             {/* SECTION: APPEARANCE */}
             <section>
                 <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 ml-2">Appearance</h3>
                 <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl overflow-hidden">
                     <div className="p-4 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <Moon size={18} className="text-gray-400" />
                             <span className="font-bold text-sm text-white">Theme</span>
                         </div>
                         <span className="text-xs font-bold text-gray-500 uppercase">Dark Mode (Default)</span>
                     </div>
                 </div>
             </section>

        </div>

    </div>
  );
};

const ToggleRow = ({ label, description, active, onToggle }: any) => (
    <div className="p-4 border-b border-[#2C2C2C] last:border-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Bell size={18} className="text-gray-400" />
            <div>
                <span className="block font-bold text-sm text-white">{label}</span>
                <span className="text-xs text-gray-500">{description}</span>
            </div>
        </div>
        <button 
            onClick={onToggle}
            className={`w-12 h-6 rounded-full relative transition-colors ${active ? 'bg-indigo-600' : 'bg-gray-700'}`}
        >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${active ? 'left-7' : 'left-1'}`}></div>
        </button>
    </div>
);
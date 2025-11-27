
import React, { useState } from 'react';
import { useSports } from '../context/SportsContext';
import { ArrowLeft, Bell, Globe, Shield, Moon, Monitor, MessageCircle, Mail, WifiOff, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const { user, updatePreferences } = useSports();
  const navigate = useNavigate();
  const [waNumber, setWaNumber] = useState(user?.preferences.whatsappNumber || '');

  if (!user) return null;

  const saveWaNumber = () => {
      updatePreferences({ whatsappNumber: waNumber });
      alert("WhatsApp Number Saved!");
  }

  const toggleTheme = () => {
      const newTheme = user.preferences.theme === 'DARK' ? 'LIGHT' : 'DARK';
      updatePreferences({ theme: newTheme });
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans">
        
        {/* HEADER */}
        <div className="sticky top-0 z-40 bg-[#121212] border-b border-[#2C2C2C] px-4 h-[60px] flex items-center gap-4">
             <button onClick={() => navigate('/profile')} className="p-2 -ml-2 hover:bg-[#1E1E1E] rounded-full transition-colors">
                 <ArrowLeft size={24} className="text-gray-400" />
             </button>
             <span className="font-condensed font-black text-xl uppercase italic tracking-tighter">Settings</span>
        </div>

        <div className="max-w-[600px] mx-auto p-4 space-y-6">
             
             {/* SECTION: COMMUNICATION */}
             <section>
                 <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 ml-2">Communication Preferences</h3>
                 <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl overflow-hidden p-4 space-y-4">
                     
                     {/* Channel Selector */}
                     <div>
                         <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Preferred Channel</label>
                         <div className="grid grid-cols-3 gap-2">
                             {['EMAIL', 'WHATSAPP', 'BOTH'].map((channel) => (
                                 <button
                                    key={channel}
                                    onClick={() => updatePreferences({ communicationChannel: channel as any })}
                                    className={`py-2 rounded font-bold text-xs uppercase border transition-all ${user.preferences.communicationChannel === channel ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-black text-gray-500 border-[#333]'}`}
                                 >
                                     {channel}
                                 </button>
                             ))}
                         </div>
                     </div>

                     {/* WhatsApp Number Input */}
                     {(user.preferences.communicationChannel === 'WHATSAPP' || user.preferences.communicationChannel === 'BOTH') && (
                         <div className="animate-in fade-in">
                             <label className="block text-xs font-bold text-gray-400 uppercase mb-2">WhatsApp Number</label>
                             <div className="flex gap-2">
                                 <div className="relative flex-1">
                                     <MessageCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
                                     <input 
                                         type="tel"
                                         value={waNumber}
                                         onChange={(e) => setWaNumber(e.target.value)}
                                         placeholder="+1 234 567 890"
                                         className="w-full bg-black border border-[#333] rounded py-2 pl-9 pr-4 text-sm text-white focus:border-green-500 outline-none"
                                     />
                                 </div>
                                 <button onClick={saveWaNumber} className="bg-white text-black text-xs font-black uppercase px-4 rounded hover:bg-gray-200">Save</button>
                             </div>
                             <p className="text-[10px] text-gray-500 mt-2">
                                 We will send "Sheena's Daily Locks" and "Live Momentum" alerts to this number.
                             </p>
                         </div>
                     )}

                 </div>
             </section>

             {/* SECTION: PERFORMANCE & DATA */}
             <section>
                 <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 ml-2">Data & Storage</h3>
                 <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl overflow-hidden">
                     <ToggleRow 
                        label="Data Saver Mode" 
                        description="Hide images & heavy graphics (Save MBs)"
                        icon={<WifiOff size={18} />}
                        active={user.preferences.dataSaver}
                        onToggle={() => updatePreferences({ dataSaver: !user.preferences.dataSaver })}
                     />
                 </div>
             </section>

             {/* SECTION: LOCALIZATION */}
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

             {/* SECTION: APPEARANCE */}
             <section>
                 <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 ml-2">Appearance</h3>
                 <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl overflow-hidden">
                     <div className="p-4 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             {user.preferences.theme === 'DARK' ? <Moon size={18} className="text-gray-400" /> : <Sun size={18} className="text-yellow-500" />}
                             <div>
                                 <span className="block font-bold text-sm text-white">App Theme</span>
                                 <span className="text-xs text-gray-500">{user.preferences.theme === 'DARK' ? 'Dark Mode' : 'Light Mode'}</span>
                             </div>
                         </div>
                         <button 
                            onClick={toggleTheme}
                            className={`w-12 h-6 rounded-full relative transition-colors ${user.preferences.theme === 'DARK' ? 'bg-indigo-600' : 'bg-gray-500'}`}
                         >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${user.preferences.theme === 'DARK' ? 'left-7' : 'left-1'}`}></div>
                         </button>
                     </div>
                 </div>
             </section>

        </div>

    </div>
  );
};

const ToggleRow = ({ label, description, icon, active, onToggle }: any) => (
    <div className="p-4 border-b border-[#2C2C2C] last:border-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
            {icon ? React.cloneElement(icon, { className: "text-gray-400" }) : <Bell size={18} className="text-gray-400" />}
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

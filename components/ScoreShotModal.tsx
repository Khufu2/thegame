
import React from 'react';
import { Match, MatchStatus } from '../types';
import { X, Download, Share2, Instagram, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ScoreShotModalProps {
    match: Match;
    onClose: () => void;
}

export const ScoreShotModal: React.FC<ScoreShotModalProps> = ({ match, onClose }) => {
    
    const handleDownload = async () => {
        try {
            const element = document.getElementById('scoreshot-canvas');
            if (!element) {
                alert("Canvas element not found");
                return;
            }

            // Wait for images to load
            const images = element.querySelectorAll('img');
            const imagePromises = Array.from(images).map(img => {
                return new Promise((resolve, reject) => {
                    if (img.complete) {
                        resolve(true);
                    } else {
                        img.onload = () => resolve(true);
                        img.onerror = () => {
                            // If image fails to load, replace with a placeholder
                            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzMzMzMzMiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMkMxMy4xIDEyIDE0IDExLjEgMTQgMTBDMTQgOC45IDEzLjEgOCA4IDhDNi45IDggNiA4LjkgNiAxMEM2IDExLjEgNi45IDEyIDEyIDEyWk0xMiAxNUMxMy4xIDE1IDE0IDE0LjEgMTQgMTMuNWMwLS41NS0uNDUtMS0xLTEuNUM4LjQ1IDEyLjUgOCA5IDguNDUgOSA5IDlDOS41NSA5LjQ1IDEwIDlDMTAgOS41NSAxMC40NSAxMCAxMSAxMEMxMS41NSAxMC41IDEyIDExLjUgMTIgMTVaIiBmaWxsPSIjNjY2NjY2Ii8+Cjwvc3ZnPgo8L3N2Zz4=';
                            resolve(true);
                        };
                    }
                });
            });

            // Wait for all images to load
            await Promise.all(imagePromises);

            // Small delay to ensure rendering is complete
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(element, {
                backgroundColor: '#000000',
                scale: 2, // Higher resolution
                useCORS: true,
                allowTaint: true, // Allow images from different domains
                width: element.offsetWidth,
                height: element.offsetHeight,
                logging: false
            });

            const data = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = data;
            link.download = `sheena-pick-${match.homeTeam.name}-vs-${match.awayTeam.name}.png`;
            link.click();
        } catch (error) {
            console.error('Error generating image:', error);
            alert("Failed to generate image. Please try again.");
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Sheena's Pick: ${match.homeTeam.name} vs ${match.awayTeam.name}`,
                    text: `My prediction for the big game! Powered by Sheena Sports.`,
                    url: window.location.href
                });
            } catch (err) { console.error(err); }
        } else {
            alert("Sharing not supported on this browser. Screenshot to share!");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
            <div className="w-full max-w-[400px] flex flex-col gap-4">
                
                {/* HEADER */}
                <div className="flex items-center justify-between text-white">
                    <h3 className="font-condensed font-black text-xl uppercase italic">ScoreShot Generator</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
                </div>

                {/* THE GRAPHIC CANVAS (Visual Representation) */}
                <div id="scoreshot-canvas" className="aspect-[4/5] w-full bg-gradient-to-br from-[#1a1a1a] to-black border-4 border-white rounded-xl relative overflow-hidden flex flex-col shadow-2xl">
                    
                    {/* Background Texture */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/20 blur-[100px] rounded-full"></div>

                    {/* Branding Top */}
                    <div className="p-6 flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-black italic text-white">S</div>
                            <span className="font-condensed font-black text-xl uppercase tracking-tighter text-white">SHEENA</span>
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{match.league}</span>
                    </div>

                    {/* Matchup Center */}
                    <div className="flex-1 flex flex-col items-center justify-center relative z-10 gap-6">
                        
                        <div className="flex items-center justify-center gap-6 w-full px-4">
                             <div className="flex flex-col items-center gap-2">
                                 <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                                     <img
                                         src={match.homeTeam.logo}
                                         className="w-16 h-16 object-contain drop-shadow-lg"
                                         onError={(e) => {
                                             const target = e.target as HTMLImageElement;
                                             target.style.display = 'none';
                                             const parent = target.parentElement;
                                             if (parent) {
                                                 const fallback = document.createElement('div');
                                                 fallback.className = 'w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xl';
                                                 fallback.textContent = match.homeTeam.name.charAt(0);
                                                 parent.appendChild(fallback);
                                             }
                                         }}
                                     />
                                 </div>
                                 <span className="font-condensed font-bold text-2xl uppercase text-white">{match.homeTeam.name}</span>
                             </div>
                             <span className="font-condensed font-black text-5xl text-gray-700 italic">VS</span>
                             <div className="flex flex-col items-center gap-2">
                                 <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                                     <img
                                         src={match.awayTeam.logo}
                                         className="w-16 h-16 object-contain drop-shadow-lg"
                                         onError={(e) => {
                                             const target = e.target as HTMLImageElement;
                                             target.style.display = 'none';
                                             const parent = target.parentElement;
                                             if (parent) {
                                                 const fallback = document.createElement('div');
                                                 fallback.className = 'w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xl';
                                                 fallback.textContent = match.awayTeam.name.charAt(0);
                                                 parent.appendChild(fallback);
                                             }
                                         }}
                                     />
                                 </div>
                                 <span className="font-condensed font-bold text-2xl uppercase text-white">{match.awayTeam.name}</span>
                             </div>
                        </div>

                        {/* The Prediction */}
                        <div className="bg-indigo-600 w-full py-4 transform -skew-y-2 shadow-lg mt-4 flex flex-col items-center justify-center">
                             <span className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] transform skew-y-2 mb-1">OFFICIAL PICK</span>
                             <span className="font-condensed font-black text-4xl text-white uppercase transform skew-y-2">
                                 {match.prediction?.outcome === 'HOME' ? match.homeTeam.name : match.prediction?.outcome === 'AWAY' ? match.awayTeam.name : 'DRAW'}
                             </span>
                        </div>
                        
                        {/* Pweza Insight */}
                        {match.prediction?.aiReasoning && (
                            <div className="px-8 text-center">
                                <p className="text-sm text-gray-300 font-medium italic">"{match.prediction.aiReasoning.substring(0, 80)}..."</p>
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/10 relative z-10 flex justify-between items-end bg-black/40">
                         <div>
                             <span className="block text-[10px] text-gray-500 font-bold uppercase">Confidence</span>
                             <div className="flex items-center gap-1 text-[#00FFB2]">
                                 <CheckCircle2 size={14} />
                                 <span className="font-black text-lg">{match.prediction?.confidence}%</span>
                             </div>
                         </div>
                         <div className="flex items-center gap-2 opacity-50">
                             <span className="text-[10px] font-bold uppercase text-white">Powered by Pweza AI</span>
                             <span className="text-lg">🐙</span>
                         </div>
                    </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleDownload} className="bg-[#1E1E1E] hover:bg-[#333] text-white py-3 rounded-lg font-condensed font-bold uppercase flex items-center justify-center gap-2 transition-colors">
                        <Download size={20} /> Save Image
                    </button>
                    <button onClick={handleShare} className="bg-[#00FFB2] hover:bg-[#00E09E] text-black py-3 rounded-lg font-condensed font-bold uppercase flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20">
                        <Share2 size={20} /> Share
                    </button>
                </div>
                
                <p className="text-center text-[10px] text-gray-500 font-bold uppercase">
                    Perfect for WhatsApp Status & Instagram Stories
                </p>

            </div>
        </div>
    );
};

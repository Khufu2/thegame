
import React, { useState } from 'react';
import { ArrowLeft, Shield, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LegalPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'TERMS' | 'PRIVACY'>('TERMS');

    return (
        <div className="min-h-screen bg-black text-white pb-24 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-b border-[#2C2C2C] px-4 h-[60px] flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-[#1E1E1E] rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-400" />
                </button>
                <span className="font-condensed font-black text-xl uppercase italic tracking-tighter">Legal</span>
            </div>

            <div className="max-w-[800px] mx-auto p-4">
                
                {/* Tabs */}
                <div className="flex bg-[#1E1E1E] rounded-lg p-1 mb-6">
                    <button 
                        onClick={() => setActiveTab('TERMS')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded font-bold text-xs uppercase transition-colors ${activeTab === 'TERMS' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                    >
                        <FileText size={14} /> Terms of Service
                    </button>
                    <button 
                        onClick={() => setActiveTab('PRIVACY')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded font-bold text-xs uppercase transition-colors ${activeTab === 'PRIVACY' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Shield size={14} /> Privacy Policy
                    </button>
                </div>

                {/* Content */}
                <div className="bg-[#121212] border border-[#2C2C2C] rounded-xl p-6 text-gray-300 text-sm leading-relaxed space-y-4">
                    {activeTab === 'TERMS' ? (
                        <>
                            <h2 className="font-condensed font-black text-2xl uppercase text-white mb-2">Terms of Service</h2>
                            <p className="text-xs text-gray-500 uppercase font-bold mb-4">Last Updated: October 2024</p>
                            
                            <h3 className="font-bold text-white uppercase">1. Acceptance of Terms</h3>
                            <p>By accessing and using Sheena Sports, you accept and agree to be bound by the terms and provision of this agreement.</p>

                            <h3 className="font-bold text-white uppercase">2. Use License</h3>
                            <p>Permission is granted to temporarily download one copy of the materials (information or software) on Sheena Sports' website for personal, non-commercial transitory viewing only.</p>

                            <h3 className="font-bold text-white uppercase">3. Disclaimer</h3>
                            <p>The materials on Sheena Sports' website are provided on an 'as is' basis. Sheena Sports makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
                            
                            <h3 className="font-bold text-white uppercase">4. Betting & Financial Risk</h3>
                            <p>Sheena Sports is an information platform. Predictions and AI insights are for entertainment purposes only. We do not accept responsibility for any financial losses incurred through betting. Please gamble responsibly.</p>
                        </>
                    ) : (
                        <>
                            <h2 className="font-condensed font-black text-2xl uppercase text-white mb-2">Privacy Policy</h2>
                            <p className="text-xs text-gray-500 uppercase font-bold mb-4">Last Updated: October 2024</p>

                            <h3 className="font-bold text-white uppercase">1. Information Collection</h3>
                            <p>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us.</p>

                            <h3 className="font-bold text-white uppercase">2. Use of Information</h3>
                            <p>We use the information we collect to operate, maintain, and improve our services, such as to personalize your experience and send you technical notices.</p>

                            <h3 className="font-bold text-white uppercase">3. Data Security</h3>
                            <p>We implement reasonable security measures to protect the security of your personal information. However, please be aware that no method of transmission over the internet is 100% secure.</p>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

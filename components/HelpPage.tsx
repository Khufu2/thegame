
import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Mail, ChevronDown, ChevronUp, HelpCircle, Send, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FAQS = [
    { question: "How do I upgrade to Sheena+?", answer: "Go to your Profile page and click on the 'Upgrade to Pro' card. You can pay via Credit Card or Crypto (USDT)." },
    { question: "What is the War Room?", answer: "The War Room is an exclusive feed for Pro members that shows real-time 'Sharp Money' alerts, line movements, and high-confidence AI picks." },
    { question: "How do I withdraw my winnings?", answer: "Sheena Sports is currently a fantasy/intelligence platform. The currency is virtual. We are working on real-money betting integration for select regions." },
    { question: "Why is the app running slowly?", answer: "Try enabling 'Data Saver Mode' in Settings if you are on a slow connection. This will disable high-res images and animations." },
];

export const HelpPage: React.FC = () => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [message, setMessage] = useState('');

    const toggleFaq = (idx: number) => {
        setOpenFaq(openFaq === idx ? null : idx);
    };

    const handleContact = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Support request sent! We will reply via email shortly.");
        setMessage('');
    };

    return (
        <div className="min-h-screen bg-black text-white pb-24 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-b border-[#2C2C2C] px-4 h-[60px] flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-[#1E1E1E] rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-400" />
                </button>
                <span className="font-condensed font-black text-xl uppercase italic tracking-tighter">Help & Support</span>
            </div>

            <div className="max-w-[800px] mx-auto p-4 space-y-8 animate-in fade-in">
                
                {/* Hero */}
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#1E1E1E] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#333]">
                        <HelpCircle size={32} className="text-indigo-500" />
                    </div>
                    <h2 className="font-condensed font-black text-3xl uppercase text-white mb-2">How can we help?</h2>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                        Find answers to common questions or get in touch with our support team.
                    </p>
                </div>

                {/* FAQs */}
                <section>
                    <h3 className="font-bold text-sm text-gray-400 uppercase mb-4 ml-2">Frequently Asked Questions</h3>
                    <div className="space-y-2">
                        {FAQS.map((faq, idx) => (
                            <div key={idx} className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-lg overflow-hidden">
                                <button 
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#252525] transition-colors"
                                >
                                    <span className="font-bold text-sm text-white">{faq.question}</span>
                                    {openFaq === idx ? <ChevronUp size={16} className="text-gray-500"/> : <ChevronDown size={16} className="text-gray-500"/>}
                                </button>
                                {openFaq === idx && (
                                    <div className="p-4 pt-0 text-sm text-gray-400 border-t border-[#2C2C2C] bg-[#121212] leading-relaxed">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Contact Form */}
                <section>
                    <h3 className="font-bold text-sm text-gray-400 uppercase mb-4 ml-2">Contact Support</h3>
                    <form onSubmit={handleContact} className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-6">
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Message</label>
                            <textarea 
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full bg-black border border-[#333] rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none h-32 resize-none"
                                placeholder="Describe your issue..."
                                required
                            />
                        </div>
                        <button type="submit" className="w-full py-3 bg-white text-black font-condensed font-black uppercase rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2">
                            <Send size={18} /> Send Message
                        </button>
                    </form>
                </section>

                {/* Direct Contact */}
                <section className="grid grid-cols-2 gap-4">
                    <button className="p-4 bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl flex flex-col items-center gap-2 hover:border-indigo-500 transition-colors">
                        <MessageCircle size={24} className="text-indigo-500" />
                        <span className="font-bold text-sm text-white">Live Chat</span>
                        <span className="text-[10px] text-gray-500 uppercase">Available 9am - 5pm</span>
                    </button>
                    <button className="p-4 bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl flex flex-col items-center gap-2 hover:border-green-500 transition-colors">
                        <Mail size={24} className="text-green-500" />
                        <span className="font-bold text-sm text-white">Email Us</span>
                        <span className="text-[10px] text-gray-500 uppercase">support@sheena.com</span>
                    </button>
                </section>

            </div>
        </div>
    );
};

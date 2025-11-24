

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { streamPwezaResponse } from '../services/pwezaService';
import { X, Send, Bot, Sparkles, TrendingUp } from 'lucide-react';
import { useSports } from '../context/SportsContext';

interface PwezaProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Pweza: React.FC<PwezaProps> = ({ isOpen, onClose }) => {
  const { pwezaPrompt } = useSports();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: "I'm Pweza. Ready to analyze betting angles, stats, and predictions.", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AUTO TRIGGER FOR CONTEXT AWARENESS
  useEffect(() => {
      if (isOpen && pwezaPrompt && !isThinking) {
          handleAutoSend(pwezaPrompt);
      }
  }, [isOpen, pwezaPrompt]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleAutoSend = async (prompt: string) => {
      setIsThinking(true);
      // We DO NOT add the prompt to the UI messages array (Ghost Prompt)
      // This makes it feel like Pweza just started talking about the topic.
      
      const history = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
      
      const modelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', timestamp: Date.now() }]);

      let fullText = '';
      await streamPwezaResponse(history, prompt, (chunk) => {
        fullText += chunk;
        setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: fullText } : m));
      });
      setIsThinking(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    const history = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', timestamp: Date.now() }]);

    let fullText = '';
    await streamPwezaResponse(history, userMsg.text, (chunk) => {
      fullText += chunk;
      setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: fullText } : m));
    });
    setIsThinking(false);
  };

  // If closed, don't render content to save DOM updates, just hide visibility
  if (!isOpen && messages.length < 2) return null;

  return (
    <>
      {/* BACKDROP */}
      <div 
        className={`fixed inset-0 bg-black/80 z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* DRAWER */}
      <div className={`fixed bottom-0 left-0 right-0 md:right-6 md:left-auto md:bottom-6 md:w-[400px] md:h-[600px] h-[85vh] bg-br-card border-t md:border border-br-border md:rounded-xl z-[70] flex flex-col shadow-2xl transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-[110%]'}`}>
         
         {/* HEADER */}
         <div className="flex items-center justify-between p-4 border-b border-br-border bg-br-card rounded-t-xl">
             <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-sheena-primary flex items-center justify-center rounded">
                     <Bot size={18} className="text-white" />
                 </div>
                 <div>
                     <h3 className="font-condensed font-black text-lg italic text-white tracking-tight leading-none">PWEZA AI</h3>
                     <span className="text-[10px] font-bold text-br-muted uppercase tracking-wider">
                        {isThinking ? 'Thinking...' : 'Sports Assistant'}
                     </span>
                 </div>
             </div>
             <button onClick={onClose} className="p-2 text-br-muted hover:text-white transition-colors">
                 <X size={20} />
             </button>
         </div>

         {/* CHAT CONTENT */}
         <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-br-bg">
             {messages.map((msg) => (
                 <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] p-3 rounded text-sm font-medium leading-relaxed ${
                         msg.role === 'user' 
                         ? 'bg-white text-black' 
                         : 'bg-br-surface text-gray-300 border border-br-border'
                     }`}>
                         {msg.text}
                         {msg.role === 'model' && msg.text.length === 0 && <span className="animate-pulse">...</span>}
                     </div>
                 </div>
             ))}
             <div ref={messagesEndRef} />
         </div>

         {/* INPUT AREA */}
         <div className="p-4 border-t border-br-border bg-br-card md:rounded-b-xl">
            {messages.length < 3 && !pwezaPrompt && (
                <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
                    <button onClick={() => setInput("Best value bet today?")} className="flex items-center gap-1 px-3 py-1.5 bg-br-surface border border-br-border rounded text-xs font-bold text-white whitespace-nowrap hover:bg-br-surface/70">
                        <Sparkles size={12} className="text-yellow-400" /> Value Bets
                    </button>
                    <button onClick={() => setInput("Analyze Arsenal's form")} className="flex items-center gap-1 px-3 py-1.5 bg-br-surface border border-br-border rounded text-xs font-bold text-white whitespace-nowrap hover:bg-br-surface/70">
                        <TrendingUp size={12} className="text-green-400" /> Team Form
                    </button>
                </div>
            )}
            <div className="flex items-center gap-2">
                <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask for analysis, stats, or predictions..."
                    className="flex-1 bg-black border border-br-border rounded px-4 py-3 text-sm text-white placeholder-br-muted focus:outline-none focus:border-white/50 transition-colors"
                />
                <button 
                    onClick={handleSend} 
                    disabled={!input.trim() || isThinking}
                    className="p-3 bg-white rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={18} className="text-black" />
                </button>
            </div>
         </div>

      </div>
    </>
  );
};
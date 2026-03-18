import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { generateAssistantResponse } from '../services/geminiService';
import { Send, Bot, User, Sparkles, MessageSquare } from 'lucide-react';

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content: "Bonjour ! Je suis votre assistant administratif virtuel. Je peux vous aider avec vos questions sur le statut auto-entrepreneur, les déclarations URSSAF, ou la rédaction de courriers. Comment puis-je vous aider aujourd'hui ?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Build context from last few messages
    const context = messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n');
    
    const responseText = await generateAssistantResponse(userMsg.content, context);
    
    const modelMsg: ChatMessage = { role: 'model', content: responseText, timestamp: Date.now() };
    setMessages(prev => [...prev, modelMsg]);
    setIsLoading(false);
  };

  return (
    <div className="h-[calc(100vh-6rem)] max-w-5xl mx-auto flex flex-col bg-white rounded-[2rem] shadow-xl border border-brand-200 overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-brand-900 to-brand-800 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl shadow-inner">
                <Sparkles className="text-white" size={24} />
            </div>
            <div>
                <h2 className="text-white font-bold text-lg">Assistant Administratif</h2>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500"></span>
                    </span>
                    <p className="text-brand-100 text-xs font-medium">En ligne • Propulsé par Google Gemini</p>
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-brand-50/30 scroll-smooth">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border
              ${msg.role === 'user' ? 'bg-brand-900 border-brand-800 text-white' : 'bg-white border-brand-200 text-brand-600'}
            `}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={20} />}
            </div>
            
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`
                max-w-[85%] px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm
                ${msg.role === 'user' 
                    ? 'bg-brand-900 text-white rounded-[2rem] rounded-tr-sm' 
                    : 'bg-white text-brand-800 rounded-[2rem] rounded-tl-sm border border-brand-100'}
                `}>
                {msg.content}
                </div>
                <span className="text-[10px] text-brand-400 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-4">
             <div className="w-10 h-10 rounded-full bg-white border border-brand-200 text-brand-600 flex items-center justify-center shrink-0 shadow-sm">
               <Bot size={20} />
             </div>
             <div className="bg-white px-5 py-4 rounded-[2rem] rounded-tl-sm border border-brand-100 shadow-sm">
               <div className="flex gap-1.5">
                 <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce [animation-delay:-.15s]"></div>
                 <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-6 bg-white border-t border-brand-100">
        <div className="relative flex gap-3">
          <input
            type="text"
            className="flex-1 pl-5 pr-12 py-3.5 border border-brand-200 rounded-2xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 outline-none transition-all shadow-sm bg-brand-50/50 focus:bg-white"
            placeholder="Posez une question (ex: Comment déclarer mon CA ?)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3.5 bg-brand-900 text-white rounded-2xl hover:bg-brand-800 disabled:opacity-50 disabled:hover:bg-brand-900 transition-all font-bold shadow-md flex items-center gap-2"
          >
            <span>Envoyer</span>
            <Send size={18} />
          </button>
        </div>
        <div className="text-center mt-3">
            <p className="text-[10px] text-brand-400 flex items-center justify-center gap-1.5">
                <MessageSquare size={10} />
                L'IA peut commettre des erreurs. Vérifiez toujours les informations légales.
            </p>
        </div>
      </form>
    </div>
  );
};

export default AIAssistant;
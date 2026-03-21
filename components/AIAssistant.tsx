import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { ChatMessage, Invoice, Client, UserProfile } from '../types';
import { generateAssistantResponse, checkInvoiceCompliance, predictCashflowJ30 } from '../services/geminiService';
import { useAppStore } from '../store/appStore';
import { Send, Bot, User, Sparkles, MessageSquare, AlertTriangle, TrendingUp, CheckCircle, Shield, Loader2 } from 'lucide-react';

const AIAssistant: React.FC = () => {
    const { invoices, clients, userProfile } = useAppStore();
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'model',
            content: "Bonjour ! Je suis votre assistant administratif virtuel. Je peux vous aider avec vos questions sur le statut auto-entrepreneur, les déclarations URSSAF, ou la rédaction de courriers. Comment puis-je vous aider aujourd'hui ?",
            timestamp: Date.now()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [complianceResults, setComplianceResults] = useState<{ isCompliant: boolean; issues: string[]; suggestions: string[] } | null>(null);
    const [cashflowPrediction, setCashflowPrediction] = useState<{ predictedBalance: number; confidence: number; analysis: string; riskLevel: string } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initial analysis when component mounts
    useEffect(() => {
        const performDeepAnalysis = async () => {
            if (invoices.length === 0) return;
            setIsAnalyzing(true);
            try {
                // Cashflow prediction
                const prediction = await predictCashflowJ30(invoices, userProfile);
                setCashflowPrediction(prediction);

                // Compliance check for the last invoice
                const lastInvoice = [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                const client = clients.find(c => c.id === lastInvoice.clientId);
                if (lastInvoice && client) {
                    const compliance = await checkInvoiceCompliance(lastInvoice, userProfile, client);
                    setComplianceResults(compliance);
                }
            } catch (err) {
                console.error("Analysis error:", err);
            } finally {
                setIsAnalyzing(false);
            }
        };

        performDeepAnalysis();
    }, []); // Only on mount

    const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) {return;}

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
    <div className="h-[calc(100vh-6rem)] max-w-5xl mx-auto flex flex-col bg-white rounded-4xl shadow-xl border border-brand-200 overflow-hidden animate-fade-in">
      <div className="bg-linear-to-r from-brand-900 to-brand-800 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white/20 -webkit-backdrop-blur-md backdrop-blur-md rounded-xl shadow-inner">
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
        {/* Insights Analytics Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Cashflow Prediction Card */}
            <div className="bg-white rounded-2xl p-5 border border-brand-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:rotate-12 transition-transform">
                    <TrendingUp size={64} className="text-brand-900" />
                </div>
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-brand-100 text-brand-900 rounded-lg">
                        <TrendingUp size={20} />
                    </div>
                    <h3 className="font-bold text-brand-900">Prédiction Trésorerie (30j)</h3>
                </div>
                {isAnalyzing ? (
                    <div className="flex items-center gap-2 text-brand-400 text-sm py-4 animate-pulse">
                        <Loader2 size={16} className="animate-spin" />
                        Calcul en cours...
                    </div>
                ) : cashflowPrediction ? (
                    <div>
                        <p className="text-2xl font-black text-brand-900">
                            {cashflowPrediction.predictedBalance >= 0 ? '+' : ''}{cashflowPrediction.predictedBalance.toLocaleString()}€
                        </p>
                        <p className="text-xs text-brand-500 mt-1 mb-3">{cashflowPrediction.analysis}</p>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                                cashflowPrediction.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                                cashflowPrediction.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}>
                                Risque {cashflowPrediction.riskLevel === 'low' ? 'Faible' : cashflowPrediction.riskLevel === 'medium' ? 'Modéré' : 'Élevé'}
                            </span>
                            <span className="text-[10px] text-brand-400">Fiabilité : {(cashflowPrediction.confidence * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-brand-400">Aucune donnée de prédiction disponible.</p>
                )}
            </div>

            {/* Compliance Alert Card */}
            <div className="bg-white rounded-2xl p-5 border border-brand-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:rotate-12 transition-transform">
                    <AlertTriangle size={64} className="text-brand-900" />
                </div>
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-brand-100 text-brand-900 rounded-lg">
                        <Shield size={20} />
                    </div>
                    <h3 className="font-bold text-brand-900">Conformité Légale (Auto-Audit)</h3>
                </div>
                {isAnalyzing ? (
                    <div className="flex items-center gap-2 text-brand-400 text-sm py-4 animate-pulse">
                        <Loader2 size={16} className="animate-spin" />
                        Vérification des factures...
                    </div>
                ) : complianceResults ? (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            {complianceResults.isCompliant ? (
                                <CheckCircle size={18} className="text-green-500" />
                            ) : (
                                <AlertTriangle size={18} className="text-amber-500" />
                            )}
                            <span className={`font-bold text-sm ${complianceResults.isCompliant ? 'text-green-600' : 'text-amber-600'}`}>
                                {complianceResults.isCompliant ? 'Dernière facture conforme' : `${complianceResults.issues.length} points à vérifier`}
                            </span>
                        </div>
                        {complianceResults.issues.length > 0 && (
                            <ul className="text-[11px] text-brand-600 space-y-1 mb-2 bg-brand-50/50 p-2 rounded-lg">
                                {complianceResults.issues.slice(0, 2).map((issue, i) => (
                                    <li key={i} className="flex gap-2">
                                        <span className="text-brand-300">•</span>
                                        {issue}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <p className="text-[10px] text-brand-400 italic">Basé sur la dernière facture émise.</p>
                    </div>
                ) : (
                    <p className="text-sm text-brand-400">Pas encore de factures à analyser.</p>
                )}
            </div>
        </div>

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
                L&apos;IA peut commettre des erreurs. Vérifiez toujours les informations légales.
            </p>
        </div>
      </form>
    </div>
  );
};

export default AIAssistant;

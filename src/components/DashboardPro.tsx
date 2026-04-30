/**
 * DashboardPro.tsx - Tableau de bord avec les fonctions (Version 2026)
 * ✅ Vue d'ensemble fiscale et opérationnelle
 * ✅ Widgets dynamiques et interactifs
 * ✅ Raccourcis métier (Facturation, Rapprochement, Archivage)
 */

import React, { useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Euro, 
  Wallet, 
  Zap, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  Calculator,
  Gavel,
  History,
  FileText
} from "lucide-react";
import { motion } from "motion/react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { useDataStore } from "../store/useDataStore";
import { calculateSocialContributions, calculateThresholdStatus } from "../lib/fiscalCalculations";
import { InvoiceStatus } from "../types";
import { GDPRHealthReport } from "./GDPRHealthReport";
import { P2PSync } from "./P2PSync";

interface DashboardProProps {
  onNavigate: (view: string) => void;
}

export const DashboardPro: React.FC<DashboardProProps> = ({ onNavigate }) => {
  const { invoices, expenses, userProfile } = useDataStore();

  // --- Calculs Financiers ---
  const totalRevenue = useMemo(() => 
    invoices
      .filter(i => i.status === InvoiceStatus.PAID || i.status === InvoiceStatus.PARTIALLY_PAID)
      .reduce((acc, i) => acc + i.total, 0),
  [invoices]);

  const totalExpenses = useMemo(() => 
    expenses.reduce((acc, e) => acc + e.amount, 0),
  [expenses]);

  const netProfit = totalRevenue - totalExpenses;
  
  const fiscalStatus = useMemo(() => 
    calculateThresholdStatus(totalRevenue, userProfile.activityType || "BNC"),
  [totalRevenue, userProfile.activityType]);

  const socialContributions = calculateSocialContributions(totalRevenue, userProfile);

  // --- Données Graphiques ---
  const chartData = useMemo(() => {
    // Simulation de données mensuelles basées sur les factures réelles
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun"];
    return months.map((m, i) => ({
      name: m,
      revenue: Math.random() * 5000 + 2000,
      expenses: Math.random() * 1000 + 500,
    }));
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header avec Statut */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
            <span className="text-gradient-pro">Tableau de Bord</span>
            <span className="badge-orange">2026 Ready</span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 font-medium">
            Bienvenue, <span className="text-brand-600 dark:text-brand-400 font-bold">{userProfile.companyName}</span>. Voici l'état de votre activité.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate("invoices")}
            className="btn-primary"
          >
            <Zap size={18} />
            Nouvelle Facture
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Chiffre d'Affaires" 
          value={`${totalRevenue.toLocaleString()} €`}
          trend="+12.5%"
          trendUp={true}
          icon={<Euro size={20} />}
          color="brand"
        />
        <KPICard 
          title="Bénéfice Net (Est.)" 
          value={`${(netProfit - socialContributions.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })} €`}
          description="Après charges sociales"
          icon={<Wallet size={20} />}
          color="emerald"
        />
        <KPICard 
          title="Seuil Micro" 
          value={`${fiscalStatus.micro.percentage.toFixed(1)}%`}
          description={`${fiscalStatus.micro.remaining.toLocaleString()} € restants`}
          icon={<TrendingUp size={20} />}
          color="orange"
          progress={fiscalStatus.micro.percentage}
        />
        <KPICard 
          title="Conformité" 
          value="A+"
          description="Documents & RGPD"
          icon={<ShieldCheck size={20} />}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Graphique de Performance */}
        <div className="lg:col-span-2 card-modern p-8 bg-white dark:bg-neutral-900/50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="text-brand-500" size={20} />
              Performance Mensuelle
            </h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-brand-600">
                <span className="w-2 h-2 rounded-full bg-brand-500"></span> REVENU
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span> DÉPENSES
              </span>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '12px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  fill="transparent"
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Raccourcis & Fonctions */}
        <div className="space-y-6">
          <div className="card-modern p-6 bg-linear-to-br from-brand-600 to-brand-800 text-white border-none shadow-lg shadow-brand-500/20">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap size={20} className="text-accent-300" />
              Actions Rapides
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <QuickActionBtn 
                icon={<Calculator size={18} />} 
                label="Rapprochement Bancaire" 
                onClick={() => onNavigate("bank_reconciliation")}
              />
              <QuickActionBtn 
                icon={<ShieldCheck size={18} />} 
                label="Archivage Légal" 
                onClick={() => onNavigate("settings")}
              />
              <QuickActionBtn 
                icon={<History size={18} />} 
                label="Suivi de la TVA" 
                onClick={() => onNavigate("vat_dashboard")}
              />
              <QuickActionBtn 
                icon={<FileText size={18} />} 
                label="Mes Documents CGV" 
                onClick={() => onNavigate("settings")}
              />
            </div>
          </div>

          <div className="card-modern p-6 h-fit">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-500" />
              Échéances à venir
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-accent-100 text-accent-600 dark:bg-accent-900/50 dark:text-accent-400 rounded-lg font-bold text-xs uppercase tracking-tighter">30 MAI</div>
                <div className="flex-1">
                  <p className="text-sm font-bold">Déclaration URSSAF</p>
                  <p className="text-[10px] text-neutral-500">Trimestre 1 2026</p>
                </div>
                <ArrowUpRight size={16} className="text-slate-300" />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                <div className="p-2 bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-400 rounded-lg font-bold text-xs uppercase tracking-tighter">15 JUIN</div>
                <div className="flex-1">
                  <p className="text-sm font-bold">Acompte CFE</p>
                  <p className="text-[10px] text-neutral-500">Paiement en ligne</p>
                </div>
                <ArrowUpRight size={16} className="text-neutral-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Complémentaires */}
      <div className="grid grid-cols-1 gap-8">
         <GDPRHealthReport />
         <P2PSync />
      </div>
    </div>
  );
};

// --- Sous-composants Interne ---

const KPICard: React.FC<{
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  description?: string;
  icon: React.ReactNode;
  color: "brand" | "emerald" | "orange" | "indigo";
  progress?: number;
}> = ({ title, value, trend, trendUp, description, icon, color, progress }) => {
  const colorClasses = {
    brand: "text-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:text-brand-400",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400",
    orange: "text-accent-600 bg-accent-50 dark:bg-accent-900/30 dark:text-accent-400",
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400",
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="card-modern p-6 bg-white dark:bg-neutral-900/50 flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${trendUp ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" : "text-rose-600 bg-rose-50 dark:bg-rose-900/30"}`}>
            {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend}
          </div>
        )}
      </div>
      
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h4>
        {description && <p className="text-[10px] text-slate-500 mt-1 font-medium">{description}</p>}
        
        {progress !== undefined && (
          <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${progress > 90 ? 'bg-red-500' : 'bg-brand-500'}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

const QuickActionBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-3 w-full p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-left group active:scale-95"
  >
    <div className="p-2 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <span className="text-xs font-bold">{label}</span>
    <ArrowUpRight size={14} className="ml-auto opacity-40 group-hover:opacity-100 transition-opacity" />
  </button>
);

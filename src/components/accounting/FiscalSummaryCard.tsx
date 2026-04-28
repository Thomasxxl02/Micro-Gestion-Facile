import React from "react";
import { TrendingUp, TrendingDown, DollarSign, Calculator } from "lucide-react";
import { formatCurrency } from "../../lib/formatters";

interface FiscalSummaryCardProps {
  totalRevenue: number;
  totalExpenses: number;
  netResult: number;
  netAfterCharges: number;
}

export const FiscalSummaryCard: React.FC<FiscalSummaryCardProps> = ({
  totalRevenue,
  totalExpenses,
  netResult,
  netAfterCharges,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div className="card-modern p-8 flex flex-col justify-between relative overflow-hidden group border-b-4 border-b-brand-500">
        <div className="absolute -right-6 -bottom-6 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-all duration-700 group-hover:scale-125 group-hover:rotate-12 text-brand-900 dark:text-brand-50">
          <TrendingUp size={140} />
        </div>
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-400 rounded-2xl shadow-sm">
            <TrendingUp size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-brand-100 dark:bg-brand-900/40 px-3 py-1 rounded-full text-brand-600 dark:text-brand-400">
            Revenu CA
          </span>
        </div>
        <div>
          <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
            Chiffre d'Affaires
          </p>
          <h3 className="text-3xl font-black text-neutral-900 dark:text-white font-display tracking-tight mt-1">
            {formatCurrency(totalRevenue)}
          </h3>
        </div>
      </div>

      <div className="card-modern p-8 flex flex-col justify-between relative overflow-hidden group border-b-4 border-b-rose-500">
        <div className="absolute -right-6 -bottom-6 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-all duration-700 group-hover:scale-125 group-hover:rotate-12 text-rose-500">
          <TrendingDown size={140} />
        </div>
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl shadow-sm">
            <TrendingDown size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-rose-100 dark:bg-rose-900/40 px-3 py-1 rounded-full text-rose-600 dark:text-rose-400">
            Dépenses
          </span>
        </div>
        <div>
          <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
            TOTAL Dépenses
          </p>
          <h3 className="text-3xl font-black text-neutral-900 dark:text-white font-display tracking-tight mt-1">
            {formatCurrency(totalExpenses)}
          </h3>
        </div>
      </div>

      <div className="card-modern p-8 flex flex-col justify-between relative overflow-hidden group bg-neutral-900 border-none shadow-2xl dark:shadow-brand-500/10">
        <div className="absolute -right-6 -bottom-6 p-8 opacity-10 group-hover:opacity-20 transition-all duration-700 group-hover:scale-125 group-hover:rotate-12 text-white">
          <DollarSign size={140} />
        </div>
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-white/10 text-white rounded-2xl">
            <DollarSign size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full text-white">
            Net Profit
          </span>
        </div>
        <div>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
            Bénéfice Net CA
          </p>
          <h3 className="text-3xl font-black text-white font-display tracking-tight mt-1">
            {formatCurrency(netResult)}
          </h3>
        </div>
      </div>

      <div className="card-modern p-8 flex flex-col justify-between relative overflow-hidden group border-dashed border-2 border-neutral-200 dark:border-neutral-800">
        <div className="absolute -right-6 -bottom-6 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-all duration-700 group-hover:scale-125 group-hover:rotate-12 text-amber-500">
          <Calculator size={140} />
        </div>
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl shadow-sm">
            <Calculator size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-amber-100 dark:bg-amber-900/40 px-3 py-1 rounded-full text-amber-600 dark:text-amber-400">
            Estimation
          </span>
        </div>
        <div>
          <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
            Disponibilité réelle
          </p>
          <h3 className="text-3xl font-black text-neutral-900 dark:text-white font-display tracking-tight mt-1">
            {formatCurrency(netAfterCharges)}
          </h3>
        </div>
      </div>
    </div>
  );
};

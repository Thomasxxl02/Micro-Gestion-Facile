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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="card-modern p-6 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-brand-900 dark:text-brand-50">
          <TrendingUp size={120} />
        </div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 bg-brand-50 dark:bg-brand-800 text-brand-900 dark:text-brand-50 rounded-xl">
            <TrendingUp size={20} />
          </div>
          <span className="badge bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-400">
            CA
          </span>
        </div>
        <div>
          <p className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest">
            Recettes Encaissées
          </p>
          <h3 className="text-2xl font-bold text-brand-900 dark:text-white font-display tracking-tight mt-1">
            {formatCurrency(totalRevenue)}
          </h3>
        </div>
      </div>

      <div className="card-modern p-6 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-red-500">
          <TrendingDown size={120} />
        </div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-xl">
            <TrendingDown size={20} />
          </div>
          <span className="badge bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            Dépenses
          </span>
        </div>
        <div>
          <p className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest">
            Dépenses Totales
          </p>
          <h3 className="text-2xl font-bold text-brand-900 dark:text-white font-display tracking-tight mt-1">
            {formatCurrency(totalExpenses)}
          </h3>
        </div>
      </div>

      <div className="card-modern p-6 flex flex-col justify-between relative overflow-hidden group bg-brand-900 dark:bg-brand-50">
        <div className="absolute -right-4 -top-4 p-8 opacity-10 group-hover:opacity-20 transition-opacity text-white dark:text-brand-900">
          <DollarSign size={120} />
        </div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 bg-white/10 dark:bg-brand-900/20 text-white dark:text-brand-900 rounded-xl">
            <DollarSign size={20} />
          </div>
          <span className="badge bg-white/10 dark:bg-brand-900/20 text-white dark:text-brand-900">
            Net
          </span>
        </div>
        <div>
          <p className="text-[10px] font-bold text-brand-300 dark:text-brand-600 uppercase tracking-widest">
            Résultat Brut
          </p>
          <h3 className="text-2xl font-bold text-white dark:text-brand-900 font-display tracking-tight mt-1">
            {formatCurrency(netResult)}
          </h3>
        </div>
      </div>

      <div className="card-modern p-6 flex flex-col justify-between relative overflow-hidden group border-dashed">
        <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-amber-500">
          <Calculator size={120} />
        </div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
            <Calculator size={20} />
          </div>
          <span className="badge bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
            Charges
          </span>
        </div>
        <div>
          <p className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest">
            Estimation Net
          </p>
          <h3 className="text-2xl font-bold text-brand-900 dark:text-white font-display tracking-tight mt-1">
            {formatCurrency(netAfterCharges)}
          </h3>
        </div>
      </div>
    </div>
  );
};

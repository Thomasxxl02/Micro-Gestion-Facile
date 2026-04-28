import React from "react";
import { formatCurrency } from "../../lib/formatters";

interface QuarterlyStatsProps {
  quarterlyStats: {
    name: string;
    income: number;
    expense: number;
  }[];
  taxRate: number;
}

export const QuarterlyStats: React.FC<QuarterlyStatsProps> = ({
  quarterlyStats,
  taxRate,
}) => {
  return (
    <div className="card-modern p-8">
      <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-8 font-display">
        Récapitulatif Trimestriel
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quarterlyStats.map((q) => (
          <div
            key={q.name}
            className="p-6 rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800 hover:border-brand-200 dark:hover:border-brand-900 transition-all group/card"
          >
            <p className="text-[10px] font-bold text-brand-500 dark:text-brand-400 uppercase tracking-widest mb-4">
              {q.name}
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                  Recettes
                </span>
                <span className="text-sm font-black text-neutral-900 dark:text-white">
                  {formatCurrency(q.income)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                  Dépenses
                </span>
                <span className="text-sm font-black text-red-500 dark:text-red-400">
                  -{formatCurrency(q.expense)}
                </span>
              </div>
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase">
                  Net
                </span>
                <span
                  className={`text-sm font-black ${
                    q.income - q.expense >= 0
                      ? "text-accent-600 dark:text-accent-400"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(q.income - q.expense)}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center opacity-0 group-hover/card:opacity-100 transition-opacity">
              <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase">
                URSSAF Est.
              </span>
              <span className="text-xs font-black text-brand-600 dark:text-brand-400">
                {formatCurrency(q.income * (taxRate / 100))}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

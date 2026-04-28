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
      <h3 className="text-lg font-bold text-brand-900 mb-8 font-display">
        Récapitulatif Trimestriel
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quarterlyStats.map((q) => (
          <div
            key={q.name}
            className="p-6 rounded-3xl bg-brand-50/50 border border-brand-100 hover:border-brand-200 transition-all group"
          >
            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-4">
              {q.name}
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-brand-500">
                  Recettes
                </span>
                <span className="text-sm font-bold text-brand-900">
                  {formatCurrency(q.income)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-brand-500">
                  Dépenses
                </span>
                <span className="text-sm font-bold text-red-500">
                  -{formatCurrency(q.expense)}
                </span>
              </div>
              <div className="pt-3 border-t border-brand-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-brand-400 uppercase">
                  Profit
                </span>
                <span
                  className={`text-sm font-bold ${
                    q.income - q.expense >= 0 ? "text-accent-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(q.income - q.expense)}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-brand-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] font-bold text-brand-400 uppercase">
                Cotisations Est.
              </span>
              <span className="text-xs font-bold text-brand-600">
                {formatCurrency(q.income * (taxRate / 100))}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import { ChartPie as PieChartIcon } from "lucide-react";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MonthlyComparisonData {
  name: string;
  Recettes: number;
  Dépenses: number;
}

interface ExpenseByCategoryData {
  name: string;
  value: number;
}

interface AccountingChartsProps {
  monthlyComparison: MonthlyComparisonData[];
  expensesByCategory: ExpenseByCategoryData[];
  totalExpenses: number;
}

const COLORS = [
  "#102a43",
  "#2cb1bc",
  "#486581",
  "#3ebd93",
  "#627d98",
  "#829ab1",
  "#f87171",
  "#fbbf24",
];

/**
 * Composant lazy-loaded pour les graphiques de comptabilité
 * Utilise Recharts qui est une dépendance lourde (~200KB)
 * Chargé uniquement quand l'onglet "Bilan" est actif
 */
const AccountingCharts: React.FC<AccountingChartsProps> = ({
  monthlyComparison,
  expensesByCategory,
  totalExpenses,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Monthly Comparison Chart */}
      <div className="lg:col-span-2 card-modern p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-bold text-brand-900 font-display">
            Performance Mensuelle
          </h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-900"></span>
              <span className="text-[9px] font-bold text-brand-400 uppercase tracking-wider">
                Recettes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              <span className="text-[9px] font-bold text-brand-400 uppercase tracking-wider">
                Dépenses
              </span>
            </div>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyComparison}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={8}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                dy={15}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  borderRadius: "1rem",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  padding: "16px",
                  backgroundColor: "white",
                  fontSize: "11px",
                  fontWeight: "600",
                }}
              />
              <Bar dataKey="Recettes" fill="#0f172a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Dépenses" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="card-modern p-8">
        <h3 className="text-lg font-bold text-brand-900 mb-8 font-display">
          Répartition Dépenses
        </h3>
        {expensesByCategory.length > 0 ? (
          <div className="flex flex-col h-full">
            <div className="h-48 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={8}
                    dataKey="value"
                    fill="#0f172a"
                  ></Pie>
                  <Tooltip
                    formatter={(value: unknown) => {
                      if (typeof value === "number") {
                        return `${value.toFixed(2)} €`;
                      }
                      return "";
                    }}
                    contentStyle={
                      {
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      } as React.CSSProperties
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 flex-1 overflow-auto custom-scrollbar pr-2">
              {expensesByCategory.map((cat, idx) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full bg-[${COLORS[idx % COLORS.length]}]`}
                    ></div>
                    <span className="text-xs font-semibold text-brand-600">
                      {cat.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-brand-900">
                      {cat.value.toLocaleString()} €
                    </span>
                    <span className="text-[9px] font-bold text-brand-300 ml-2 uppercase">
                      {((cat.value / totalExpenses) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-brand-300 bg-brand-50/50 rounded-2xl border border-dashed border-brand-100 p-8">
            <PieChartIcon size={48} className="mb-4 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">
              Aucune dépense
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountingCharts;

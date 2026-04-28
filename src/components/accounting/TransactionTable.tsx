import React from "react";
import {
  Calendar,
  TrendingDown,
  Plus,
  Trash2,
  FileSpreadsheet,
} from "lucide-react";
import { type Expense, type Supplier } from "../../types";
import { formatCurrency } from "../../lib/formatters";

interface TransactionTableProps {
  filteredExpenses: Expense[];
  selectedExpenses: string[];
  suppliers: Supplier[];
  toggleSelectAll: () => void;
  toggleSelect: (id: string) => void;
  handleEdit: (expense: Expense) => void;
  handleDelete: (id: string) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  filteredExpenses,
  selectedExpenses,
  suppliers,
  toggleSelectAll,
  toggleSelect,
  handleEdit,
  handleDelete,
}) => {
  return (
    <div className="card-modern overflow-hidden border-none shadow-xl shadow-brand-900/5">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-brand-900 text-white text-[10px] font-bold uppercase tracking-[0.2em]">
              <th className="px-6 py-5 w-12">
                <input
                  type="checkbox"
                  title="Sélectionner toutes les dépenses affichées"
                  className="rounded border-brand-700 bg-brand-800 text-accent-500 focus:ring-accent-500"
                  checked={
                    filteredExpenses.length > 0 &&
                    selectedExpenses.length === filteredExpenses.length
                  }
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5">Description</th>
              <th className="px-8 py-5">Catégorie</th>
              <th className="px-8 py-5">Fournisseur</th>
              <th className="px-8 py-5 text-right">Montant</th>
              <th className="px-8 py-5 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50 bg-white">
            {filteredExpenses.map((exp) => {
              const supplier = suppliers.find((s) => s.id === exp.supplierId);
              const isSelected = selectedExpenses.includes(exp.id);
              return (
                <tr
                  key={exp.id}
                  className={`hover:bg-brand-50/50 transition-colors group ${isSelected ? "bg-brand-50/80" : ""}`}
                >
                  <td className="px-6 py-6">
                    <input
                      type="checkbox"
                      title="Sélectionner cette dépense"
                      className="rounded border-brand-200 text-brand-900 focus:ring-brand-900"
                      checked={isSelected}
                      onChange={() => toggleSelect(exp.id)}
                    />
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-400">
                        <Calendar size={14} />
                      </div>
                      <span className="text-xs font-bold text-brand-900 font-mono">
                        {new Date(exp.date).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-brand-900">
                      {exp.description}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="inline-flex px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-[9px] font-bold uppercase tracking-wider border border-brand-100">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {supplier ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-brand-100 flex items-center justify-center text-brand-600">
                          <TrendingDown size={10} />
                        </div>
                        <span className="text-xs font-bold text-brand-600">
                          {supplier.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-brand-300 font-medium italic">
                        Non spécifié
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="text-sm font-bold text-red-500">
                      -{formatCurrency(exp.amount)}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => handleEdit(exp)}
                        className="text-brand-400 hover:text-brand-900 p-2 rounded-xl hover:bg-brand-50"
                        title="Modifier"
                      >
                        <Plus size={16} className="rotate-0" />
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="text-brand-200 hover:text-red-500 p-2 rounded-xl hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan={7} className="py-24 text-center">
                  <div className="inline-block p-8 rounded-full bg-brand-50 mb-4">
                    <FileSpreadsheet size={40} className="text-brand-200" />
                  </div>
                  <h4 className="text-brand-900 font-bold text-lg font-display">
                    Aucune dépense trouvée
                  </h4>
                  <p className="text-brand-400 text-sm max-w-xs mx-auto mt-2">
                    Ajustez vos filtres ou ajoutez une nouvelle dépense pour
                    alimenter votre journal.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

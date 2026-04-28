import React from "react";
import {
  CircleAlert as AlertCircle,
  Archive,
  RotateCcw,
  Trash2,
  ExternalLink,
  Phone,
  Mail,
  Locate,
} from "lucide-react";
import type { Supplier } from "../../types";

interface SupplierListProps {
  suppliers: Supplier[];
  getSupplierStats: (id: string) => { totalSpent: number; count: number };
  onEdit: (supplier: Supplier) => void;
  onToggleArchive: (id: string) => void;
}

export const SupplierList: React.FC<SupplierListProps> = ({
  suppliers,
  getSupplierStats,
  onEdit,
  onToggleArchive,
}) => {
  if (suppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle
          size={48}
          className="text-brand-300 dark:text-brand-700 mb-4"
        />
        <h3 className="text-lg font-semibold text-brand-900 dark:text-white">
          Aucun fournisseur trouvé
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suppliers.map((supplier) => {
        const stats = getSupplierStats(supplier.id);
        return (
          <div
            key={supplier.id}
            className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-brand-200 dark:border-slate-700 hover:shadow-md transition-all flex justify-between items-center group"
          >
            <button
              onClick={() => onEdit(supplier)}
              aria-label={`Modifier le fournisseur ${supplier.name}`}
              className="flex-1 text-left rounded-lg p-2 -m-2 hover:bg-brand-50 dark:hover:bg-brand-900/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-brand-900 dark:text-white flex items-center gap-2">
                    {supplier.name}
                    {supplier.website && (
                      <span className="text-brand-400 group-hover:text-brand-600">
                        <ExternalLink size={14} />
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-brand-500 dark:text-brand-400 flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    {supplier.category && <span>{supplier.category}</span>}
                    {supplier.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> {supplier.email}
                      </span>
                    )}
                    {supplier.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {supplier.phone}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right sm:text-right">
                  <p className="text-xs text-brand-400 dark:text-brand-500">
                    Total dépensé
                  </p>
                  <p className="text-sm font-bold text-brand-900 dark:text-white">
                    {stats.totalSpent.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </p>
                  <p className="text-[10px] text-brand-400">
                    {stats.count} transaction{stats.count > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </button>
            <div className="flex gap-2 ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleArchive(supplier.id);
                }}
                className="p-2 text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-800 rounded-lg transition-colors"
                title={supplier.archived ? "Restaurer" : "Archiver"}
                aria-label={supplier.archived ? "Restaurer" : "Archiver"}
              >
                {supplier.archived ? (
                  <RotateCcw size={16} />
                ) : (
                  <Archive size={16} />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

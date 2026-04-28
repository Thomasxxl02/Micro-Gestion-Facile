import React from "react";
import {
  Package,
  Briefcase,
  AlertCircle,
  Zap,
  CircleArrowRight as ArrowRightCircle,
} from "lucide-react";

interface ProductStatsProps {
  total: number;
  servicesCount: number;
  lowStockCount: number;
}

export const ProductStats: React.FC<ProductStatsProps> = ({
  total,
  servicesCount,
  lowStockCount,
}) => {
  return (
    <div className="bento-grid">
      <div className="bento-item">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-brand-100 dark:bg-brand-800 rounded-2xl text-brand-600 dark:text-brand-300">
            <Package size={24} />
          </div>
          <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
            Total Catalogue
          </span>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-brand-900 dark:text-white font-display">
            {total}
          </h3>
          <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">
            Éléments actifs
          </p>
        </div>
      </div>
      <div className="bento-item">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-accent-100 dark:bg-accent-900/30 rounded-2xl text-accent-600 dark:text-accent-400">
            <Briefcase size={24} />
          </div>
          <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
            Prestations
          </span>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-accent-600 dark:text-accent-400 font-display">
            {servicesCount}
          </h3>
          <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">
            Services proposés
          </p>
        </div>
      </div>
      <div className="bento-item">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400">
            <AlertCircle size={24} />
          </div>
          <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
            Stock Bas
          </span>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-display">
            {lowStockCount}
          </h3>
          <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">
            Articles à réapprovisionner
          </p>
        </div>
      </div>
      <div className="bento-item bg-brand-900 dark:bg-white text-white dark:text-brand-900">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-white/10 dark:bg-brand-100 rounded-2xl">
            <Zap size={24} className="text-white dark:text-brand-900" />
          </div>
          <span className="text-[10px] font-bold text-brand-300 dark:text-brand-500 uppercase tracking-widest">
            Action Rapide
          </span>
        </div>
        <div>
          <h3 className="text-lg font-bold font-display">Optimiser le stock</h3>
          <button className="mt-2 text-xs font-bold flex items-center gap-2 hover:underline">
            Générer une commande <ArrowRightCircle size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

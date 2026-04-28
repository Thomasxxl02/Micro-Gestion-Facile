import React from "react";
import { Users, TrendingUp, Archive } from "lucide-react";

interface ClientStatsCardProps {
  activeCount: number;
  totalRevenue: number;
  archivedCount: number;
}

export const ClientStatsCard: React.FC<ClientStatsCardProps> = ({
  activeCount,
  totalRevenue,
  archivedCount,
}) => {
  return (
    <div className="bento-grid">
      <div className="bento-item">
        <div className="p-3 bg-brand-100 dark:bg-brand-800 rounded-2xl text-brand-600 dark:text-brand-300 mb-4">
          <Users size={24} />
        </div>
        <h3 className="text-2xl font-bold text-brand-900 dark:text-white">
          {activeCount}
        </h3>
        <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">
          Clients Actifs
        </p>
      </div>
      <div className="bento-item">
        <div className="p-3 bg-accent-100 dark:bg-accent-900/30 rounded-2xl text-accent-600 dark:text-accent-400 mb-4">
          <TrendingUp size={24} />
        </div>
        <h3 className="text-2xl font-bold text-accent-600 dark:text-accent-400">
          {totalRevenue.toLocaleString("fr-FR", {
            style: "currency",
            currency: "EUR",
          })}
        </h3>
        <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">
          CA Total Encaissé
        </p>
      </div>
      <div className="bento-item">
        <div className="p-3 bg-brand-100 dark:bg-brand-800 rounded-2xl text-brand-600 dark:text-brand-300 mb-4">
          <Archive size={24} />
        </div>
        <h3 className="text-2xl font-bold text-brand-900 dark:text-white">
          {archivedCount}
        </h3>
        <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">
          Archivés
        </p>
      </div>
    </div>
  );
};

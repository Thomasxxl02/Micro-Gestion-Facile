import React from "react";
import { CircleAlert as AlertCircle } from "lucide-react";
import { type Client } from "../../types";

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onToggleArchive: (id: string) => void;
  getClientStats: (clientId: string) => { revenue: number; count: number };
}

export const ClientList: React.FC<ClientListProps> = ({
  clients,
  onEdit,
  onToggleArchive,
  getClientStats,
}) => {
  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle
          size={48}
          className="text-brand-300 dark:text-brand-700 mb-4"
        />
        <h3 className="text-lg font-semibold text-brand-900 dark:text-white">
          Aucun client trouvé
        </h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map((client) => {
        const stats = getClientStats(client.id);
        return (
          <div
            key={client.id}
            className="card-modern p-6 flex flex-col justify-between group hover:border-brand-500 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 font-black text-xl shadow-inner uppercase">
                {client.name.substring(0, 2)}
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${client.archived ? "bg-neutral-100 text-neutral-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"}`}
                >
                  {client.archived ? "Archivé" : "Actif"}
                </span>
              </div>
            </div>

            <button
              onClick={() => onEdit(client)}
              className="text-left mb-6 group/title"
            >
              <h4 className="text-lg font-black text-neutral-900 dark:text-white group-hover/title:text-brand-600 dark:group-hover/title:text-brand-400 transition-colors">
                {client.name}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
                {client.email || "Pas d'email renseigné"}
              </p>
            </button>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-neutral-100 dark:border-neutral-800 mb-4">
              <div>
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">
                  Total Reçu
                </p>
                <p className="text-sm font-black text-brand-600 dark:text-brand-400">
                  {stats.revenue.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">
                  Factures
                </p>
                <p className="text-sm font-black text-neutral-800 dark:text-neutral-200">
                  {stats.count} doc.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(client)}
                className="flex-1 text-xs font-bold py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-500 transition-all"
              >
                Gérer
              </button>
              <button
                onClick={() => onToggleArchive(client.id)}
                className="px-3 py-2 rounded-xl border border-neutral-100 dark:border-neutral-800 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                title={client.archived ? "Désarchiver" : "Archiver"}
              >
                {client.archived ? "Restaurer" : "Masquer"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

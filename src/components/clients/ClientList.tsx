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
    <div className="space-y-3">
      {clients.map((client) => {
        const stats = getClientStats(client.id);
        return (
          <div
            key={client.id}
            className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-brand-200 dark:border-slate-700 hover:shadow-md transition-all flex justify-between items-center group"
          >
            <button
              onClick={() => onEdit(client)}
              aria-label={`Modifier le client ${client.name}`}
              className="flex-1 text-left rounded-lg p-2 -m-2 hover:bg-brand-50 dark:hover:bg-brand-900/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <div>
                <h4 className="font-semibold text-brand-900 dark:text-white">
                  {client.name}
                </h4>
                <div className="flex gap-4 mt-1 text-xs text-brand-600 dark:text-brand-300">
                  {client.email && <span>{client.email}</span>}
                  {client.phone && <span>{client.phone}</span>}
                </div>
              </div>
            </button>
            <div className="text-right mr-4">
              <div className="font-semibold text-accent-600 dark:text-accent-400">
                {stats.revenue.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })}
              </div>
              <div className="text-xs text-brand-500 dark:text-brand-400">
                {stats.count} facture(s)
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onToggleArchive(client.id)}
                className="text-xs px-3 py-1 rounded bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 transition-colors"
                title={
                  client.archived
                    ? "Restaurer le client"
                    : "Archiver le client"
                }
              >
                {client.archived ? "Restaurer" : "Archiver"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

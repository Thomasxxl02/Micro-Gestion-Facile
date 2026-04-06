/**
 * ExportModal — Modal d'export complet des données
 * ─────────────────────────────────────────────────
 * Permet à l'utilisateur d'exporter ses données au format JSON ou CSV.
 * Conformité RGPD Art. 20 (droit à la portabilité des données).
 *
 * Formats :
 *   - JSON : export complet avec toutes les collections (backup complet)
 *   - CSV  : export par collection (compatible Excel/OpenOffice)
 */

import { Archive, Check, Download, FileJson, FileSpreadsheet, X } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  downloadFile,
  exportAsCSV,
  exportAsJSON,
  generateFilename,
  type ExportData,
} from '../lib/exportUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportFormat = 'json' | 'csv';

type CollectionKey = Exclude<keyof ExportData, 'version' | 'exportedAt' | 'userProfile'>;

const COLLECTION_LABELS: Record<CollectionKey, string> = {
  invoices: 'Factures & devis',
  clients: 'Clients',
  suppliers: 'Fournisseurs',
  products: 'Produits & services',
  expenses: 'Dépenses',
  emails: 'Emails',
  emailTemplates: "Modèles d'email",
  calendarEvents: 'Événements calendrier',
};

const CSV_COLLECTION_KEYS: CollectionKey[] = [
  'invoices',
  'clients',
  'suppliers',
  'products',
  'expenses',
];

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExportData;
}

// ─── Composant ────────────────────────────────────────────────────────────────

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, data }) => {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [selectedCollections, setSelectedCollections] = useState<Set<CollectionKey>>(
    new Set(Object.keys(COLLECTION_LABELS) as CollectionKey[])
  );
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) {
    return null;
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const toggleCollection = (key: CollectionKey) => {
    setSelectedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAll = () =>
    setSelectedCollections(new Set(Object.keys(COLLECTION_LABELS) as CollectionKey[]));

  const deselectAll = () => setSelectedCollections(new Set());

  const handleExport = async () => {
    if (selectedCollections.size === 0) {
      toast.warning('Sélectionnez au moins une collection à exporter.');
      return;
    }

    setIsExporting(true);
    try {
      if (format === 'json') {
        // Export complet JSON avec les collections sélectionnées
        const partial: Partial<ExportData> = { userProfile: data.userProfile };
        for (const key of selectedCollections) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (partial as any)[key] = data[key];
        }
        const json = await exportAsJSON(partial);
        downloadFile(json, generateFilename('backup', 'json'), 'application/json');
        toast.success('Export JSON téléchargé avec succès');
      } else {
        // Export CSV par collection (une par fichier)
        const csvKeys = CSV_COLLECTION_KEYS.filter((k) => selectedCollections.has(k));
        if (csvKeys.length === 0) {
          toast.warning(
            'Le format CSV ne supporte que : factures, clients, fournisseurs, produits, dépenses.'
          );
          return;
        }
        for (const key of csvKeys) {
          const rows = data[key] as unknown[];
          if (rows.length === 0) {
            continue;
          }
          const csv = exportAsCSV(key, rows);
          downloadFile(csv, generateFilename(key, 'csv'), 'text/csv;charset=utf-8');
        }
        toast.success(`${csvKeys.length} fichier(s) CSV téléchargé(s)`);
      }
      onClose();
    } catch (err) {
      console.error('[ExportModal] Erreur export:', err);
      toast.error("L'export a échoué. Veuillez réessayer.");
    } finally {
      setIsExporting(false);
    }
  };

  // ─── Rendu ──────────────────────────────────────────────────────────────────

  const csvOnlyCollections: CollectionKey[] = CSV_COLLECTION_KEYS;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white dark:bg-brand-900 rounded-3xl shadow-2xl w-full max-w-lg border border-brand-100 dark:border-brand-800 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-brand-100 dark:border-brand-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-100 dark:bg-brand-800 rounded-2xl">
                <Archive
                  size={20}
                  className="text-brand-600 dark:text-brand-300"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h2
                  id="export-modal-title"
                  className="text-lg font-bold text-brand-900 dark:text-white"
                >
                  Exporter vos données
                </h2>
                <p className="text-xs text-brand-500 dark:text-brand-400">
                  RGPD Art. 20 — Portabilité
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              title="Fermer"
              className="p-2 hover:bg-brand-100 dark:hover:bg-brand-800 rounded-xl transition-colors text-brand-500"
              aria-label="Fermer la modal d'export"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Choix du format */}
            <fieldset>
              <legend className="text-sm font-semibold text-brand-700 dark:text-brand-300 mb-3">
                Format d'export
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    format === 'json'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-800/50 text-brand-700 dark:text-brand-200'
                      : 'border-brand-100 dark:border-brand-800 hover:border-brand-300 text-brand-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="export-format"
                    value="json"
                    checked={format === 'json'}
                    onChange={() => setFormat('json')}
                    className="sr-only"
                  />
                  <FileJson size={24} aria-hidden="true" />
                  <div>
                    <p className="font-bold text-sm">JSON</p>
                    <p className="text-[10px] opacity-70">Backup complet</p>
                  </div>
                  {format === 'json' && (
                    <Check size={14} className="ml-auto text-brand-500" aria-hidden="true" />
                  )}
                </label>

                <label
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    format === 'csv'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-800/50 text-brand-700 dark:text-brand-200'
                      : 'border-brand-100 dark:border-brand-800 hover:border-brand-300 text-brand-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="export-format"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={() => setFormat('csv')}
                    className="sr-only"
                  />
                  <FileSpreadsheet size={24} aria-hidden="true" />
                  <div>
                    <p className="font-bold text-sm">CSV</p>
                    <p className="text-[10px] opacity-70">Compatible Excel</p>
                  </div>
                  {format === 'csv' && (
                    <Check size={14} className="ml-auto text-brand-500" aria-hidden="true" />
                  )}
                </label>
              </div>
            </fieldset>

            {/* Collections */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                  Collections à inclure
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-[10px] font-bold uppercase tracking-wide text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                  >
                    Tout
                  </button>
                  <span className="text-brand-200 dark:text-brand-700">|</span>
                  <button
                    onClick={deselectAll}
                    className="text-[10px] font-bold uppercase tracking-wide text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                  >
                    Aucun
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {(Object.keys(COLLECTION_LABELS) as CollectionKey[]).map((key) => {
                  const isDisabledForCSV = format === 'csv' && !csvOnlyCollections.includes(key);
                  const count = (data[key] as unknown[]).length;
                  const checked = selectedCollections.has(key) && !isDisabledForCSV;

                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                        isDisabledForCSV
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-brand-50 dark:hover:bg-brand-800/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isDisabledForCSV}
                        onChange={() => !isDisabledForCSV && toggleCollection(key)}
                        className="w-4 h-4 rounded accent-brand-600"
                        aria-label={`Inclure ${COLLECTION_LABELS[key]}`}
                      />
                      <span className="flex-1 text-sm text-brand-700 dark:text-brand-300">
                        {COLLECTION_LABELS[key]}
                      </span>
                      <span className="text-xs font-mono text-brand-400 dark:text-brand-600 bg-brand-50 dark:bg-brand-800 px-2 py-0.5 rounded-full">
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>

              {format === 'csv' && (
                <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400">
                  Le format CSV exporte chaque collection dans un fichier séparé. Emails, modèles et
                  événements sont disponibles uniquement en JSON.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-brand-100 dark:border-brand-800">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-800 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || selectedCollections.size === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
              title="Lancer l'export"
            >
              <Download size={16} aria-hidden="true" />
              {isExporting ? 'Export en cours...' : `Exporter (${selectedCollections.size})`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExportModal;

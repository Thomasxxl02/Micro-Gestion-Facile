import React, { useState } from 'react';
import { X, Download, Loader2, AlertCircle } from 'lucide-react';
import { useExportData } from '../lib/useExportData';
import type { ExportData } from '../lib/exportUtils';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  data: Partial<ExportData>;
}

export const ExportModal: React.FC<ExportModalProps> = ({ open, onClose, data }) => {
  const { isExporting, progress, error, exportAllAsJSON, exportCollectionAsCSV, getExportStats } =
    useExportData();
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv'>('json');
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set(['all']));

  if (!open) {return null;}

  const stats = getExportStats(data);

  const collections = [
    { key: 'invoices', label: 'Factures', count: stats.counts.invoices },
    { key: 'clients', label: 'Clients', count: stats.counts.clients },
    { key: 'suppliers', label: 'Fournisseurs', count: stats.counts.suppliers },
    { key: 'products', label: 'Produits', count: stats.counts.products },
    { key: 'expenses', label: 'DÃ©penses', count: stats.counts.expenses },
    { key: 'emails', label: 'E-mails', count: stats.counts.emails },
    { key: 'calendarEvents', label: 'Ã‰vÃ©nements', count: stats.counts.calendarEvents },
  ];

  const handleExport = async () => {
    if (selectedCollections.has('all')) {
      // Export all data as JSON
      await exportAllAsJSON(data);
    } else if (selectedFormat === 'csv' && selectedCollections.size === 1) {
      // Export single collection as CSV
      const collection = Array.from(selectedCollections)[0];
      const items = data[collection as keyof ExportData] || [];
      await exportCollectionAsCSV(collection as any, items);
    } else {
      // Export multiple as JSON
      await exportAllAsJSON(data);
    }
    onClose();
  };

  const toggleCollection = (key: string) => {
    const newSelected = new Set(selectedCollections);
    if (newSelected.has('all')) {
      newSelected.delete('all');
    }
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedCollections(newSelected);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-brand-900 rounded-4xl shadow-2xl w-full max-w-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-brand-100 dark:border-brand-800">
          <div>
            <h2 className="text-2xl font-bold text-brand-900 dark:text-white">
              Exporter vos données
            </h2>
            <p className="text-brand-500 text-sm mt-1">
              Conformité RGPD Art. 20 - Droit à la portabilité
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-brand-100 dark:hover:bg-brand-800 rounded-xl transition-colors"
            title="Fermer"
          >
            <X size={24} className="text-brand-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Format selection */}
          <fieldset>
            <legend className="block text-sm font-bold text-brand-900 dark:text-white mb-3">
              Format
            </legend>
            <div className="flex gap-3">
              {(['json', 'csv'] as const).map((fmt) => {
                if (selectedFormat === fmt) {
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setSelectedFormat(fmt)}
                      aria-pressed="true"
                      className="flex-1 py-3 px-4 rounded-2xl font-medium transition-all bg-brand-900 text-white dark:bg-brand-700"
                    >
                      {fmt.toUpperCase()}
                    </button>
                  );
                }
                return (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    aria-pressed="false"
                    className="flex-1 py-3 px-4 rounded-2xl font-medium transition-all bg-brand-50 text-brand-900 dark:bg-brand-800 dark:text-brand-100"
                  >
                    {fmt.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Collections */}
          <div>
            <span className="block text-sm font-bold text-brand-900 dark:text-white mb-3">
              Collections
            </span>

            <label
              className={`w-full py-3 px-4 rounded-2xl font-medium transition-all mb-3 flex items-center cursor-pointer ${
                selectedCollections.has('all')
                  ? 'bg-brand-900 text-white dark:bg-brand-700'
                  : 'bg-brand-50 text-brand-900 dark:bg-brand-800 dark:text-brand-100'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedCollections.has('all')}
                onChange={() =>
                  setSelectedCollections(
                    selectedCollections.has('all') ? new Set() : new Set(['all'])
                  )
                }
                className="mr-2"
                aria-label="Exporter toutes les collections"
              />
              Exporter tout
            </label>

            {selectedCollections.has('all') ? (
              <div className="bg-brand-50 dark:bg-brand-800/50 rounded-2xl p-4 text-sm text-brand-700 dark:text-brand-300">
                <strong>Total:</strong>{' '}
                {Object.values(stats.counts).reduce((a: number, b: number) => a + b, 0)} documents (
                {stats.size.mb} MB)
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {collections.map((col) => (
                  <button
                    key={col.key}
                    onClick={() => toggleCollection(col.key)}
                    className={`p-3 rounded-xl text-left transition-all ${
                      selectedCollections.has(col.key)
                        ? 'bg-brand-100 dark:bg-brand-700 border-2 border-brand-900'
                        : 'bg-brand-50 dark:bg-brand-800 border-2 border-transparent hover:bg-brand-100 dark:hover:bg-brand-700'
                    }`}
                  >
                    <div className="font-medium text-brand-900 dark:text-white">{col.label}</div>
                    <div className="text-xs text-brand-500">{col.count} items</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <div className="shrink-0">
                <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <strong>RGPD compliant:</strong> Vos données restent confidentielles. Aucune donnée
                n&apos;est transmise à nos serveurs lors de l&apos;export.
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800 flex gap-3">
              <AlertCircle
                size={20}
                className="text-red-600 dark:text-red-400 shrink-0 mt-0.5"
              />
              <div className="text-sm text-red-800 dark:text-red-300">{error}</div>
            </div>
          )}

          {/* Progress */}
          {isExporting && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin text-brand-600" />
                <span className="text-sm font-medium text-brand-900 dark:text-white">
                  Exportation en cours...
                </span>
              </div>
              <progress
                className="w-full"
                value={progress}
                max={100}
                aria-label="Progression de l'exportation"
              />
              <div className="text-xs text-brand-600 dark:text-brand-400 text-right">
                {progress}%
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-8 border-t border-brand-100 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-800/50">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 py-3 px-4 rounded-2xl font-medium text-brand-900 dark:text-white bg-white dark:bg-brand-900 border border-brand-200 dark:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedCollections.size === 0}
            className="flex-1 py-3 px-4 rounded-2xl font-medium text-white bg-brand-900 dark:bg-brand-700 hover:bg-brand-800 dark:hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Export...
              </>
            ) : (
              <>
                <Download size={18} />
                Exporter
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;

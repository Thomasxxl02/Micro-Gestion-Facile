/**
 * Hook pour l'export de données depuis Zustand store
 * Utilisé dans SettingsManager
 */

import { useCallback, useState } from 'react';
import {
  exportAsJSON,
  exportAsCSV,
  downloadFile,
  generateFilename,
  estimateExportSize,
  countDocuments,
  type ExportData,
} from '../lib/exportUtils';

interface ExportState {
  isExporting: boolean;
  progress: number;
  error: string | null;
}

export const useExportData = () => {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    error: null,
  });

  /**
   * Exporte toutes données en JSON
   */
  const exportAllAsJSON = useCallback(async (data: Partial<ExportData>) => {
    setState({ isExporting: true, progress: 0, error: null });

    try {
      setState((s) => ({ ...s, progress: 25 }));

      // Validation
      if (!data.invoices || !data.clients) {
        throw new Error('Données incomplètes');
      }

      setState((s) => ({ ...s, progress: 50 }));

      // Génération JSON
      const json = await exportAsJSON(data);

      setState((s) => ({ ...s, progress: 75 }));

      // Téléchargement
      const filename = generateFilename('all-data', 'json');
      downloadFile(json, filename, 'application/json');

      setState({ isExporting: false, progress: 100, error: null });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setState({ isExporting: false, progress: 0, error: errorMsg });
    }
  }, []);

  /**
   * Exporte une collection en CSV
   */
  const exportCollectionAsCSV = useCallback(
    async (
      collection: keyof Exclude<ExportData, 'version' | 'exportedAt' | 'userProfile'>,
      items: unknown[]
    ) => {
      setState({ isExporting: true, progress: 0, error: null });

      try {
        setState((s) => ({ ...s, progress: 50 }));

        const csv = exportAsCSV(collection, items);

        setState((s) => ({ ...s, progress: 75 }));

        const filename = generateFilename(collection, 'csv');
        downloadFile(csv, filename, 'text/csv');

        setState({ isExporting: false, progress: 100, error: null });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
        setState({ isExporting: false, progress: 0, error: errorMsg });
      }
    },
    []
  );

  /**
   * Obtenir statistiques avant export
   */
  const getExportStats = useCallback((data: Partial<ExportData>) => {
    const counts = countDocuments(data);
    const size = estimateExportSize(data);
    return { counts, size };
  }, []);

  return {
    ...state,
    exportAllAsJSON,
    exportCollectionAsCSV,
    getExportStats,
    reset: () => setState({ isExporting: false, progress: 0, error: null }),
  };
};

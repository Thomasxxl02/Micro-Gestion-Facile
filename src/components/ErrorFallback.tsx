import { AlertTriangle, ChevronDown, RotateCcw } from "lucide-react";
import React, { useState } from "react";
import { logger } from "../lib/logger";

/**
 * Props for ErrorFallback
 */
interface ErrorFallbackProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  resetErrorBoundary: () => void;
}

/**
 * ErrorFallback - UI de fallback pour les erreurs React
 *
 * Affiche:
 * - Message d'erreur clair
 * - Bouton reset
 * - Stack trace (dev only)
 * - Bouton export logs pour debug
 */
export function ErrorFallback({
  error,
  errorInfo,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  const [showStack, setShowStack] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const handleExportLogs = async (): Promise<void> => {
    setExportLoading(true);
    try {
      const logs = await logger.exportLogs("json");
      const blob = new Blob([logs], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `error-logs-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      logger.info("ErrorFallback", "Logs exportés avec succès");
    } catch (err) {
      logger.error("ErrorFallback", "Erreur export logs", err);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 border-t-4 border-red-500">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-8 w-8 text-red-600 mt-1" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-red-900">
              Oups ! Quelque chose s'est mal passé
            </h1>
            <p className="mt-2 text-red-700">
              L'application a rencontré une erreur inattendue. Nos équipes
              techniques ont été notifiées.
            </p>
          </div>
        </div>

        {/* Error Details */}
        <div className="mt-6 bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm font-mono text-red-800">
            <strong>Erreur:</strong> {error.message || "Erreur inconnue"}
          </p>
          {error.name && (
            <p className="text-sm font-mono text-red-700 mt-1">
              <strong>Type:</strong> {error.name}
            </p>
          )}
        </div>

        {/* Stack Trace (Dev Only) */}
        {import.meta.env.DEV && errorInfo && (
          <div className="mt-4">
            <button
              onClick={() => setShowStack(!showStack)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              type="button"
            >
              <ChevronDown
                size={16}
                className={`transform transition-transform ${
                  showStack ? "rotate-180" : ""
                }`}
              />
              {showStack ? "Masquer" : "Afficher"} les détails techniques
            </button>

            {showStack && (
              <pre className="mt-3 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-64 text-xs">
                {errorInfo.componentStack}
              </pre>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={resetErrorBoundary}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            type="button"
          >
            <RotateCcw size={18} />
            Réessayer
          </button>

          {import.meta.env.DEV && (
            <button
              onClick={handleExportLogs}
              disabled={exportLoading}
              className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
              type="button"
            >
              {exportLoading ? "Exportation..." : "Exporter les logs"}
            </button>
          )}

          <button
            onClick={() => (window.location.href = "/")}
            className="text-center text-gray-600 hover:text-gray-900 font-semibold py-2 px-6 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
            type="button"
          >
            Retourner à l'accueil
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <details className="text-sm text-gray-600">
            <summary className="cursor-pointer font-semibold hover:text-gray-900">
              💡 Comment puis-je vous aider ?
            </summary>
            <ul className="mt-3 space-y-2 ml-4">
              <li className="list-disc">Vérifiez votre connexion Internet</li>
              <li className="list-disc">
                Videz le cache de votre navigateur{" "}
                <code className="bg-gray-100 px-1 rounded">
                  Ctrl+Shift+Delete
                </code>
              </li>
              <li className="list-disc">
                Essayez d'autre navigateur (Chrome, Firefox, Edge)
              </li>
              <li className="list-disc">
                Contactez{" "}
                <a
                  href="mailto:support@micro-gestion.fr"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  support@micro-gestion.fr
                </a>
              </li>
            </ul>
          </details>
        </div>

        {/* Error ID for tracking */}
        <div className="mt-6 text-center text-xs text-gray-400">
          ID Erreur: {Date.now()}
        </div>
      </div>
    </div>
  );
}

export default ErrorFallback;

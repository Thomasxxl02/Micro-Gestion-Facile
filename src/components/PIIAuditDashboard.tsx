/**
 * Dashboard d'audit PII - Visualisation des données masquées et statistiques
 *
 * Affiche:
 * - Nombre total de détections PII
 * - Répartition par type (email, IBAN, TVA, etc.)
 * - Répartition par contexte d'appel
 * - Répartition par type de requête
 * - Timeline des détections
 * - Patterns inconnus détectés
 *
 * Utile pour:
 * - Audit RGPD (démonstration du masquage)
 * - Identification de nouveaux patterns à couvrir
 * - Monitoring de la sécurité des requêtes Gemini
 */

import { useEffect, useState } from "react";
import { PIIAuditLogger, PIIStatistics } from "../lib/piiAuditLogger";
import "./PIIAuditDashboard.css";

interface DashboardState {
  statistics: PIIStatistics | null;
  loading: boolean;
  lastRefresh: number | null;
  autoRefreshInterval: number; // milliseconds
}

/**
 * Composant de dashboard pour visualiser les statistiques d'audit PII.
 */
export function PIIAuditDashboard() {
  const [state, setState] = useState<DashboardState>({
    statistics: null,
    loading: true,
    lastRefresh: null,
    autoRefreshInterval: 5000, // Rafraîchir chaque 5 secondes
  });

  // Charger les stats initiales
  useEffect(() => {
    refreshStats();
  }, []);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(refreshStats, state.autoRefreshInterval);
    return () => clearInterval(interval);
  }, [state.autoRefreshInterval]);

  // Update CSS variables for dynamic bar widths
  useEffect(() => {
    const bars = document.querySelectorAll<HTMLDivElement>(
      ".breakdown-bar[data-width]",
    );
    bars.forEach((bar) => {
      const width = bar.getAttribute("data-width");
      if (width) {
        bar.style.setProperty("--bar-width", `${width}%`);
      }
    });
  }, [state.statistics]);

  const refreshStats = () => {
    try {
      const stats = PIIAuditLogger.getStatistics();
      setState((prev) => ({
        ...prev,
        statistics: stats,
        loading: false,
        lastRefresh: Date.now(),
      }));
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques", error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleExportReport = () => {
    const report = PIIAuditLogger.exportAuditReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pii-audit-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    if (
      confirm(
        "Êtes-vous sûr ? Ceci effacera tous les enregistrements d'audit PII.",
      )
    ) {
      PIIAuditLogger.clearAllLogs();
      setState((prev) => ({
        ...prev,
        statistics: {
          totalDetections: 0,
          detectionsByType: {},
          detectionsByContext: {},
          detectionsByRequestType: {},
          lastDetectionTime: null,
          unknownPatterns: [],
        },
      }));
    }
  };

  if (state.loading) {
    return <div className="pii-dashboard loading">Chargement...</div>;
  }

  if (!state.statistics) {
    return (
      <div className="pii-dashboard error">
        Erreur lors du chargement des statistiques
      </div>
    );
  }

  const { statistics } = state;
  const successRate = statistics.totalDetections > 0 ? 100 : 0; // Tous les masquages sont considérés comme réussis

  return (
    <div className="pii-dashboard">
      <div className="dashboard-header">
        <h2>🔒 Audit PII - Sécurité des données</h2>
        <div className="header-actions">
          <button
            onClick={refreshStats}
            className="btn-refresh"
            title="Rafraîchir"
          >
            ↻ Actualiser
          </button>
          <button
            onClick={handleExportReport}
            className="btn-export"
            title="Exporter les logs"
          >
            📥 Exporter
          </button>
          <button
            onClick={handleClearLogs}
            className="btn-clear"
            title="Effacer les logs"
          >
            🗑️ Effacer
          </button>
        </div>
      </div>

      {/* Indicateurs principaux */}
      <div className="dashboard-metrics">
        <div className="metric-card primary">
          <div className="metric-label">Total des détections</div>
          <div className="metric-value">
            {statistics.totalDetections.toLocaleString()}
          </div>
          <div className="metric-sublabel">éléments PII masqués</div>
        </div>

        <div className="metric-card success">
          <div className="metric-label">Taux de succès</div>
          <div className="metric-value">{successRate.toFixed(0)}%</div>
          <div className="metric-sublabel">masquage sécurisé</div>
        </div>

        {statistics.lastDetectionTime && (
          <div className="metric-card info">
            <div className="metric-label">Dernière détection</div>
            <div className="metric-value">
              {new Date(statistics.lastDetectionTime).toLocaleTimeString(
                "fr-FR",
              )}
            </div>
            <div className="metric-sublabel">
              il y a{" "}
              {Math.round((Date.now() - statistics.lastDetectionTime) / 1000)}s
            </div>
          </div>
        )}
      </div>

      {/* Détections par type */}
      <div className="dashboard-section">
        <h3>Détections par type</h3>
        <div className="charts-grid">
          <div className="chart">
            <div className="chart-title">Types de PII détectés</div>
            <div className="type-breakdown">
              {Object.entries(statistics.detectionsByType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const percentage = (count / statistics.totalDetections) * 100;
                  return (
                    <div key={type} className="breakdown-item">
                      <div className="breakdown-label">
                        {getTypeLabel(type)}
                      </div>
                      <div className="breakdown-bar-container">
                        <div
                          className={`breakdown-bar type-${type}`}
                          data-width={percentage}
                        />
                        <div className="breakdown-count">{count}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Types de requêtes */}
          <div className="chart">
            <div className="chart-title">Répartition par type de requête</div>
            <div className="type-breakdown">
              {Object.entries(statistics.detectionsByRequestType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const percentage = (count / statistics.totalDetections) * 100;
                  return (
                    <div key={type} className="breakdown-item">
                      <div className="breakdown-label">
                        {getRequestTypeLabel(type)}
                      </div>
                      <div className="breakdown-bar-container">
                        <div
                          className={`breakdown-bar request-${type}`}
                          data-width={percentage}
                        />
                        <div className="breakdown-count">{count}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Contextes d'appel */}
      <div className="dashboard-section">
        <h3>Contextes d'appel</h3>
        <div className="context-list">
          {Object.entries(statistics.detectionsByContext)
            .sort(([, a], [, b]) => b - a)
            .map(([context, count]) => (
              <div key={context} className="context-item">
                <span className="context-name">{context}</span>
                <span className="context-count">{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Patterns inconnus */}
      {statistics.unknownPatterns.length > 0 && (
        <div className="dashboard-section warning">
          <h3>⚠️ Patterns inconnus détectés</h3>
          <p className="warning-text">
            Ces patterns ne correspondent à aucun format connu. Ils pourraient
            représenter de nouveaux types de PII à intégrer.
          </p>
          <div className="unknown-patterns">
            {statistics.unknownPatterns.map((pattern, idx) => (
              <div key={idx} className="pattern-item">
                <code>{pattern}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="dashboard-footer">
        <small>
          Dernière actualisation:{" "}
          {state.lastRefresh
            ? new Date(state.lastRefresh).toLocaleTimeString("fr-FR")
            : "jamais"}
        </small>
        <small>
          Auto-refresh: tous les {state.autoRefreshInterval}ms |{" "}
          <button
            onClick={() => {
              setState((prev) => ({
                ...prev,
                autoRefreshInterval:
                  prev.autoRefreshInterval === 5000 ? 10000 : 5000,
              }));
            }}
            className="btn-interval"
          >
            {state.autoRefreshInterval === 5000 ? "Ralentir" : "Accélérer"}
          </button>
        </small>
      </div>
    </div>
  );
}

/**
 * Mappe les types de PII à des étiquettes lisibles.
 */
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    email: "📧 Email",
    phoneFR: "📱 Téléphone FR",
    iban: "🏦 IBAN",
    card: "💳 Carte bancaire",
    siret: "🏢 SIRET",
    siren: "🏢 SIREN",
    tva: "📋 TVA",
    ssn: "🆔 Sécurité Sociale",
    ip: "🌐 Adresse IP",
    postal: "📍 Code Postal",
    unknown: "❓ Inconnu",
  };
  return labels[type] || type;
}

/**
 * Mappe les types de requêtes à des étiquettes lisibles.
 */
function getRequestTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    compliance: "✅ Conformité",
    financial: "💰 Financier",
    general: "💬 Général",
    email: "✉️ Email",
  };
  return labels[type] || type;
}

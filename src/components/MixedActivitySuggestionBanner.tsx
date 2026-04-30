/**
 * MixedActivitySuggestionBanner
 *
 * Bannière non-intrusive affichée dans le gestionnaire de factures quand
 * l'application détecte qu'un profil « service pur » commence à émettre
 * des factures de vente (operationCategory = "BIENS" ou "MIXTE").
 *
 * Actions proposées :
 *   • Activer le profil Mixte → marque isMixedActivity + activityTypeSecondary
 *   • Ignorer pour cette année → persist localStorage
 */

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import React from "react";
import type { MixedRevenueVentilation } from "../hooks/useMixedActivityDetection";
import type { UserProfile } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number): string =>
  amount.toLocaleString("fr-FR", { minimumFractionDigits: 0 }) + " €";

const formatPercent = (value: number): string =>
  Math.round(value).toLocaleString("fr-FR") + " %";

interface UsageBarProps {
  percent: number;
  isNear: boolean;
  isExceeded: boolean;
  label: string;
  current: number;
  limit: number;
}

const UsageBar: React.FC<UsageBarProps> = ({
  percent,
  isNear,
  isExceeded,
  label,
  current,
  limit,
}) => {
  const color = isExceeded
    ? "bg-red-500"
    : isNear
      ? "bg-amber-500"
      : "bg-sky-500";
  const width = `${Math.min(100, percent).toFixed(1)}%`;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold text-brand-700 dark:text-brand-200">
        <span>{label}</span>
        <span>
          {formatCurrency(current)} / {formatCurrency(limit)} (
          {formatPercent(percent)})
        </span>
      </div>
      <div className="h-2 w-full bg-brand-100 dark:bg-brand-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width }}
          role="progressbar"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface MixedActivitySuggestionBannerProps {
  /** Données de ventilation CA calculées par useMixedActivityDetection */
  ventilation: MixedRevenueVentilation;
  /** Profil utilisateur actuel (pour récupérer l'activityType libellé) */
  userProfile: UserProfile;
  /**
   * Callback appelé quand l'utilisateur accepte de passer en profil Mixte.
   * Reçoit les champs à mettre à jour dans le profil.
   */
  onActivate: (update: Partial<UserProfile>) => void;
  /** Callback d'annulation / "Ignorer pour cette année" */
  onDismiss: () => void;
}

// ─── Labels métier ────────────────────────────────────────────────────────────

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  SERVICE_BNC: "Service BNC",
  SERVICE_BIC: "Service BIC",
  LIBERAL: "Profession libérale",
  SALE: "Vente de marchandises",
};

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Bannière de suggestion d'activation du profil Mixte.
 * Affichée uniquement quand shouldShowSuggestion === true (voir useMixedActivityDetection).
 */
const MixedActivitySuggestionBanner: React.FC<
  MixedActivitySuggestionBannerProps
> = ({ ventilation, userProfile, onActivate, onDismiss }) => {
  const activityLabel =
    ACTIVITY_TYPE_LABELS[userProfile.activityType ?? "SERVICE_BNC"] ??
    "Service";

  const handleActivate = () => {
    onActivate({
      isMixedActivity: true,
      activityTypeSecondary: "SALE",
    });
    onDismiss(); // Ferme aussi la bannière
  };

  return (
    <div
      className="relative border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 rounded-2xl p-5 shadow-sm"
      role="alert"
      aria-label="Activité mixte détectée — suggestion de mise à jour du profil fiscal"
    >
      {/* ── Bouton fermeture ─────────────────────────────────────────────── */}
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
        aria-label="Ignorer cette suggestion pour l'année en cours"
        title="Ignorer pour cette année"
      >
        <X size={16} />
      </button>

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 pr-8">
        <div className="shrink-0 p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 rounded-xl">
          <AlertTriangle size={20} aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-bold text-amber-900 dark:text-amber-100 text-sm">
            Activité mixte détectée
          </h3>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
            Vous êtes déclaré en profil{" "}
            <span className="font-semibold">« {activityLabel} »</span>, mais
            certaines de vos factures contiennent des{" "}
            <span className="font-semibold">ventes de marchandises</span>. Les
            règles URSSAF 2026 imposent une ventilation séparée du chiffre
            d'affaires.
          </p>
        </div>
      </div>

      {/* ── Ventilation CA ───────────────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Colonne gauche : chiffres */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 size={13} aria-hidden="true" />
            Ventilation CA {new Date().getFullYear()}
          </p>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-amber-700 dark:text-amber-300">
                Ventes de marchandises
              </span>
              <span className="font-bold text-amber-900 dark:text-amber-100">
                {formatCurrency(ventilation.saleRevenue)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-amber-700 dark:text-amber-300">
                Prestations de services
              </span>
              <span className="font-bold text-amber-900 dark:text-amber-100">
                {formatCurrency(ventilation.serviceRevenue)}
              </span>
            </div>
            <div className="border-t border-amber-200 dark:border-amber-700 pt-1.5 flex justify-between text-xs">
              <span className="font-bold text-amber-800 dark:text-amber-200">
                Total
              </span>
              <span className="font-bold text-amber-900 dark:text-amber-100">
                {formatCurrency(ventilation.totalRevenue)}
              </span>
            </div>
          </div>

          <div className="border-t border-amber-200 dark:border-amber-700 pt-2 space-y-1">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider">
              Cotisations estimées
            </p>
            <div className="flex justify-between text-xs">
              <span className="text-amber-700 dark:text-amber-300">
                Sur ventes (12,3 %)
              </span>
              <span className="font-semibold text-amber-900 dark:text-amber-100">
                {formatCurrency(ventilation.saleContributions)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-amber-700 dark:text-amber-300">
                Sur services (23,2 %)
              </span>
              <span className="font-semibold text-amber-900 dark:text-amber-100">
                {formatCurrency(ventilation.serviceContributions)}
              </span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-amber-800 dark:text-amber-200">
                Total cotisations
              </span>
              <span className="text-amber-900 dark:text-amber-100">
                {formatCurrency(ventilation.totalContributions)}
              </span>
            </div>
          </div>
        </div>

        {/* Colonne droite : plafonds */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
            <Info size={13} aria-hidden="true" />
            Plafonds micro-entreprise
          </p>

          <div className="space-y-3">
            <UsageBar
              label="Global (Ventes + Services)"
              current={ventilation.totalRevenue}
              limit={ventilation.globalLimit}
              percent={ventilation.globalUsagePercent}
              isNear={ventilation.isGlobalNearLimit}
              isExceeded={ventilation.totalRevenue > ventilation.globalLimit}
            />
            {ventilation.serviceRevenue > 0 && (
              <UsageBar
                label="Prestations seules"
                current={ventilation.serviceRevenue}
                limit={ventilation.serviceLimit}
                percent={ventilation.serviceUsagePercent}
                isNear={ventilation.isServiceNearLimit}
                isExceeded={
                  ventilation.serviceRevenue > ventilation.serviceLimit
                }
              />
            )}
          </div>

          {ventilation.isAnyLimitExceeded && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-700 rounded-xl p-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle
                size={13}
                className="shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>
                Un seuil de la micro-entreprise est dépassé. Vérifiez votre
                situation avec votre expert-comptable.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap items-center gap-3 pt-4 border-t border-amber-200 dark:border-amber-700">
        <button
          onClick={handleActivate}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          aria-label="Activer le profil Mixte pour ventiler automatiquement le chiffre d'affaires"
        >
          <CheckCircle2 size={14} aria-hidden="true" />
          Activer le profil Mixte
          <ArrowRight size={13} aria-hidden="true" />
        </button>

        <button
          onClick={onDismiss}
          className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 underline underline-offset-2 transition-colors"
          aria-label="Ignorer cette suggestion pour le reste de l'année"
        >
          Ignorer pour cette année
        </button>

        <span className="text-xs text-amber-600 dark:text-amber-500 ml-auto">
          Source : URSSAF 2026
        </span>
      </div>
    </div>
  );
};

export default MixedActivitySuggestionBanner;

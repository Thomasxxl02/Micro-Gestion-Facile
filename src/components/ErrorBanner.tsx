/**
 * 🎨 ErrorBanner - Composant d'affichage d'erreurs unifié
 *
 * Fournit des retours d'erreur cohérents avec:
 * - Accessibilité WCAG 2.1 AAA (aria-live, role="alert")
 * - Icônes contextuelles selon le type d'erreur
 * - Dark mode support
 * - Animations fluides
 *
 * Typage: TypeScript strict
 * Patterns: React best practices avec useCallback
 */

import { CircleAlert as AlertCircle, Shield, Wifi, X } from "lucide-react";
import React, { useCallback } from "react";

export type ErrorType =
  | "network"
  | "auth"
  | "validation"
  | "security"
  | "unknown";

interface ErrorBannerProps {
  /** Message d'erreur à afficher (null hides banner) */
  error: string | null;
  /** Type d'erreur pour contexte icône + couleurs */
  type?: ErrorType;
  /** Callback quand utilisateur ferme la bannière */
  onDismiss?: () => void;
  /** Afficher bouton fermeture (défaut: true) */
  showDismiss?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
}

interface ErrorConfig {
  icon: typeof AlertCircle;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
  suggestion?: string;
}

const ERROR_CONFIGS: Record<ErrorType, ErrorConfig> = {
  network: {
    icon: Wifi,
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-500",
    textColor: "text-yellow-900 dark:text-yellow-100",
    iconColor: "text-yellow-500",
    suggestion: "Vérifiez votre connexion Internet et réessayez",
  },
  auth: {
    icon: Shield,
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-500",
    textColor: "text-red-900 dark:text-red-100",
    iconColor: "text-red-500",
    suggestion: "Vérifiez vos identifiants et réessayez",
  },
  validation: {
    icon: AlertCircle,
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-500",
    textColor: "text-orange-900 dark:text-orange-100",
    iconColor: "text-orange-500",
    suggestion: "Corrigez les erreurs et réessayez",
  },
  security: {
    icon: AlertCircle,
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    borderColor: "border-purple-600",
    textColor: "text-purple-900 dark:text-purple-100",
    iconColor: "text-purple-600",
    suggestion: "Pour des raisons de sécurité, veuillez réessayer",
  },
  unknown: {
    icon: AlertCircle,
    bgColor: "bg-gray-50 dark:bg-gray-900/20",
    borderColor: "border-gray-400",
    textColor: "text-gray-900 dark:text-gray-100",
    iconColor: "text-gray-500",
  },
};

/**
 * ErrorBanner - Bannière d'erreur réutilisable
 *
 * Usages:
 * ```tsx
 * <ErrorBanner
 *   error={error}
 *   type="auth"
 *   onDismiss={() => setError(null)}
 * />
 * ```
 *
 * Accessibilité:
 * - role="alert" pour notification immédiate aux lecteurs d'écran
 * - aria-live="polite" pour annoncer les changements
 * - aria-describedby pour suggestion d'aide
 */
export function ErrorBanner({
  error,
  type = "unknown",
  onDismiss,
  showDismiss = true,
  className = "",
}: ErrorBannerProps) {
  const config = ERROR_CONFIGS[type];
  const Icon = config.icon;

  // Handler dismissal avec cleanup
  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  // Handler fermeture avec touche Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && showDismiss) {
        handleDismiss();
      }
    },
    [handleDismiss, showDismiss],
  );

  // Si pas d'erreur, ne rien afficher
  if (!error) {
    return null;
  }

  const suggestionId = `error-suggestion-${Date.now()}`;

  return (
    <div
      className={`
        p-4 border-l-4 rounded-lg
        ${config.bgColor}
        ${config.borderColor}
        ${config.textColor}
        animate-fade-in
        transition-all duration-300
        shadow-md
        ${className}
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      aria-describedby={config.suggestion ? suggestionId : undefined}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start gap-4">
        {/* Icône */}
        <Icon
          size={20}
          className={`${config.iconColor} shrink-0 mt-0.5`}
          aria-hidden="true"
        />

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm sm:text-base mb-1">Erreur</h3>
          <p className="text-sm break-words">{error}</p>

          {/* Suggestion contextuelle */}
          {config.suggestion && (
            <p
              id={suggestionId}
              className="text-xs sm:text-sm opacity-75 mt-2 font-medium"
              role="doc-tip"
            >
              💡 {config.suggestion}
            </p>
          )}
        </div>

        {/* Bouton fermeture */}
        {showDismiss && onDismiss && (
          <button
            onClick={handleDismiss}
            className={`
              shrink-0 mt-0.5
              hover:opacity-75
              transition-opacity
              focus:outline-none
              focus:ring-2
              focus:ring-offset-2
              rounded-md
              p-1
              aria-label="Fermer le message d'erreur"
            `}
            aria-label="Fermer le message d'erreur"
            title="Fermer (Échap)"
          >
            <X size={18} className={`${config.iconColor}`} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorBanner;

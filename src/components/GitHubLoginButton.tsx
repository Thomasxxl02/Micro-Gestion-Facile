/**
 * Bouton de Connexion GitHub - Composant Réutilisable
 * ✅ Accessibilité (a11y) complète
 * ✅ Gestion d'erreurs avec feedback utilisateur
 * ✅ Support offline avec retry
 * ✅ Animations et loading states
 */

import { LoaderCircle as Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useGitHubAuth } from "../hooks/useGitHubAuth";

export interface GitHubLoginButtonProps {
  readonly onSuccess?: (username: string) => void;
  readonly onError?: (error: Error) => void;
  readonly label?: string;
  readonly className?: string;
  readonly showText?: boolean;
  readonly rememberMe?: boolean;
  readonly disabled?: boolean;
}

/**
 * Button Connexion GitHub amélioré avec Tailwind CSS
 */
export function GitHubLoginButton({
  onSuccess,
  onError,
  label = "Se connecter avec GitHub",
  className = "",
  showText = true,
  rememberMe = true,
  disabled = false,
}: GitHubLoginButtonProps) {
  const { loginWithGitHub, isLoading, error, user } = useGitHubAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Déterminer l'état disabled global (parent + local)
  const isDisabled = disabled || isLoading;

  // Réinitialiser les erreurs quand l'utilisateur est connecté
  useEffect(() => {
    if (user) {
      setLocalError(null);
      onSuccess?.(user.displayName || user.email || "Utilisateur");
    }
  }, [user, onSuccess]);

  // Notifier les erreurs
  useEffect(() => {
    if (error) {
      setLocalError(error.message);
      onError?.(error);
    }
  }, [error, onError]);

  // Annuler le retry si le composant est démonté
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = async () => {
    try {
      setLocalError(null);
      await loginWithGitHub(rememberMe);

      // Réinitialiser le compteur de retry en cas de succès
      setRetryCount(0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erreur connexion");

      // Retry automatique pour les erreurs réseau (max 3 tentatives)
      if (error.message.includes("réseau") && retryCount < 3) {
        setRetryCount((prev) => prev + 1);
        // Backoff exponentiel avec référence stockée pour annulation au démontage
        retryTimeoutRef.current = setTimeout(
          handleClick,
          Math.pow(2, retryCount) * 1000,
        );
      } else {
        setLocalError(error.message);
        onError?.(error);
      }
    }
  };

  // Déterminer le texte à afficher
  let displayText = label;
  if (isLoading) {
    displayText = "Connexion en cours...";
  } else if (retryCount > 0) {
    displayText = `Reconnexion (tentative ${retryCount}/3)...`;
  }

  return (
    <div className={`w-full flex flex-col gap-4 ${className}`}>
      <button
        onClick={handleClick}
        disabled={isDisabled}
        aria-label={showText ? displayText : "Se connecter avec GitHub"}
        title={showText ? "" : label}
        className={`
          w-full flex items-center justify-center gap-3 px-4 py-3 sm:py-4
          rounded-2xl font-bold
          transition-all duration-200
          shadow-lg
          hover:scale-100 sm:hover:scale-[1.02]
          active:scale-95
          disabled:opacity-60
          disabled:cursor-not-allowed
          disabled:scale-100
          group
          ${
            className.includes("bg-")
              ? ""
              : "bg-white dark:bg-brand-900/50 text-gray-900 dark:text-white border-2 border-brand-200 dark:border-brand-800 hover:border-brand-300 dark:hover:border-brand-700"
          }
        `}
      >
        <div className="flex items-center gap-3 h-6">
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
          )}
          {showText && <span>{displayText}</span>}
        </div>
      </button>

      {localError && (
        <div
          className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg animate-in fade-in slide-in-from-top-4 duration-300"
          role="alert"
          aria-live="polite"
        >
          <span className="shrink-0 text-lg">⚠️</span>
          <div className="flex-1">
            <p className="font-bold text-red-800 dark:text-red-200 text-sm">
              Erreur de connexion
            </p>
            <p className="text-red-700 dark:text-red-300 text-xs mt-1">
              {localError}
            </p>
          </div>
          <button
            onClick={() => setLocalError(null)}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-200 transition-colors"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

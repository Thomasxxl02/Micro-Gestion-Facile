/**
 * Bouton de Connexion GitHub - Composant Réutilisable
 * ✅ Accessibilité (a11y) complète
 * ✅ Gestion d'erreurs avec feedback utilisateur
 * ✅ Support offline avec retry
 * ✅ Animations et loading states
 */

import React, { useState, useRef, useEffect } from 'react';
import { useGitHubAuth } from '../hooks/useGitHubAuth';
import styles from '../components/LoginComponents.module.css';

export interface GitHubLoginButtonProps {
  readonly onSuccess?: (username: string) => void;
  readonly onError?: (error: Error) => void;
  readonly label?: string;
  readonly className?: string;
  readonly showText?: boolean;
}

/**
 * Button Connexion GitHub amélioré
 */
export function GitHubLoginButton({
  onSuccess,
  onError,
  label = 'Se connecter avec GitHub',
  className = '',
  showText = true,
}: GitHubLoginButtonProps) {
  const { loginWithGitHub, isLoading, error, user } = useGitHubAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Réinitialiser les erreurs quand l'utilisateur est connecté
  useEffect(() => {
    if (user) {
      setLocalError(null);
      onSuccess?.(user.displayName || user.email || 'Utilisateur');
    }
  }, [user, onSuccess]);

  // Notifier les erreurs
  useEffect(() => {
    if (error) {
      setLocalError(error.message);
      onError?.(error);
    }
  }, [error, onError]);

  const handleClick = async () => {
    try {
      // Créer un AbortController pour annulation
      abortControllerRef.current = new AbortController();

      setLocalError(null);
      await loginWithGitHub();

      // Réinitialiser le compteur de retry en cas de succès
      setRetryCount(0);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Erreur connexion');

      // Retry automatique pour les erreurs réseau (max 3 tentatives)
      if (
        error.message.includes('réseau') &&
        retryCount < 3
      ) {
        setRetryCount((prev) => prev + 1);
        // Attendre avant retry (backoff exponentiel)
        setTimeout(handleClick, Math.pow(2, retryCount) * 1000);
      } else {
        setLocalError(error.message);
        onError?.(error);
      }
    }
  };

  const _handleCancel = () => {
    abortControllerRef.current?.abort();
  };

  // Déterminer le texte à afficher
  let displayText = label;
  if (isLoading) {
    displayText = 'Connexion en cours...';
  } else if (retryCount > 0) {
    displayText = `Reconnexion (tentative ${retryCount}/3)...`;
  }

  return (
    <div className={`${styles.githubLoginContainer} ${className}`}>
      <button
        onClick={handleClick}
        disabled={isLoading}
        aria-label={showText ? displayText : 'Se connecter avec GitHub'}
        className={`${styles.githubLoginButton} ${
          isLoading ? styles.loading : ''
        }`}
        title={showText ? '' : label}
      >
        {/* GitHub Icon SVG */}
        <svg
          aria-hidden="true"
          width={showText ? '20' : '24'}
          height={showText ? '20' : '24'}
          viewBox="0 0 16 16"
          fill="currentColor"
          className={styles.githubIcon}
        >
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
        </svg>

        {showText && <span>{displayText}</span>}
      </button>

      {/* Message d'erreur */}
      {localError && (
        <div
          className={styles.errorMessage}
          role="alert"
          aria-live="polite"
        >
          <span className={styles.errorIcon}>⚠️</span>
          <div className={styles.errorContent}>
            <p className={styles.errorTitle}>Erreur de connexion</p>
            <p className={styles.errorText}>{localError}</p>
            {retryCount < 3 && (
              <p className={styles.errorHint}>
                Nouvelle tentative en cours...
              </p>
            )}
          </div>
          <button
            onClick={() => setLocalError(null)}
            aria-label="Fermer le message d'erreur"
            className={styles.closeError}
          >
            ✕
          </button>
        </div>
      )}

      {/* Affichage du nombre de tentatives */}
      {retryCount > 0 && (
        <progress
          value={retryCount}
          max={3}
          className={styles.retryProgress}
          aria-label={`Tentative ${retryCount} sur 3`}
        />
      )}
    </div>
  );
}

/**
 * Composant Bloc de Connexion Complète
 */
export function GitHubLoginBlock() {
  const { isAuthenticated, user, logout, isLoading } = useGitHubAuth();

  if (isAuthenticated && user) {
    return (
      <div className={styles.userBlock}>
        <div className={styles.userInfo}>
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Profil'}
              className={styles.avatar}
            />
          )}
          <div className={styles.userDetails}>
            <h3>{user.displayName}</h3>
            <p>{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          disabled={isLoading}
          className={styles.logoutButton}
          aria-label="Se déconnecter"
        >
          Déconnexion
        </button>
      </div>
    );
  }

  return <GitHubLoginButton showText={true} />;
}

export default GitHubLoginButton;

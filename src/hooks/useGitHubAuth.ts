/**
 * Hook Authentification GitHub - useGitHubAuth
 * ✅ Gestion complète du cycle de vie d'authentification GitHub
 * ✅ Gestion d'erreurs avec fallback
 * ✅ Synchronisation avec Firestore
 * ✅ Récupération du profil utilisateur
 */

import { useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { auth, db, githubProvider } from '../firebase';
import { GitHubAuthService, UserProfile, AuthErrorHandler } from '../services/authService';
import { signInWithPopup, signOut } from 'firebase/auth';

export interface UseGitHubAuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
}

export interface UseGitHubAuthMethods {
  loginWithGitHub: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}

/**
 * Hook personnalisé pour l'authentification GitHub
 * @returns État et méthodes d'authentification
 */
export function useGitHubAuth(): UseGitHubAuthState & UseGitHubAuthMethods {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const authService = new GitHubAuthService(auth, db);

  // Effet : Écoute les changements d'authentification Firebase
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        setIsLoading(true);
        setUser(firebaseUser);

        if (firebaseUser) {
          // Récupérer le profil utilisateur depuis Firestore
          const userProfile = await authService.getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
          setError(null);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Erreur récupération profil:', err);
        setError(err instanceof Error ? err : new Error('Erreur authentification'));
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Connexion avec GitHub
  const loginWithGitHub = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await signInWithPopup(auth, githubProvider);
      setUser(result.user);

      // Récupérer le profil
      const userProfile = await authService.getUserProfile(result.user.uid);
      setProfile(userProfile);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur connexion');

      // Gestion spécifique des erreurs
      if (AuthErrorHandler.isNetworkError(error)) {
        setError(
          new Error(
            'Erreur réseau. Vérifiez votre connexion Internet.'
          )
        );
      } else if (AuthErrorHandler.isAccountConflictError(error)) {
        setError(
          new Error(
            'Ce compte GitHub est déjà associé à un autre compte.'
          )
        );
      } else {
        setError(error);
      }

      console.error('Erreur connexion GitHub:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Déconnexion
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      setUser(null);
      setProfile(null);
      setError(null);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Erreur déconnexion');
      setError(error);
      console.error('Erreur déconnexion:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efface les erreurs
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Rafraîchir le profil utilisateur
  const refreshProfile = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userProfile = await authService.getUserProfile(user.uid);
      setProfile(userProfile);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Erreur rafraîchissement');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    user,
    profile,
    isLoading,
    error,
    isAuthenticated: !!user,
    loginWithGitHub,
    logout,
    clearError,
    refreshProfile,
  };
}

/**
 * Hook pour des cas d'usage simple (just login/logout)
 * Version allégée de useGitHubAuth
 */
export function useSimpleGitHubAuth() {
  const {
    user,
    isLoading,
    error,
    isAuthenticated,
    loginWithGitHub,
    logout,
  } = useGitHubAuth();

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    login: loginWithGitHub,
    logout,
  };
}

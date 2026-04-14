/**
 * Service d'Authentification Avancé - GitHub OAuth + Multi-Provider
 * ✅ GitHub OAuth avec permissions granulaires
 * ✅ Gestion de session sécurisée
 * ✅ Synchronisation du profil utilisateur
 * ✅ Gestion des erreurs et fallback
 */

import {
  fetchSignInMethodsForEmail,
  GithubAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  multiFactor,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut,
  type Auth,
  type AuthError,
  type User,
  type UserCredential,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: 'github' | 'google' | 'email';
  githubUsername?: string;
  createdAt: Date;
  lastLoginAt: Date;
  isVerified: boolean;
  preferredMFA?: 'totp' | 'sms' | 'none';
}

export interface AuthError2FA {
  code: string;
  message: string;
  requiresMFA: boolean;
}

/**
 * Service d'authentification GitHub avec Firebase
 */
export class GitHubAuthService {
  private auth: Auth;
  private db: Firestore;
  private githubProvider: GithubAuthProvider;

  constructor(auth: Auth, db: Firestore) {
    this.auth = auth;
    this.db = db;

    // Initialiser GitHub Provider avec permissions granulaires
    this.githubProvider = new GithubAuthProvider();

    // Scopes recommandés pour micro-entrepreneurs
    // 'user' - Accès au profil public et email
    // 'repo' - Accès aux repositories (optionnel, pour sync future)
    this.githubProvider.addScope('user:email');
    this.githubProvider.addScope('read:user');

    // Force la réauthentification GitHub à chaque connexion
    this.githubProvider.setCustomParameters({
      prompt: 'consent', // Force la sélection du compte
      allow_signup: 'true', // Permet l'inscription
    });
  }

  /**
   * Connexion avec GitHub OAuth
   * @returns UserCredential avec les données GitHub
   */
  async loginWithGitHub(): Promise<UserCredential> {
    try {
      const result = await signInWithPopup(this.auth, this.githubProvider);

      // Sauvegarder les données utilisateur dans Firestore
      await this.syncUserProfileToFirestore(result.user);

      return result;
    } catch (error: any) {
      if (error?.code === 'auth/account-exists-with-different-credential') {
        return this.handleAccountLink(error);
      }
      throw this.handleAuthError(error);
    }
  }

  /**
   * Gère la liaison automatique des comptes en cas de conflit
   * @param error L'erreur Firebase Auth contenant les credentials
   */
  private async handleAccountLink(error: AuthError): Promise<UserCredential> {
    const pendingCredential = GithubAuthProvider.credentialFromError(error);
    const email = error.customData?.email as string;

    if (!pendingCredential || !email) {
      throw this.handleAuthError(error);
    }

    // 1. Chercher les méthodes de connexion pour cet email
    const methods = await fetchSignInMethodsForEmail(this.auth, email);

    // 2. Si un compte Google existe, proposer de lier via popup
    if (methods.includes(GoogleAuthProvider.PROVIDER_ID)) {
      const googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ login_hint: email });

      // Demander à l'utilisateur de se connecter d'abord avec Google
      const result = await signInWithPopup(this.auth, googleProvider);

      // Lier le credential GitHub au compte Google fraîchement connecté
      await linkWithCredential(result.user, pendingCredential);

      // Synchroniser le profil
      await this.syncUserProfileToFirestore(result.user);

      return result;
    }

    // Fallback : erreur par défaut si on ne peut pas lier automatiquement
    throw this.handleAuthError(error);
  }

  /**
   * Reauthentification avec GitHub (pour opérations sensibles)
   * @returns UserCredential
   */
  async reauthenticateWithGitHub(user: User): Promise<UserCredential> {
    try {
      const result = await reauthenticateWithPopup(user, this.githubProvider);
      return result;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Synchronise le profil utilisateur GitHub vers Firestore
   * Crée ou met à jour le document utilisateur
   */
  private async syncUserProfileToFirestore(user: User): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', user.uid);

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await getDoc(userRef);

      const profileData: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: 'github',
        githubUsername: user.displayName?.split('/')[1] || (user.displayName ?? undefined),
        lastLoginAt: new Date(),
        isVerified: user.emailVerified,
      };

      if (!existingUser.exists()) {
        // Nouvel utilisateur - Initialisation des métadonnées métier par défaut
        await setDoc(userRef, {
          ...profileData,
          currency: 'EUR',
          taxSystem: 'auto-entrepreneur',
          activityType: 'SERVICE_BNC',
          isVatExempt: true,
          vatExemptionReason: 'Franchise en base de TVA - Art. 293 B du CGI',
          createdAt: new Date(),
        });
      } else {
        // Utilisateur existant - mise à jour
        await updateDoc(userRef, {
          ...profileData,
          lastLoginAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Erreur synchronisation profil Firestore:', error);
      // Ne pas bloquer la connexion si la sync échoue
    }
  }

  /**
   * Récupère le profil utilisateur complet
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(this.db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      return null;
    }
  }

  /**
   * Met à jour les informations du profil utilisateur
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userId);
      const { uid: _uid, createdAt: _createdAt, ...updatableFields } = updates;

      await updateDoc(userRef, {
        ...updatableFields,
        lastLoginAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      throw error;
    }
  }

  /**
   * Demande de réinitialisation de mot de passe
   * (Pour utilisateurs avec email authentification)
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email, {
        url: `/login?return_url=/dashboard`,
        handleCodeInApp: true,
      });
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Déconnexion sécurisée
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      // Nettoyer les données sensibles du localStorage
      this.clearSensitiveData();
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      throw error;
    }
  }

  /**
   * Gestion centralisée des erreurs d'authentification
   */
  private handleAuthError(error: unknown): Error {
    if (!(error instanceof Error)) {
      return new Error('Erreur authentification inconnue');
    }

    const firebaseError = error as AuthError;

    const errorMessages: Record<string, string> = {
      'auth/cancelled-popup-request': 'Popup fermée. Veuillez réessayer.',
      'auth/popup-blocked': 'Les popups sont bloquées. Veuillez les autoriser.',
      'auth/popup-closed-by-user': "Connexion annulée par l'utilisateur.",
      'auth/account-exists-with-different-credential':
        'Un compte existe déjà avec cet email. Nous avons tenté de lier vos comptes, veuillez réessayer la connexion Google si nécessaire ou contacter le support.',
      'auth/credential-already-in-use': 'Ces identifiants sont déjà associés à un compte.',
      'auth/user-disabled': 'Ce compte a été désactivé.',
      'auth/user-not-found': 'Utilisateur non trouvé.',
      'auth/wrong-password': 'Mot de passe incorrect.',
      'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard.',
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion internet.',
      'auth/operation-not-allowed': "Cette méthode d'authentification n'est pas activée.",
    };

    const userMessage =
      errorMessages[firebaseError.code] ||
      "Erreur d'authentification: " + (firebaseError.message || 'Inconnue');

    const customError = new Error(userMessage);
    customError.cause = firebaseError;
    return customError;
  }

  /**
   * Nettoie les données sensibles du localStorage
   */
  private clearSensitiveData(): void {
    const sensitiveKeys = ['emailForSignIn', 'tempAuthToken', 'mfaToken', 'sessionToken'];

    sensitiveKeys.forEach((key) => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Vérifie si 2FA est configuré pour cet utilisateur
   */
  async check2FAEnabled(user: User): Promise<boolean> {
    try {
      const mfaUser = multiFactor(user);
      return mfaUser.enrolledFactors.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Obtient le provider principal de l'utilisateur
   */
  getProviderForUser(user: User): 'github' | 'google' | 'email' | 'unknown' {
    if (!user.providerData || user.providerData.length === 0) {
      return 'unknown';
    }

    const provider = user.providerData[0].providerId;
    if (provider.includes('github')) {
      return 'github';
    }
    if (provider.includes('google')) {
      return 'google';
    }
    if (provider.includes('email')) {
      return 'email';
    }
    return 'unknown';
  }
}

/**
 * Utility pour les erreurs d'authentification
 */
export class AuthErrorHandler {
  static isNetworkError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    const firebaseError = error as AuthError;
    return firebaseError.code === 'auth/network-request-failed';
  }

  static isAccountConflictError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    const firebaseError = error as AuthError;
    return [
      'auth/account-exists-with-different-credential',
      'auth/credential-already-in-use',
      'auth/email-already-in-use',
    ].includes(firebaseError.code);
  }

  static isPermanentError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    const firebaseError = error as AuthError;
    return ['auth/operation-not-allowed', 'auth/user-disabled', 'auth/invalid-api-key'].includes(
      firebaseError.code
    );
  }
}

import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  doc,
  getDocFromServer,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import firebaseConfig from '../config/firebase-applet-config.json';

/**
 * 🚀 Singleton Firebase Initialization
 *
 * Performance: Réutilise l'instance existante si disponible (SSR/HMR safe)
 * Persistance: Active la persistance multi-onglets nativement
 */
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with Multi-Tab Persistence
export const db = initializeFirestore(
  app,
  {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  },
  firebaseConfig.firestoreDatabaseId
);

export const auth = getAuth(app);
export const storage = getStorage(app);

// Emulateurs local (développement uniquement)
if (import.meta.env?.DEV && import.meta.env?.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectStorageEmulator(storage, 'localhost', 9199);
  console.info('🔌 Connecté aux émulateurs Firebase');
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// GitHub OAuth Provider - Améliorations sécurité 2026
export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('user:email');
githubProvider.addScope('read:user');
githubProvider.setCustomParameters({
  prompt: 'consent' as const,
  allow_signup: 'true',
});

/**
 * 🛡️ Test de connexion robuste avec gestion du timeout
 */
async function testConnection() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const testDoc = doc(db, 'test', 'connection');
    await getDocFromServer(testDoc);
    clearTimeout(timeoutId);
    console.debug('✅ Firebase: Connexion établie');
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('⚠️ Firebase: Timeout lors du test de connexion (Lenteur réseau)');
      } else if (error.message.includes('the client is offline')) {
        console.info('ℹ️ Firebase: Travailler en mode hors ligne');
      } else {
        console.error('❌ Firebase: Erreur de configuration', error.message);
      }
    }
  }
}

// Lancer le test de connexion
if (import.meta.env?.DEV) {
  testConnection().catch(console.error);
}

// Auth helpers
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const loginWithGitHub = () => signInWithPopup(auth, githubProvider);
export const logout = () => signOut(auth);

/**
 * Génère un nonce sécurisé (16 bytes hex)
 * @returns Chaîne hexadécimale de 32 caractères
 *
 * Sécurité: CSPRNG via crypto.getRandomValues()
 */
function generateNonce(): string {
  const nonce = new Uint8Array(16);
  crypto.getRandomValues(nonce);
  return Array.from(nonce)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 🔒 Envoie un lien de connexion par e-mail avec nonce + TTL
 *
 * Sécurité (RGPD & Prévention CSRF):
 * - Nonce unique par tentative (stocké dans Firestore)
 * - TTL: 15 minutes après création
 * - Émis seulement si email validé
 *
 * @param email Email validé de l'utilisateur
 * @returns Promise<{success: true, nonce: string}>
 *
 * @throws {FirebaseError} Si Firestore non accessible
 *
 * Firestore writes:
 * - Collection: emailLoginRequests
 * - Document: {nonce} (ID = hex nonce)
 * - Data: { email, createdAt, ttl, used: false }
 */
export const sendEmailLink = async (email: string) => {
  // 1. Générer nonce unique
  const nonce = generateNonce();
  const expiryTTL = Date.now() + 15 * 60 * 1000; // 15 min

  // 2. Créer action code settings avec nonce dans URL
  const actionCodeSettings = {
    url: `${globalThis.location.origin}/login-callback?nonce=${nonce}`,
    handleCodeInApp: true,
  };

  try {
    // 3. Envoyer lien Firebase Auth
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);

    // 4. Sauvegarder nonce dans Firestore avec TTL
    await setDoc(doc(db, 'emailLoginRequests', nonce), {
      email,
      createdAt: serverTimestamp(),
      expiryTTL, // Unix timestamp pour cleanup TTL
      used: false,
      attempts: 0,
    });

    // 5. Sauvegarder email localement pour multi-device flow
    globalThis.localStorage.setItem('emailForSignIn', email);
    globalThis.localStorage.setItem('nonceForSignIn', nonce);

    console.info(`✅ Email lien envoyé à ${email} (nonce: ${nonce.slice(0, 8)}...)`);
    return { success: true, nonce };
  } catch (error) {
    console.error(
      "❌ Erreur d'envoi du lien e-mail :",
      error instanceof Error ? error.message : error
    );
    throw error;
  }
};

/**
 * 🔒 Valide et utilise un nonce email (prévention CSRF/replay)
 *
 * @param nonce Nonce reçu dans l'URL de callback
 * @returns Promise<boolean> True si nonce valide + non expiré
 *
 * @throws {Error} Si nonce invalide/expiré/déjà utilisé
 *
 * Vérifications:
 * 1. Nonce existe dans Firestore
 * 2. Pas expiré (expiryTTL > now)
 * 3. Pas déjà utilisé (used: false)
 * 4. Marquer comme utilisé après validation
 */
export const validateEmailNonce = async (nonce: string): Promise<boolean> => {
  if (!nonce || nonce.length !== 32) {
    throw new Error('Nonce invalide ou manquant');
  }

  try {
    // 1. Récupérer le document nonce
    const nonceDoc = doc(db, 'emailLoginRequests', nonce);
    const nonceSnapshot = await getDocFromServer(nonceDoc);

    if (!nonceSnapshot.exists()) {
      throw new Error('Lien de connexion introuvable');
    }

    const nonceData = nonceSnapshot.data();

    // 2. Vérifier expiration TTL
    if (Date.now() > nonceData.expiryTTL) {
      throw new Error('Lien expiré (15 minutes maximum)');
    }

    // 3. Vérifier si déjà utilisé
    if (nonceData.used === true) {
      throw new Error('Lien déjà utilisé');
    }

    // 4. Vérifier nombre de tentatives (max 5)
    if (nonceData.attempts >= 5) {
      throw new Error('Trop de tentatives - lien invalidé');
    }

    // 5. Incrémenter tentatives
    await setDoc(nonceDoc, { attempts: nonceData.attempts + 1 }, { merge: true });

    console.info(`✅ Nonce valide (${nonceData.attempts + 1} tentative(s))`);
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ Validation nonce échouée:', msg);
    throw error;
  }
};

export const completeEmailLinkSignIn = async () => {
  if (isSignInWithEmailLink(auth, globalThis.location.href)) {
    const url = new URL(globalThis.location.href);
    const nonce = url.searchParams.get('nonce');

    // Valider nonce si présent
    if (nonce) {
      try {
        await validateEmailNonce(nonce);
      } catch (error) {
        console.error('Validation nonce échouée:', error);
        throw error;
      }
    }

    let email = globalThis.localStorage.getItem('emailForSignIn');

    if (!email) {
      // Si l'utilisateur a ouvert le lien sur un autre appareil/navigateur
      email = globalThis.prompt('Veuillez fournir votre e-mail pour confirmation :');
    }

    if (email) {
      try {
        const result = await signInWithEmailLink(auth, email, globalThis.location.href);

        // Marquer nonce comme utilisé après succès
        if (nonce) {
          await setDoc(doc(db, 'emailLoginRequests', nonce), { used: true }, { merge: true });
        }

        // Nettoyer localStorage
        globalThis.localStorage.removeItem('emailForSignIn');
        globalThis.localStorage.removeItem('nonceForSignIn');

        console.info('✅ Connexion par email finalisée');
        return result;
      } catch (error) {
        console.error('Erreur de finalisation de connexion :', error);
        throw error;
      }
    }
  }
  return null;
};

// Error handling helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  let errorMessage = 'Unknown error';
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (typeof error === 'object' && error !== null) {
    errorMessage = JSON.stringify(error);
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Connection test (run async)
async function testConnection() {
  try {
    const testDoc = doc(db, 'test', 'connection');
    await getDocFromServer(testDoc);
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Test connection asynchronously without top-level await
testConnection().catch(console.error);

// Auth helpers
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

/**
 * Envoie un lien de connexion par e-mail
 */
export const sendEmailLink = async (email: string) => {
  const actionCodeSettings = {
    // L'URL de redirection après clic dans l'e-mail
    // En production, utilisez votre domaine final
    url: globalThis.location.origin + '/login-callback',
    handleCodeInApp: true,
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Sauvegarder l'e-mail localement pour compléter la connexion au retour
    globalThis.localStorage.setItem('emailForSignIn', email);
    return { success: true };
  } catch (error) {
    console.error("Erreur d'envoi du lien e-mail :", error);
    throw error;
  }
};

/**
 * Finalise la connexion après clic sur le lien reçu par e-mail
 */
export const completeEmailLinkSignIn = async () => {
  if (isSignInWithEmailLink(auth, globalThis.location.href)) {
    let email = globalThis.localStorage.getItem('emailForSignIn');

    if (!email) {
      // Si l'utilisateur a ouvert le lien sur un autre appareil/navigateur
      email = globalThis.prompt('Veuillez fournir votre e-mail pour confirmation :');
    }

    if (email) {
      try {
        const result = await signInWithEmailLink(auth, email, globalThis.location.href);
        globalThis.localStorage.removeItem('emailForSignIn');
        return result;
      } catch (error) {
        console.error("Erreur de finalisation de connexion :", error);
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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

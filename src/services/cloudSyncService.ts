/**
 * cloudSyncService.ts
 * Service pour la synchronisation des données vers Google Drive et Dropbox
 */

import { toast } from 'sonner';

export type CloudProvider = 'google_drive' | 'dropbox' | 'onedrive';

/**
 * Interface pour les jetons OAuth
 */
export interface OAuthToken {
  provider: CloudProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

const STORAGE_KEY_PREFIX = 'mgf_oauth_';

/**
 * Lance le flux OAuth pour le fournisseur spécifié
 */
export const initiateOAuthFlow = async (provider: CloudProvider): Promise<void> => {
  // En production, ces URLs viendraient de variables d'environnement
  const config = {
    google_drive: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      clientId: 'YOUR_GOOGLE_CLIENT_ID',
      scope: 'https://www.googleapis.com/auth/drive.file',
    },
    dropbox: {
      authUrl: 'https://www.dropbox.com/oauth2/authorize',
      clientId: 'YOUR_DROPBOX_CLIENT_ID',
      scope: 'files.metadata.write files.content.write',
    },
    onedrive: {
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      clientId: 'YOUR_ONEDRIVE_CLIENT_ID',
      scope: 'files.readwrite offline_access',
    },
  };

  const providerConfig = config[provider];
  const redirectUri = `${window.location.origin}/oauth-callback`;
  const state = window.window.btoa(JSON.stringify({ provider, timestamp: Date.now() }));

  const url =
    `${providerConfig.authUrl}?` +
    `client_id=${providerConfig.clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=token&` +
    `scope=${encodeURIComponent(providerConfig.scope)}&` +
    `state=${state}`;

  // Ouverture d'une fenêtre de popup pour l'auth
  const width = 600;
  const height = 700;
  const left = window.screenX + (window.innerWidth - width) / 2;
  const top = window.screenY + (window.innerHeight - height) / 2;

  window.open(
    url,
    `Connecter ${provider === 'google_drive' ? 'Google Drive' : 'Dropbox'}`,
    `width=${width},height=${height},left=${left},top=${top}`
  );
};

/**
 * Sauvegarde un jeton OAuth en local
 */
export const saveOAuthToken = (token: OAuthToken): void => {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${token.provider}`, JSON.stringify(token));
};

/**
 * Récupère un jeton OAuth valide
 */
export const getOAuthToken = (provider: CloudProvider): OAuthToken | null => {
  const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${provider}`);
  if (!stored) {
    return null;
  }

  const token = JSON.parse(stored) as OAuthToken;

  // Vérification de l'expiration (marge de 5 minutes)
  if (Date.now() > token.expiresAt - 300000) {
    return null;
  }

  return token;
};

/**
 * Supprime un jeton OAuth
 */
export const logoutFromCloud = (provider: CloudProvider): void => {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${provider}`);
  toast.info(`Déconnecté de ${provider === 'google_drive' ? 'Google Drive' : 'Dropbox'}`);
};

/**
 * Upload un fichier vers le cloud
 */
export const uploadToCloud = async (
  provider: CloudProvider,
  filename: string,
  content: string,
  contentType: string = 'application/json'
): Promise<boolean> => {
  const token = getOAuthToken(provider);
  if (!token) {
    toast.error(`Session expire ou non connectée pour ${provider}`);
    return false;
  }

  try {
    if (provider === 'google_drive') {
      return await uploadToGoogleDrive(token.accessToken, filename, content, contentType);
    } else {
      return await uploadToDropbox(token.accessToken, filename, content);
    }
  } catch (error) {
    console.error(`[CloudSync] Erreur upload vers ${provider}:`, error);
    return false;
  }
};

/**
 * Implementation spécifique Google Drive
 */
async function uploadToGoogleDrive(
  token: string,
  filename: string,
  content: string,
  contentType: string
): Promise<boolean> {
  const metadata = {
    name: filename,
    mimeType: contentType,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: contentType }));

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  return response.ok;
}

/**
 * Implementation spécifique Dropbox
 */
async function uploadToDropbox(token: string, filename: string, content: string): Promise<boolean> {
  const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Dropbox-API-Arg': JSON.stringify({
        path: `/${filename}`,
        mode: 'overwrite',
        autorename: true,
        mute: false,
      }),
      'Content-Type': 'application/octet-stream',
    },
    body: content,
  });

  return response.ok;
}

/**
 * Utilitaires Toast pour Sonner
 * Fournit des fonctions helper pour afficher des notifications
 *
 * Usage: showToast.success("Données sauvegardées!"), showToast.error("Erreur lors du chargement")
 * Importer Toaster dans App.tsx pour activer
 */

import type React from 'react';
import { toast as sonnerToast } from 'sonner';

const DEFAULT_DURATION = 4000;

interface ShowToastOptions {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast réussi (vert)
 */
function success(message: string, options?: ShowToastOptions) {
  return sonnerToast.success(message, {
    duration: options?.duration ?? DEFAULT_DURATION,
    description: options?.description,
    action: options?.action,
  });
}

/**
 * Toast erreur (rouge)
 */
function error(message: string, options?: ShowToastOptions) {
  return sonnerToast.error(message, {
    duration: options?.duration ?? DEFAULT_DURATION,
    description: options?.description,
    action: options?.action,
  });
}

/**
 * Toast information (bleu)
 */
function info(message: string, options?: ShowToastOptions) {
  return sonnerToast.info(message, {
    duration: options?.duration ?? DEFAULT_DURATION,
    description: options?.description,
    action: options?.action,
  });
}

/**
 * Toast attention/avertissement (orange)
 */
function warning(message: string, options?: ShowToastOptions) {
  return sonnerToast.warning(message, {
    duration: options?.duration ?? DEFAULT_DURATION,
    description: options?.description,
    action: options?.action,
  });
}

/**
 * Toast chargement (gris, durée infinie)
 */
function loading(message: string, options?: Omit<ShowToastOptions, 'duration'>) {
  return sonnerToast.loading(message, {
    description: options?.description,
  });
}

/**
 * Toast personnalisé avec JSX
 */
function custom(options: { message: string | React.ReactNode; duration?: number }) {
  return sonnerToast(options.message, {
    duration: options.duration ?? DEFAULT_DURATION,
  });
}

/**
 * Fermer un toast spécifique ou tous
 */
function dismiss(id?: string | number) {
  if (id) {
    sonnerToast.dismiss(id);
  } else {
    sonnerToast.dismiss();
  }
}

/**
 * Toast de succès avec action
 *
 * Exemple:
 * showToast.promise(fetchData(), {
 *   loading: "Chargement...",
 *   success: "Données chargées!",
 *   error: "Erreur au chargement"
 * })
 */
function promise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) {
  return sonnerToast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
}

export const showToast = {
  success,
  error,
  info,
  warning,
  loading,
  custom,
  dismiss,
  promise,
};

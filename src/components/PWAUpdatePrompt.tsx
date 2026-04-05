import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Bannière de notification de mise à jour du Service Worker.
 * Affichée quand une nouvelle version de l'app est disponible.
 * L'utilisateur choisit de rafraîchir ou d'ignorer.
 */
const PWAUpdatePrompt: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      // Vérification périodique des mises à jour toutes les heures
      if (registration) {
        setInterval(
          () => {
            registration.update().catch(() => {
              // Silencieux – pas de connexion
            });
          },
          60 * 60 * 1000
        );
      }
    },
    onRegisterError(error) {
      console.warn("[PWA] Erreur d'enregistrement du Service Worker :", error);
    },
  });

  // Réinitialiser l'état de dismiss quand une nouvelle version arrive
  useEffect(() => {
    if (needRefresh) {
      setDismissed(false);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setNeedRefresh(false);
    setOfflineReady(false);
  };

  if ((!needRefresh && !offlineReady) || dismissed) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
    >
      <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/80">
        {/* Icône */}
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100">
          {offlineReady && !needRefresh ? (
            /* Icône prêt hors-ligne */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          ) : (
            /* Icône mise à jour disponible */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          )}
        </div>

        {/* Texte */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            {offlineReady && !needRefresh ? 'Prêt hors ligne' : 'Mise à jour disponible'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {offlineReady && !needRefresh
              ? "L'application fonctionne maintenant sans connexion."
              : 'Une nouvelle version est disponible. Rechargez pour en profiter.'}
          </p>

          {needRefresh && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleUpdate}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Mettre à jour
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Plus tard
              </button>
            </div>
          )}
        </div>

        {/* Bouton fermer */}
        <button
          onClick={handleDismiss}
          aria-label="Fermer la notification"
          title="Fermer"
          className="ml-1 shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PWAUpdatePrompt;

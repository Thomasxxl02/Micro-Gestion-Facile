import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Composant de fallback pour React.Suspense
 * Affiché pendant le chargement des chunks dynamiques
 */
export const LoadingFallback: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-screen bg-grad-to-br from-brand-50 to-brand-100 dark:from-brand-900 dark:to-brand-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-brand-600 dark:text-brand-400 animate-spin" />
        <p className="text-sm text-brand-600 dark:text-brand-400 font-medium">
          Chargement...
        </p>
      </div>
    </div>
  );
};

export default LoadingFallback;

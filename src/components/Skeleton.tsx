import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

/**
 * Composant de base pour les états de chargement (skeletons)
 * Utilise une animation de pulsation pour un feedback visuel fluide
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rect' }) => {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    rect: 'rounded-md',
    circle: 'rounded-full',
  };

  return (
    <div
      className={`
        animate-pulse
        bg-gray-200
        dark:bg-gray-800
        ${variantClasses[variant]}
        ${className}
      `}
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton spécifique pour les cartes de statistiques du Dashboard
 */
export const StatCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <Skeleton variant="circle" className="w-10 h-10" />
      <Skeleton variant="rect" className="w-16 h-4" />
    </div>
    <Skeleton variant="text" className="w-3/4 mb-2" />
    <Skeleton variant="text" className="w-1/2 h-8" />
  </div>
);

/**
 * Skeleton pour les lignes de tableau ou les listes
 */
export const TableRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 py-3 px-4 border-b border-gray-50 dark:border-gray-800">
    <Skeleton variant="rect" className="w-8 h-8 rounded" />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" className="w-1/3" />
      <Skeleton variant="text" className="w-1/4 h-3" />
    </div>
    <Skeleton variant="rect" className="w-20 h-6 rounded-full" />
    <Skeleton variant="rect" className="w-12 h-4" />
  </div>
);

/**
 * Skeleton pour le graphique principal
 */
export const ChartSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm h-87.5 flex flex-col">
    <div className="flex justify-between items-center mb-6">
      <Skeleton variant="text" className="w-48 h-6" />
      <Skeleton variant="rect" className="w-24 h-8" />
    </div>
    <div className="flex-1 flex items-end gap-2 px-2">
      {[...Array(12)].map((_, i) => {
        const hPercent = Math.round(Math.random() * 60 + 20);
        return <Skeleton key={i} variant="rect" className={`flex-1 h-[${hPercent}%]`} />;
      })}
    </div>
  </div>
);

export default Skeleton;

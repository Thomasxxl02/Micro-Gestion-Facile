/**
 * Skeleton — Composants de chargement squelette pour le Dashboard.
 */

export function StatCardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Chargement..."
      className="card-modern p-6 animate-pulse"
    >
      <div className="h-3 bg-brand-100 dark:bg-brand-800 rounded-full w-24 mb-4" />
      <div className="h-7 bg-brand-100 dark:bg-brand-800 rounded-full w-32 mb-2" />
      <div className="h-2 bg-brand-100 dark:bg-brand-800 rounded-full w-20" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div
      role="status"
      aria-label="Chargement du graphique..."
      className="card-modern p-6 animate-pulse"
    >
      <div className="h-3 bg-brand-100 dark:bg-brand-800 rounded-full w-32 mb-6" />
      <div className="flex items-end gap-2 h-40">
        {[60, 85, 45, 70, 90, 55, 75, 40, 80, 65, 50, 95].map((h, i) => (
          <div
            key={i}
            className={`flex-1 bg-brand-100 dark:bg-brand-800 rounded-t h-[${h}%]`}
          />
        ))}
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr role="status" aria-label="Chargement...">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-3 bg-brand-100 dark:bg-brand-800 rounded-full animate-pulse w-full" />
        </td>
      ))}
    </tr>
  );
}

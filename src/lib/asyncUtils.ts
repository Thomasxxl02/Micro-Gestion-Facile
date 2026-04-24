/**
 * Wrapper pour gérer les fonctions asynchrones passées à des gestionnaires d'événements React
 * qui attendent une fonction retournant void.
 *
 * Évite l'erreur ESLint @typescript-eslint/no-misused-promises
 */
export function wrapAsync<T extends unknown[]>(
  fn: (...args: T) => Promise<void>,
) {
  return (...args: T) => {
    void fn(...args).catch((error: unknown) => {
      console.error("Async operation failed:", error);
    });
  };
}

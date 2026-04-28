/**
 * Toaster — Wrapper autour de Sonner pour afficher les notifications toast.
 */
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      expand={false}
      duration={4000}
    />
  );
}

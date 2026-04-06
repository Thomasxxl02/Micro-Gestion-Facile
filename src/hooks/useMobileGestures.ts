/**
 * Hook pour gérer les gestes tactiles (swipe menu mobile)
 * Encapsule la logique de détection de swipe
 *
 * Utilisation :
 * useMobileGestures(isMobileMenuOpen, setIsMobileMenuOpen)
 */

import { useEffect } from 'react';

interface MobileGesturesConfig {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  threshold?: number; // Distance de swipe en pixels
  triggerZoneWidth?: number; // Largeur zone sensible (gauche) en pixels
}

export const useMobileGestures = ({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  threshold = 100,
  triggerZoneWidth = 50,
}: MobileGesturesConfig): void => {
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeDistance = touchEndX - touchStartX;

      // Swipe vers la droite (ouvrir le menu) : depuis la gauche
      if (swipeDistance > threshold && touchStartX < triggerZoneWidth && !isMobileMenuOpen) {
        setIsMobileMenuOpen(true);
      }

      // Swipe vers la gauche (fermer le menu)
      if (swipeDistance < -threshold && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobileMenuOpen, setIsMobileMenuOpen, threshold, triggerZoneWidth]);
};

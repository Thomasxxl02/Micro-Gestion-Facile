/**
 * 🔄 useEmailTimer - Gestion de timer countdown + resend cooldown
 *
 * Fournit:
 * - Countdown (ex: "Lien expire dans: 14:32")
 * - Cooldown resend (ex: "Renvoyer dans 60s")
 * - Auto-expiration après timeout
 * - Cleanup automatique
 *
 * Patterns: React Hooks best practices
 * Performances: useCallback + useEffect avec cleanup
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface UseEmailTimerConfig {
  /** Durée de validité du lien en secondes (défaut: 900 = 15 min) */
  linkExpirySeconds?: number;
  /** Cooldown initial entre deux renvois en secondes (défaut: 60) */
  resendCooldownInitialSeconds?: number;
  /** Nombre maximum de renvois autorisés (défaut: 3) */
  maxResends?: number;
  /** Callback quand le lien expire */
  onLinkExpiry?: () => void;
  /** Callback quand cooldown de resend se termine */
  onResendCooldownEnd?: () => void;
}

interface UseEmailTimerReturn {
  /** Temps restant avant expiration du lien (en secondes) */
  timeLeftSeconds: number;
  /** Temps restant avant pouvoir renvoyer (en secondes, 0 = peux renvoyer) */
  resendCooldownSeconds: number;
  /** Nombre total de renvois effectués */
  resendCount: number;
  /** True si le nombre maximum de renvois est atteint */
  isMaxResendsReached: boolean;
  /** Formé humain: "14:32" */
  formattedTimeLeft: string;
  /** True si lien a expiré */
  isExpired: boolean;
  /** True si peut renvoyer */
  canResend: boolean;
  /** Réinitialiser le timer (ex: après resend) */
  resetTimer: () => void;
  /** Démarrer le cooldown resend et incrémenter le compteur */
  startResendCooldown: () => void;
}

/**
 * useEmailTimer - Gestion des timers email
 *
 * Usages:
 * ```tsx
 * const { timeLeftSeconds, formattedTimeLeft, canResend, startResendCooldown } =
 *   useEmailTimer({
 *     linkExpirySeconds: 900, // 15 min
 *     resendCooldownSeconds: 60, // 1 min
 *     maxResends: 3, // Limite brute force
 *     onLinkExpiry: () => setIsEmailSent(false),
 *   });
 * ```
 */
export function useEmailTimer({
  linkExpirySeconds = 900, // 15 min default
  resendCooldownInitialSeconds = 60, // 1 min default
  maxResends = 3, // Maximum 3 renvois par session (4 tentatives totales)
  onLinkExpiry,
  onResendCooldownEnd,
}: UseEmailTimerConfig = {}): UseEmailTimerReturn {
  // State pour timer lien
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(linkExpirySeconds);
  const [isExpired, setIsExpired] = useState(false);

  // State pour cooldown resend
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  // Refs pour éviter les closures dans les timers
  const linkTimerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const resendTimerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // Formater le temps restant en "MM:SS"
  const formattedTimeLeft = useCallback(() => {
    const minutes = Math.floor(timeLeftSeconds / 60);
    const seconds = timeLeftSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [timeLeftSeconds]);

  // Démarrer le countdown du lien
  useEffect(() => {
    if (isExpired) {
      return;
    } // Ne pas démarrer si déjà expiré

    linkTimerIntervalRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        const next = prev - 1;

        if (next <= 0) {
          // Lien expiré
          setIsExpired(true);
          if (linkTimerIntervalRef.current) {
            clearInterval(linkTimerIntervalRef.current);
          }
          onLinkExpiry?.();
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => {
      if (linkTimerIntervalRef.current) {
        clearInterval(linkTimerIntervalRef.current);
      }
    };
  }, [isExpired, onLinkExpiry]);

  // Démarrer le countdown du cooldown resend
  useEffect(() => {
    if (resendCooldownSeconds <= 0) {
      if (resendTimerIntervalRef.current) {
        clearInterval(resendTimerIntervalRef.current);
      }
      onResendCooldownEnd?.();
      return;
    }

    resendTimerIntervalRef.current = setInterval(() => {
      setResendCooldownSeconds((prev) => {
        const next = prev - 1;
        if (next <= 0 && resendTimerIntervalRef.current) {
          clearInterval(resendTimerIntervalRef.current);
        }
        return Math.max(0, next);
      });
    }, 1000);

    return () => {
      if (resendTimerIntervalRef.current) {
        clearInterval(resendTimerIntervalRef.current);
      }
    };
  }, [resendCooldownSeconds, onResendCooldownEnd]);

  // Réinitialiser le timer du lien
  const resetTimer = useCallback(() => {
    if (linkTimerIntervalRef.current) {
      clearInterval(linkTimerIntervalRef.current);
    }
    setTimeLeftSeconds(linkExpirySeconds);
    setIsExpired(false);
  }, [linkExpirySeconds]);

  // Démarrer le cooldown du resend
  const startResendCooldown = useCallback(() => {
    setResendCooldownSeconds(resendCooldownInitialSeconds);
    setResendCount((prev) => prev + 1);
  }, [resendCooldownInitialSeconds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (linkTimerIntervalRef.current) {
        clearInterval(linkTimerIntervalRef.current);
      }
      if (resendTimerIntervalRef.current) {
        clearInterval(resendTimerIntervalRef.current);
      }
    };
  }, []);

  const isMaxResendsReached = resendCount >= maxResends;

  return {
    timeLeftSeconds,
    resendCooldownSeconds,
    resendCount,
    isMaxResendsReached,
    formattedTimeLeft: formattedTimeLeft(),
    isExpired,
    canResend: resendCooldownSeconds === 0 && !isMaxResendsReached,
    resetTimer,
    startResendCooldown,
  };
}

export default useEmailTimer;

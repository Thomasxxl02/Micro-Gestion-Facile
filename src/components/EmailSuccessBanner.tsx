/**
 * 📬 EmailSuccessBanner - Affichage succès email avec timer + resend
 *
 * Fonctionnalités:
 * - Countdown du lien (15 min)
 * - Bouton resend avec cooldown (60s)
 * - Bouton "modifier l'email"
 * - Email masqué pour sécurité
 * - Accessibilité WCAG AAA
 * - Dark mode support
 *
 * Typage: TypeScript strict
 */

import { ChevronLeft, Mail, MailOpen, RefreshCw } from 'lucide-react';
import { useCallback } from 'react';
import { useEmailTimer } from '../hooks/useEmailTimer';

interface EmailSuccessBannerProps {
  /** Email auxuel le lien a été envoyé */
  email: string;
  /** Callback quand utilisateur clique "resend" */
  onResend: () => Promise<void>;
  /** Callback quand utilisateur clique "modifier" */
  onEdit: () => void;
  /** État loading resend (défaut: false) */
  isResending?: boolean;
}

/**
 * Masquer email: affiche "tho***@example.com"
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 3) {
    return `${local[0]}***@${domain}`;
  }
  return `${local.slice(0, 3)}***@${domain}`;
}

/**
 * EmailSuccessBanner - Succès d'envoi email avec timer + resend
 *
 * Usages:
 * ```tsx
 * <EmailSuccessBanner
 *   email={emailLink}
 *   onResend={async () => {
 *     await sendEmailLink(emailLink);
 *     emailTimer.resetTimer();
 *   }}
 *   onEdit={() => {
 *     setIsEmailSent(false);
 *     setEmailLink('');
 *   }}
 *   isResending={loadingService === 'email'}
 * />
 * ```
 */
export function EmailSuccessBanner({
  email,
  onResend,
  onEdit,
  isResending = false,
}: EmailSuccessBannerProps) {
  // Timer pour countdown + cooldown resend
  const {
    formattedTimeLeft,
    isExpired,
    canResend,
    resendCooldownSeconds,
    resetTimer,
    startResendCooldown,
  } = useEmailTimer({
    linkExpirySeconds: 900, // 15 min
    resendCooldownInitialSeconds: 60, // 1 min
    onLinkExpiry: () => {
      // Afficher message "lien expiré"
      console.warn('⏰ Lien de connexion expiré');
    },
  });

  // Handler resend avec gestion erreur
  const handleResend = useCallback(async () => {
    if (!canResend || isResending) {
      return;
    }

    try {
      await onResend();
      // Réinitialiser timers après succès
      resetTimer();
      startResendCooldown();
    } catch (error) {
      console.error('Erreur lors du renvoi:', error);
    }
  }, [canResend, isResending, onResend, resetTimer, startResendCooldown]);

  // Si lien expiré, afficher message d'expiration
  if (isExpired) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
        <div className="flex items-start gap-3">
          <MailOpen size={24} className="text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <h3 className="font-bold text-red-900 dark:text-red-100">Lien expiré 🔌</h3>
            <p className="text-sm text-red-700 dark:text-red-200 mt-1">
              Le lien de connexion a expiré (15 minutes maximum).
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={onEdit}
                className="text-sm font-bold text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100 border border-red-500 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                aria-label="Renvoyer un nouveau lien"
              >
                <RefreshCw size={16} />
                Renvoyer un nouveau lien
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        {/* Icône */}
        <Mail size={24} className="text-blue-500 shrink-0 mt-0.5" aria-hidden="true" />

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          {/* En-tête */}
          <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100">
            Vérifiez votre email ! 📮
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Un lien de connexion a été envoyé à{' '}
            <span className="font-mono font-bold">{maskEmail(email)}</span>
          </p>

          {/* Timer */}
          <div className="mt-4 p-3 bg-white/50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wider">
              ⏱️ Le lien expire dans
            </p>
            <p className="text-2xl font-mono font-bold text-blue-900 dark:text-blue-100 mt-1">
              {formattedTimeLeft}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 mt-5">
            {/* Bouton Resend */}
            <button
              onClick={handleResend}
              disabled={!canResend || isResending}
              className={`
                px-4 py-2.5 rounded-lg font-bold text-sm
                flex items-center justify-center gap-2
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${
                  canResend && !isResending
                    ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                    : 'bg-gray-300 flat:text-gray-600 text-gray-500 cursor-not-allowed opacity-60'
                }
              `}
              aria-label={
                !canResend ? `Renvoyer dans ${resendCooldownSeconds}s` : 'Renvoyer le lien'
              }
              title={!canResend ? `Renvoyer dans ${resendCooldownSeconds}s` : ''}
            >
              <RefreshCw
                size={16}
                className={isResending ? 'animate-spin' : ''}
                aria-hidden="true"
              />
              <span>
                {isResending
                  ? 'Envoi...'
                  : !canResend
                    ? `Renvoyer (${resendCooldownSeconds}s)`
                    : 'Renvoyer le lien'}
              </span>
            </button>

            {/* Bouton Modifier email */}
            <button
              onClick={onEdit}
              className={`
                px-4 py-2.5 rounded-lg font-bold text-sm
                flex items-center justify-center gap-2
                border-2 border-blue-500 text-blue-700 dark:text-blue-300
                hover:bg-blue-50 dark:hover:bg-blue-900/50
                active:scale-95
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              `}
              aria-label="Changer d'adresse email"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              <span>Modifier l&apos;email</span>
            </button>
          </div>

          {/* Note accessibilité */}
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-4 italic">
            💡 Le lien expire après 15 minutes pour des raisons de sécurité.
          </p>
        </div>
      </div>
    </div>
  );
}

export default EmailSuccessBanner;

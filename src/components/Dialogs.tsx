import { AlertTriangle, CheckCircle } from 'lucide-react';
import React from 'react';

/**
 * Composant ConfirmDialog - Accessibilité intégrée, remplace window.confirm()
 * Suit les patterns WCAG pour les modales
 */
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  isDangerous = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="presentation"
    >
      <div
        className="bg-white dark:bg-brand-900 rounded-4xl shadow-2xl max-w-md w-full p-8 border border-brand-100 dark:border-brand-800"
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
      >
        <div className="flex items-start gap-4 mb-6">
          <div
            className={`p-3 rounded-2xl ${isDangerous ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'}`}
          >
            {isDangerous ? (
              <AlertTriangle size={24} aria-hidden="true" />
            ) : (
              <CheckCircle size={24} aria-hidden="true" />
            )}
          </div>
          <h2 id="confirm-title" className="text-xl font-bold text-brand-900 dark:text-white">
            {title}
          </h2>
        </div>

        <p
          id="confirm-description"
          className="text-brand-600 dark:text-brand-300 mb-8 text-sm leading-relaxed"
        >
          {description}
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all border border-brand-200 dark:border-brand-700 text-brand-700 dark:text-brand-200 hover:bg-brand-50 dark:hover:bg-brand-800"
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all ${isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-900 hover:bg-brand-800'}`}
            aria-label={confirmLabel}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Composant AlertDialog - Affiche un message avec un seul bouton
 */
interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  actionLabel?: string;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  title,
  description,
  type = 'info',
  onClose,
  actionLabel = 'OK',
}) => {
  if (!isOpen) {
    return null;
  }

  const typeStyles = {
    success: 'bg-green-50 text-green-600',
    error: 'bg-red-50 text-red-600',
    warning: 'bg-amber-50 text-amber-600',
    info: 'bg-brand-50 text-brand-600',
  };

  const IconComponent = {
    success: CheckCircle,
    error: AlertTriangle,
    warning: AlertTriangle,
    info: CheckCircle,
  }[type];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="presentation"
    >
      <div
        className="bg-white dark:bg-brand-900 rounded-4xl shadow-2xl max-w-md w-full p-8 border border-brand-100 dark:border-brand-800"
        role="alertdialog"
        aria-labelledby="alert-title"
        aria-describedby="alert-description"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-2xl ${typeStyles[type]}`}>
            <IconComponent size={24} aria-hidden="true" />
          </div>
          <h2 id="alert-title" className="text-xl font-bold text-brand-900 dark:text-white">
            {title}
          </h2>
        </div>

        <p
          id="alert-description"
          className="text-brand-600 dark:text-brand-300 mb-8 text-sm leading-relaxed"
        >
          {description}
        </p>

        <button
          onClick={onClose}
          className="w-full px-6 py-2.5 rounded-xl font-bold text-sm bg-brand-900 hover:bg-brand-800 text-white transition-all"
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

import {
  TriangleAlert as AlertTriangle,
  CircleCheckBig as CheckCircle,
} from "lucide-react";
import React from "react";

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
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  isDangerous = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-neutral-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-500"
      role="presentation"
    >
      <div
        className="bg-white/90 dark:bg-brand-950/90 rounded-[40px] shadow-3xl max-w-md w-full p-10 border border-white/20 dark:border-white/5 backdrop-blur-2xl"
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className={`p-5 rounded-[24px] mb-6 shadow-xl ${isDangerous ? "bg-rose-50 text-rose-600 shadow-rose-500/10" : "bg-brand-50 text-brand-600 shadow-brand-500/10"}`}
          >
            {isDangerous ? (
              <AlertTriangle size={32} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <CheckCircle size={32} strokeWidth={2.5} aria-hidden="true" />
            )}
          </div>
          <h2
            id="confirm-title"
            className="text-2xl font-black text-brand-950 dark:text-white tracking-tighter"
          >
            {title}
          </h2>
          <p
            id="confirm-description"
            className="text-brand-500/80 dark:text-brand-400 mt-4 text-sm font-medium leading-relaxed"
          >
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className={`btn-primary ${isDangerous ? "bg-red-600 hover:bg-red-700" : ""}`}
            aria-label={confirmLabel}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="btn-secondary"
            aria-label={cancelLabel}
          >
            {cancelLabel}
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
  type?: "success" | "error" | "warning" | "info";
  onClose: () => void;
  actionLabel?: string;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  title,
  description,
  type = "info",
  onClose,
  actionLabel = "OK",
}) => {
  if (!isOpen) {
    return null;
  }

  const typeStyles = {
    success: "bg-green-50 text-green-600",
    error: "bg-red-50 text-red-600",
    warning: "bg-amber-50 text-amber-600",
    info: "bg-brand-50 text-brand-600",
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
          <div className={`badge-${type}`}>
            <IconComponent size={24} aria-hidden="true" />
          </div>
          <h2
            id="alert-title"
            className="text-xl font-bold text-brand-900 dark:text-white"
          >
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
          className="btn-primary w-full"
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

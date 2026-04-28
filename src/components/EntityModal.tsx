/**
 * Composant réutilisable: EntityModal/Panel
 * Utilisé pour créer/éditer n'importe quelle entité (Invoice, Client, Supplier, etc)
 * Remplace les panneaux dupliqués dans InvoiceManager, ClientManager, SupplierManager
 */

import { LoaderCircle as Loader2, X } from "lucide-react";
import React from "react";

interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  isEditing: boolean;
  isSaving?: boolean;
  onSave: () => void | Promise<void>;
  onDelete?: () => void;
  isDangerous?: boolean; // affiche un warning visuel
  children: React.ReactNode;
  showDeleteButton?: boolean;
  deleteLabel?: string;
  saveLabel?: string;
  cancelLabel?: string;
}

export const EntityModal: React.FC<EntityModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  isEditing,
  isSaving = false,
  onSave,
  onDelete,
  isDangerous = false,
  children,
  showDeleteButton = true,
  deleteLabel = "Supprimer",
  saveLabel = "Enregistrer",
  cancelLabel = "Annuler",
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      {/* Backdrop */}
      <button
        className="fixed inset-0 bg-black/50 transition-opacity cursor-default w-full h-full border-none"
        onClick={onClose}
        aria-label="Fermer la fenêtre"
      />

      {/* Modal */}
      <div
        className="relative mx-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[40px] bg-white/90 p-10 shadow-3xl dark:bg-brand-950/90 border border-white/20 dark:border-white/5 backdrop-blur-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entity-modal-title"
        aria-describedby={subtitle ? "entity-modal-subtitle" : undefined}
      >
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 text-accent-600 dark:text-accent-400 font-bold text-[10px] tracking-[0.2em] uppercase mb-1">
              <span>{isEditing ? "Édition Privée" : "Nouvelle Entrée"}</span>
            </div>
            <h2
              id="entity-modal-title"
              className="text-3xl font-black text-brand-950 dark:text-white tracking-tighter"
            >
              {title}
            </h2>
            {subtitle && (
              <p
                id="entity-modal-subtitle"
                className="mt-2 text-xs font-bold text-brand-500/60 dark:text-brand-400/60 uppercase tracking-[0.15em]"
              >
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl p-4 text-brand-400 hover:bg-brand-50 dark:text-brand-500 dark:hover:bg-brand-800 transition-all hover:rotate-90 duration-300"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-8 space-y-6">{children}</div>

        {/* Footer - Actions */}
        <div
          className={`flex flex-wrap gap-3 ${isDangerous ? "border-t border-red-100 pt-6 dark:border-red-900/30" : ""}`}
        >
          {isEditing && showDeleteButton && onDelete && (
            <button
              onClick={onDelete}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-6 py-3 text-red-600 font-bold text-sm hover:bg-red-100 disabled:opacity-50 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900 transition-all border border-red-100 dark:border-red-900/30"
            >
              {isSaving && (
                <Loader2
                  size={16}
                  className="animate-spin"
                  aria-hidden="true"
                />
              )}
              {deleteLabel}
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            disabled={isSaving}
            className="btn-secondary px-6 py-3 text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              void onSave();
            }}
            disabled={isSaving}
            className="btn-primary px-8 py-3 text-sm"
          >
            {isSaving && (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            )}
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntityModal;

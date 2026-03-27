/**
 * Composant réutilisable: EntityModal/Panel
 * Utilisé pour créer/éditer n'importe quelle entité (Invoice, Client, Supplier, etc)
 * Remplace les panneaux dupliqués dans InvoiceManager, ClientManager, SupplierManager
 */

import React from 'react';
import { X, Loader2 } from 'lucide-react';

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
  deleteLabel = 'Supprimer',
  saveLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
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
        className="relative mx-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl dark:bg-brand-950 border border-brand-100 dark:border-brand-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entity-modal-title"
        aria-describedby={subtitle ? 'entity-modal-subtitle' : undefined}
      >
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2
              id="entity-modal-title"
              className="text-2xl font-black text-brand-900 dark:text-white tracking-tight"
            >
              {title}
            </h2>
            {subtitle && (
              <p
                id="entity-modal-subtitle"
                className="mt-1 text-sm font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest"
              >
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl p-3 text-brand-400 hover:bg-brand-50 dark:text-brand-500 dark:hover:bg-brand-900/50 transition-colors"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-8 space-y-6">{children}</div>

        {/* Footer - Actions */}
        <div
          className={`flex flex-wrap gap-3 ${isDangerous ? 'border-t border-red-100 pt-6 dark:border-red-900/30' : ''}`}
        >
          {isEditing && showDeleteButton && onDelete && (
            <button
              onClick={onDelete}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-6 py-3 text-red-600 font-bold text-sm hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-all"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {deleteLabel}
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-2xl border border-brand-200 px-6 py-3 text-brand-600 font-bold text-sm hover:bg-brand-50 disabled:opacity-50 dark:border-brand-800 dark:text-brand-300 dark:hover:bg-brand-900 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-900 px-8 py-3 text-white font-bold text-sm hover:bg-brand-800 disabled:opacity-50 dark:bg-white dark:text-brand-900 dark:hover:bg-brand-100 shadow-xl shadow-brand-900/20 dark:shadow-white/5 transition-all"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntityModal;

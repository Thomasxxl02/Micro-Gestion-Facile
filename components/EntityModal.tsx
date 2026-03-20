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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative mx-auto my-8 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entity-modal-title"
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 id="entity-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6 space-y-4">{children}</div>

        {/* Footer - Actions */}
        <div className={`flex gap-3 ${isDangerous ? 'border-t border-red-200 pt-4 dark:border-red-900' : ''}`}>
          {isEditing && showDeleteButton && onDelete && (
            <button
              onClick={onDelete}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {deleteLabel}
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntityModal;

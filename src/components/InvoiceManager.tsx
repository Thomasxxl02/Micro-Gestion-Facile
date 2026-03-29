import React, { useState } from 'react';
import type { Client, Invoice, Product, UserProfile } from '../types';

type ViewMode = 'list' | 'create' | 'detail';

interface InvoiceManagerProps {
  invoices: Invoice[];
  setInvoices: (invoices: Invoice[]) => void;
  clients: Client[];
  userProfile: UserProfile;
  products: Product[];
  onSave?: (invoice: Invoice) => void;
  onDelete?: (id: string) => void;
}

const InvoiceManager: React.FC<InvoiceManagerProps> = ({
  invoices: _invoices,
  setInvoices: _setInvoices,
  clients: _clients,
  userProfile: _userProfile,
  products: _products,
  onSave: _onSave,
  onDelete: _onDelete,
}) => {
  const [view, setView] = useState<ViewMode>('list');

  if (view === 'create') {
    return (
      <div className="max-w-7xl mx-auto pb-20">
        <p>Create View</p>
      </div>
    );
  }

  if (view === 'detail') {
    return (
      <div className="max-w-7xl mx-auto pb-20">
        <p>Detail View</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-brand-900 dark:text-white">Documents</h2>
        <button
          onClick={() => setView('create')}
          className="bg-brand-900 text-white px-6 py-3 rounded-2xl"
        >
          Nouveau
        </button>
      </div>
    </div>
  );
};

export default InvoiceManager;

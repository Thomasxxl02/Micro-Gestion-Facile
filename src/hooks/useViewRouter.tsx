/**
 * Hook pour centraliser la logique de routage des vues
 * Remplace le switch/case de 140+ lignes dans AppShell
 *
 * Utilisation :
 * const ViewComponent = useViewRouter(currentView, syncData)
 */

import React, { Suspense } from 'react';
import LoadingFallback from '../components/LoadingFallback';
import { useAppStore } from '../store/appStore';
import { InvoiceStatus, type UserProfile } from '../types';
import type { AppShellSyncResult } from './useAppShellSync';

const DEFAULT_USER_PROFILE: UserProfile = {
  companyName: '',
  siret: '',
  address: '',
  email: '',
  phone: '',
};

// Lazy load des managers
const Dashboard = React.lazy(() => import('../components/Dashboard'));
const InvoiceManager = React.lazy(() => import('../components/InvoiceManager'));
const ClientManager = React.lazy(() => import('../components/ClientManager'));
const SupplierManager = React.lazy(() => import('../components/SupplierManager'));
const ProductManager = React.lazy(() => import('../components/ProductManager'));
const AccountingManager = React.lazy(() => import('../components/AccountingManager'));
const EmailManager = React.lazy(() => import('../components/EmailManager'));
const CalendarManager = React.lazy(() => import('../components/CalendarManager'));
const SettingsManager = React.lazy(() => import('../components/SettingsManager'));
const AIAssistant = React.lazy(() => import('../components/AIAssistant'));
const BankReconciliationManager = React.lazy(
  () => import('../components/BankReconciliationManager')
);
const VATDashboardManager = React.lazy(() => import('../components/VATDashboardManager'));

export type ViewType =
  | 'dashboard'
  | 'invoices'
  | 'clients'
  | 'suppliers'
  | 'products'
  | 'accounting'
  | 'emails'
  | 'calendar'
  | 'settings'
  | 'ai_assistant'
  | 'bank_reconciliation'
  | 'vat_dashboard';

interface ViewRouterProps {
  currentView: ViewType;
  syncData: AppShellSyncResult;
  onNavigate: (view: ViewType) => void;
}

/**
 * Retourne le composant React à afficher pour la vue actuelle
 */
export const useViewRouter = ({
  currentView,
  syncData,
  onNavigate,
}: ViewRouterProps): React.ReactNode => {
  // Récupérer les setters du store pour les composants qui les attendent
  const {
    setInvoices,
    setClients,
    setSuppliers,
    setProducts,
    setExpenses,
    setEmails,
    setEmailTemplates,
    setCalendarEvents,
    setUserProfile,
  } = useAppStore();

  const renderView = (): React.ReactNode => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            invoices={syncData.invoices}
            products={syncData.products}
            expenses={syncData.expenses}
            events={syncData.calendarEvents}
            onNavigate={onNavigate}
            userProfile={syncData.userProfile ?? DEFAULT_USER_PROFILE}
            onSaveInvoice={syncData.saveInvoice}
          />
        );

      case 'invoices':
        return (
          <InvoiceManager
            invoices={syncData.invoices}
            setInvoices={setInvoices}
            clients={syncData.clients}
            userProfile={syncData.userProfile ?? DEFAULT_USER_PROFILE}
            products={syncData.products}
            onSave={syncData.saveInvoice}
            onDelete={syncData.deleteInvoice}
          />
        );

      case 'clients':
        return (
          <ClientManager
            clients={syncData.clients}
            invoices={syncData.invoices}
            onSave={syncData.saveClient}
            onDelete={syncData.deleteClient}
          />
        );

      case 'suppliers':
        return (
          <SupplierManager
            suppliers={syncData.suppliers}
            setSuppliers={setSuppliers}
            expenses={syncData.expenses}
            onSave={syncData.saveSupplier}
            onDelete={syncData.deleteSupplier}
          />
        );

      case 'products':
        return (
          <ProductManager
            products={syncData.products}
            onSave={syncData.saveProduct}
            onDelete={syncData.deleteProduct}
          />
        );

      case 'accounting':
        return (
          <AccountingManager
            expenses={syncData.expenses}
            setExpenses={setExpenses}
            invoices={syncData.invoices}
            suppliers={syncData.suppliers}
            userProfile={syncData.userProfile ?? DEFAULT_USER_PROFILE}
            clients={syncData.clients}
            onSaveExpense={syncData.saveExpense}
            onDeleteExpense={syncData.deleteExpense}
          />
        );

      case 'emails':
        return (
          <EmailManager
            emails={syncData.emails}
            setEmails={setEmails}
            templates={syncData.emailTemplates}
            setTemplates={setEmailTemplates}
            clients={syncData.clients}
            invoices={syncData.invoices}
            userProfile={syncData.userProfile ?? DEFAULT_USER_PROFILE}
            onSaveEmail={syncData.saveEmail}
            onDeleteEmail={syncData.deleteEmail}
            onSaveTemplate={syncData.saveEmailTemplate}
            onDeleteTemplate={syncData.deleteEmailTemplate}
          />
        );

      case 'calendar':
        return (
          <CalendarManager
            events={syncData.calendarEvents}
            setEvents={setCalendarEvents}
            clients={syncData.clients}
            onSaveEvent={syncData.saveCalendarEvent}
            onDeleteEvent={syncData.deleteCalendarEvent}
          />
        );

      case 'settings':
        return (
          <SettingsManager
            userProfile={syncData.userProfile ?? DEFAULT_USER_PROFILE}
            setUserProfile={setUserProfile}
            onSaveProfile={syncData.saveUserProfile}
            allData={{
              invoices: syncData.invoices,
              clients: syncData.clients,
              suppliers: syncData.suppliers,
              products: syncData.products,
              expenses: syncData.expenses,
            }}
            setAllData={{
              setInvoices,
              setClients,
              setSuppliers,
              setProducts,
              setExpenses,
            }}
          />
        );

      case 'ai_assistant':
        return <AIAssistant />;

      case 'bank_reconciliation':
        return (
          <BankReconciliationManager
            invoices={syncData.invoices}
            onMarkInvoicePaid={(id: string) => {
              const invoice = syncData.invoices.find((i) => i.id === id);
              if (invoice) {
                syncData.saveInvoice({ ...invoice, status: InvoiceStatus.PAID });
              }
            }}
          />
        );

      case 'vat_dashboard':
        return (
          <VATDashboardManager
            invoices={syncData.invoices}
            userProfile={syncData.userProfile ?? DEFAULT_USER_PROFILE}
          />
        );

      default:
        return (
          <Dashboard
            invoices={syncData.invoices}
            products={syncData.products}
            expenses={syncData.expenses}
            events={syncData.calendarEvents}
            onNavigate={onNavigate}
            userProfile={syncData.userProfile ?? DEFAULT_USER_PROFILE}
          />
        );
    }
  };

  // Wrap toujours dans Suspense pour lazy loading
  return <Suspense fallback={<LoadingFallback />}>{renderView()}</Suspense>;
};

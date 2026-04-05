import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import React, { Suspense, useEffect } from 'react';
import { OperationType, db, handleFirestoreError, logout } from '../firebase';
import { useFirestoreSync } from '../hooks/useFirestoreSync';
import { useAppStore } from '../store/appStore';
import {
  type CalendarEvent,
  type Client,
  type Email,
  type EmailTemplate,
  type Expense,
  type Invoice,
  type Product,
  type Supplier,
  type UserProfile,
  InvoiceStatus,
} from '../types';
import Dashboard from './Dashboard';
import LoadingFallback from './LoadingFallback';
import PWAUpdatePrompt from './PWAUpdatePrompt';
import Sidebar from './Sidebar';

// Lazy load des vues secondaires
const InvoiceManager = React.lazy(() => import('./InvoiceManager'));
const ClientManager = React.lazy(() => import('./ClientManager'));
const SupplierManager = React.lazy(() => import('./SupplierManager'));
const ProductManager = React.lazy(() => import('./ProductManager'));
const AccountingManager = React.lazy(() => import('./AccountingManager'));
const EmailManager = React.lazy(() => import('./EmailManager'));
const CalendarManager = React.lazy(() => import('./CalendarManager'));
const SettingsManager = React.lazy(() => import('./SettingsManager'));
const AIAssistant = React.lazy(() => import('./AIAssistant'));
const BankReconciliationManager = React.lazy(() => import('./BankReconciliationManager'));
const VATDashboardManager = React.lazy(() => import('./VATDashboardManager'));

/**
 * Shell de l'application authentifiée :
 * - Synchronise les données Firestore
 * - Gère la navigation / layout (Sidebar, header, contenu)
 */
const AppShell: React.FC = () => {
  // ─── ZUSTAND GLOBAL STATE ───
  const {
    currentView,
    setCurrentView,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isDarkMode,
    setIsDarkMode,
    user,
    invoices,
    setInvoices,
    clients,
    setClients,
    suppliers,
    setSuppliers,
    products,
    setProducts,
    expenses,
    setExpenses,
    emails,
    setEmails,
    emailTemplates,
    setEmailTemplates,
    calendarEvents,
    setCalendarEvents,
    userProfile,
    setUserProfile,
  } = useAppStore();

  // ─── GESTION DU SWIPE MOBILE ───
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
      const threshold = 100;

      // Swipe vers la droite (ouvrir le menu)
      if (swipeDistance > threshold && touchStartX < 50 && !isMobileMenuOpen) {
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
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  // ─── FIRESTORE SYNC HOOKS (invoices, clients, products) ───
  const {
    data: syncedInvoices,
    upsert: saveInvoice,
    remove: deleteInvoice,
  } = useFirestoreSync<Invoice>({
    userId: user?.uid || '',
    collectionName: 'invoices',
  });
  const {
    data: syncedClients,
    upsert: saveClient,
    remove: deleteClient,
  } = useFirestoreSync<Client>({
    userId: user?.uid || '',
    collectionName: 'clients',
  });
  const {
    data: syncedProducts,
    upsert: saveProduct,
    remove: deleteProduct,
  } = useFirestoreSync<Product>({
    userId: user?.uid || '',
    collectionName: 'products',
  });

  // Propagation vers le store Zustand (compatibilité avec les autres composants)
  useEffect(() => {
    setInvoices(syncedInvoices);
  }, [syncedInvoices, setInvoices]);
  useEffect(() => {
    setClients(syncedClients);
  }, [syncedClients, setClients]);
  useEffect(() => {
    setProducts(syncedProducts);
  }, [syncedProducts, setProducts]);

  // ─── GESTION DE L'ÉTAT GLOBAL DE SYNCHRONISATION ───
  const { isSyncing, setIsSyncing } = useAppStore();

  useEffect(() => {
    // Si toutes les collections principales sont chargées, on arrête le loading global
    // On considère que le Dashboard peut s'afficher proprement
    if (syncedInvoices.length > 0 || syncedClients.length > 0) {
      setIsSyncing(false);
    }

    // Fallback de sécurité : si après 2 secondes on n'a rien (ex: nouvel utilisateur),
    // on lève le loading quand même pour laisser voir l'UI
    const timer = setTimeout(() => setIsSyncing(false), 2000);
    return () => clearTimeout(timer);
  }, [syncedInvoices.length, syncedClients.length, setIsSyncing]);

  // ─── FIRESTORE SUBSCRIPTIONS (autres collections) ───
  useEffect(() => {
    if (!user) {
      return;
    }

    const qSuppliers = query(collection(db, 'suppliers'), where('uid', '==', user.uid));
    const unsubSuppliers = onSnapshot(
      qSuppliers,
      (snap) => setSuppliers(snap.docs.map((d) => d.data() as Supplier)),
      () => handleFirestoreError(null, OperationType.LIST, 'suppliers')
    );

    const qExpenses = query(collection(db, 'expenses'), where('uid', '==', user.uid));
    const unsubExpenses = onSnapshot(
      qExpenses,
      (snap) => setExpenses(snap.docs.map((d) => d.data() as Expense)),
      () => handleFirestoreError(null, OperationType.LIST, 'expenses')
    );

    const qEmails = query(collection(db, 'emails'), where('uid', '==', user.uid));
    const unsubEmails = onSnapshot(
      qEmails,
      (snap) => setEmails(snap.docs.map((d) => d.data() as Email)),
      () => handleFirestoreError(null, OperationType.LIST, 'emails')
    );

    const qTemplates = query(collection(db, 'emailTemplates'), where('uid', '==', user.uid));
    const unsubTemplates = onSnapshot(
      qTemplates,
      (snap) => setEmailTemplates(snap.docs.map((d) => d.data() as EmailTemplate)),
      () => handleFirestoreError(null, OperationType.LIST, 'emailTemplates')
    );

    const qEvents = query(collection(db, 'calendarEvents'), where('uid', '==', user.uid));
    const unsubEvents = onSnapshot(
      qEvents,
      (snap) => setCalendarEvents(snap.docs.map((d) => d.data() as CalendarEvent)),
      () => handleFirestoreError(null, OperationType.LIST, 'calendarEvents')
    );

    const unsubProfile = onSnapshot(
      doc(db, 'profiles', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        }
      },
      () => handleFirestoreError(null, OperationType.GET, `profiles/${user.uid}`)
    );

    return () => {
      unsubSuppliers();
      unsubExpenses();
      unsubEmails();
      unsubTemplates();
      unsubEvents();
      unsubProfile();
    };
  }, [
    user,
    setSuppliers,
    setExpenses,
    setEmails,
    setEmailTemplates,
    setCalendarEvents,
    setUserProfile,
  ]);

  // ─── HELPERS FIRESTORE (collections non gérées par useFirestoreSync) ───
  const saveDoc = async <T extends { id: string }>(collectionName: string, data: T) => {
    if (!user) {
      return;
    }
    try {
      await setDoc(doc(db, collectionName, data.id), { ...data, uid: user.uid });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${data.id}`);
    }
  };

  const deleteDocFromFirestore = async (collectionName: string, id: string) => {
    if (!user) {
      return;
    }
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
    }
  };

  // ─── RENDU DES VUES ───
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            invoices={invoices}
            products={products}
            expenses={expenses}
            events={calendarEvents}
            onNavigate={setCurrentView}
            userProfile={userProfile}
            onSaveInvoice={(inv) => saveDoc('invoices', inv)}
          />
        );
      case 'invoices':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <InvoiceManager
              invoices={invoices}
              setInvoices={setInvoices}
              clients={clients}
              userProfile={userProfile}
              products={products}
              onSave={(inv) => saveInvoice(inv)}
              onDelete={(id) => deleteInvoice(id)}
            />
          </Suspense>
        );
      case 'clients':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ClientManager
              clients={clients}
              invoices={invoices}
              onSave={(c) => saveClient(c)}
              onDelete={(id) => deleteClient(id)}
            />
          </Suspense>
        );
      case 'suppliers':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SupplierManager
              suppliers={suppliers}
              setSuppliers={setSuppliers}
              expenses={expenses}
              onSave={(s) => saveDoc('suppliers', s)}
              onDelete={(id) => deleteDocFromFirestore('suppliers', id)}
            />
          </Suspense>
        );
      case 'products':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ProductManager
              products={products}
              onSave={(p) => saveProduct(p)}
              onDelete={(id) => deleteProduct(id)}
            />
          </Suspense>
        );
      case 'accounting':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AccountingManager
              expenses={expenses}
              setExpenses={setExpenses}
              invoices={invoices}
              suppliers={suppliers}
              userProfile={userProfile}
              clients={clients}
              onSaveExpense={(e) => saveDoc('expenses', e)}
              onDeleteExpense={(id) => deleteDocFromFirestore('expenses', id)}
            />
          </Suspense>
        );
      case 'emails':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <EmailManager
              emails={emails}
              setEmails={setEmails}
              templates={emailTemplates}
              setTemplates={setEmailTemplates}
              clients={clients}
              invoices={invoices}
              userProfile={userProfile}
              onSaveEmail={(e) => saveDoc('emails', e)}
              onDeleteEmail={(id) => deleteDocFromFirestore('emails', id)}
              onSaveTemplate={(t) => saveDoc('emailTemplates', t)}
              onDeleteTemplate={(id) => deleteDocFromFirestore('emailTemplates', id)}
            />
          </Suspense>
        );
      case 'calendar':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <CalendarManager
              events={calendarEvents}
              setEvents={setCalendarEvents}
              clients={clients}
              onSaveEvent={(e) => saveDoc('calendarEvents', e)}
              onDeleteEvent={(id) => deleteDocFromFirestore('calendarEvents', id)}
            />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsManager
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              onSaveProfile={(p) => {
                if (user) {
                  setDoc(doc(db, 'profiles', user.uid), { ...p, uid: user.uid }).catch((err) =>
                    handleFirestoreError(err, OperationType.WRITE, `profiles/${user.uid}`)
                  );
                }
              }}
              allData={{ invoices, clients, suppliers, products, expenses }}
              setAllData={{ setInvoices, setClients, setSuppliers, setProducts, setExpenses }}
            />
          </Suspense>
        );
      case 'ai_assistant':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AIAssistant />
          </Suspense>
        );
      case 'bank_reconciliation':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <BankReconciliationManager
              invoices={invoices}
              onMarkInvoicePaid={(id) => {
                const inv = invoices.find((i) => i.id === id);
                if (inv) {
                  saveDoc('invoices', { ...inv, status: InvoiceStatus.PAID });
                }
              }}
            />
          </Suspense>
        );
      case 'vat_dashboard':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <VATDashboardManager invoices={invoices} userProfile={userProfile} />
          </Suspense>
        );
      default:
        return (
          <Dashboard
            invoices={invoices}
            products={products}
            expenses={expenses}
            events={calendarEvents}
            onNavigate={setCurrentView}
            userProfile={userProfile}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-(--bg-main) font-sans text-brand-900 dark:text-(--text-main) selection:bg-primary-100 dark:selection:bg-primary-900/40 selection:text-brand-900 dark:selection:text-white transition-colors duration-500">
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 xl:p-12 overflow-x-hidden">
        {/* Header mobile */}
        <div className="lg:hidden flex justify-between items-center mb-8 sticky top-0 bg-(--bg-main)/90 backdrop-blur-md z-30 py-4 border-b border-brand-200/50 dark:border-brand-800/60">
          <h1 className="text-xl font-bold text-brand-900 dark:text-white tracking-tight">
            Micro Gestion
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 bg-white dark:bg-brand-800 rounded-xl shadow-sm border border-brand-200 dark:border-brand-700 text-brand-600 dark:text-brand-200 hover:bg-brand-50 dark:hover:bg-brand-700 transition-colors"
              title="Changer de thème"
            >
              {isDarkMode ? (
                <Sun size={18} className="text-amber-400" />
              ) : (
                <Moon size={18} className="text-primary-600" />
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2.5 bg-brand-900 dark:bg-primary-600 text-white rounded-xl shadow-lg hover:bg-brand-800 dark:hover:bg-primary-700 transition-all active:scale-90"
              title="Ouvrir le menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Header desktop */}
        <div className="hidden lg:flex justify-end items-center gap-6 mb-10 animate-fade-in">
          <div className="flex items-center gap-4 px-4 py-2 bg-white/80 dark:bg-brand-800/60 backdrop-blur-sm rounded-2xl border border-brand-100 dark:border-brand-700/60 shadow-sm">
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-brand-400 dark:text-brand-500 uppercase tracking-wider">
                Connecté en tant que
              </span>
              <span className="text-sm font-bold text-brand-900 dark:text-brand-100">
                {user?.displayName || user?.email}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-800 flex items-center justify-center overflow-hidden border border-brand-200 dark:border-brand-700">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-brand-600 dark:text-brand-200 font-bold">
                  {user?.email?.[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="w-px h-8 bg-brand-200 dark:bg-brand-800 mx-1" />
            <button
              onClick={logout}
              className="p-2 text-brand-400 hover:text-red-500 dark:hover:text-red-400 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
              title="Déconnexion"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div className="animate-slide-up">{renderContent()}</div>
      </main>

      <PWAUpdatePrompt />
    </div>
  );
};

export default AppShell;

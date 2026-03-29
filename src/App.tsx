import React, { Suspense, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import EmailSuccessBanner from './components/EmailSuccessBanner';
import ErrorBanner from './components/ErrorBanner';
import LoadingFallback from './components/LoadingFallback';
import Sidebar from './components/Sidebar';

// Lazy load components for code-splitting
const InvoiceManager = React.lazy(() => import('./components/InvoiceManager'));
const ClientManager = React.lazy(() => import('./components/ClientManager'));
const SupplierManager = React.lazy(() => import('./components/SupplierManager'));
const ProductManager = React.lazy(() => import('./components/ProductManager'));
const AccountingManager = React.lazy(() => import('./components/AccountingManager'));
const EmailManager = React.lazy(() => import('./components/EmailManager'));
const CalendarManager = React.lazy(() => import('./components/CalendarManager'));
const SettingsManager = React.lazy(() => import('./components/SettingsManager'));
const AIAssistant = React.lazy(() => import('./components/AIAssistant'));

import { onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Moon,
  Sun,
} from 'lucide-react';
import { GitHubLoginButton } from './components/GitHubLoginButton';
import {
  OperationType,
  auth,
  db,
  handleFirestoreError,
  loginWithGoogle,
  logout,
  sendEmailLink,
} from './firebase';
import { useEmailValidation } from './hooks/useEmailValidation';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { useAppStore } from './store/appStore';
import type {
  CalendarEvent,
  Client,
  Email,
  EmailTemplate,
  Expense,
  Invoice,
  Product,
  Supplier,
  UserProfile,
} from './types';

const App: React.FC = () => {
  // ─── ZUSTAND GLOBAL STATE ───
  const {
    // UI
    currentView,
    setCurrentView,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isDarkMode,
    setIsDarkMode,
    // Auth
    user,
    setUser,
    isAuthReady,
    setIsAuthReady,
    // Data
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

  // ─── FIRESTORE SYNC HOOKS ───
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
    status: _clientStatus,
  } = useFirestoreSync<Client>({
    userId: user?.uid || '',
    collectionName: 'clients',
  });
  const {
    data: syncedProducts,
    upsert: saveProduct,
    remove: deleteProduct,
    status: _productStatus,
  } = useFirestoreSync<Product>({
    userId: user?.uid || '',
    collectionName: 'products',
  });

  // Update Zustand when synced data changes (to keep compatibility with other components)
  useEffect(() => {
    setInvoices(syncedInvoices);
  }, [syncedInvoices, setInvoices]);
  useEffect(() => {
    setClients(syncedClients);
  }, [syncedClients, setClients]);
  useEffect(() => {
    setProducts(syncedProducts);
  }, [syncedProducts, setProducts]);

  // ─── AUTH SETUP ───
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [setUser, setIsAuthReady]);

  // ─── FIRESTORE SYNC (Other data) ───
  useEffect(() => {
    if (!user) {
      return;
    }

    // Remaining syncs that we haven't migrated to hooks yet
    const qSuppliers = query(collection(db, 'suppliers'), where('uid', '==', user.uid));
    const unsubSuppliers = onSnapshot(
      qSuppliers,
      (snapshot) => {
        setSuppliers(snapshot.docs.map((doc) => doc.data() as Supplier));
      },
      () => handleFirestoreError(null, OperationType.LIST, 'suppliers')
    );

    const qProducts = query(collection(db, 'products'), where('uid', '==', user.uid));
    const unsubProducts = onSnapshot(
      qProducts,
      (snapshot) => {
        setProducts(snapshot.docs.map((doc) => doc.data() as Product));
      },
      () => handleFirestoreError(null, OperationType.LIST, 'products')
    );

    const qExpenses = query(collection(db, 'expenses'), where('uid', '==', user.uid));
    const unsubExpenses = onSnapshot(
      qExpenses,
      (snapshot) => {
        setExpenses(snapshot.docs.map((doc) => doc.data() as Expense));
      },
      () => handleFirestoreError(null, OperationType.LIST, 'expenses')
    );

    const qEmails = query(collection(db, 'emails'), where('uid', '==', user.uid));
    const unsubEmails = onSnapshot(
      qEmails,
      (snapshot) => {
        setEmails(snapshot.docs.map((doc) => doc.data() as Email));
      },
      () => handleFirestoreError(null, OperationType.LIST, 'emails')
    );

    const qTemplates = query(collection(db, 'emailTemplates'), where('uid', '==', user.uid));
    const unsubTemplates = onSnapshot(
      qTemplates,
      (snapshot) => {
        setEmailTemplates(snapshot.docs.map((doc) => doc.data() as EmailTemplate));
      },
      () => handleFirestoreError(null, OperationType.LIST, 'emailTemplates')
    );

    const qEvents = query(collection(db, 'calendarEvents'), where('uid', '==', user.uid));
    const unsubEvents = onSnapshot(
      qEvents,
      (snapshot) => {
        setCalendarEvents(snapshot.docs.map((doc) => doc.data() as CalendarEvent));
      },
      () => handleFirestoreError(null, OperationType.LIST, 'calendarEvents')
    );

    // Profile sync
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
      unsubProducts();
      unsubExpenses();
      unsubEmails();
      unsubTemplates();
      unsubEvents();
      unsubProfile();
    };
  }, [
    user,
    setSuppliers,
    setProducts,
    setExpenses,
    setEmails,
    setEmailTemplates,
    setCalendarEvents,
    setUserProfile,
  ]);

  // ─── FIRESTORE HELPERS ───
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
              allData={{
                invoices,
                clients,
                suppliers,
                products,
                expenses,
              }}
              setAllData={{
                setInvoices,
                setClients,
                setSuppliers,
                setProducts,
                setExpenses,
              }}
            />
          </Suspense>
        );
      case 'ai_assistant':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AIAssistant />
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

  const {
    email: emailLink,
    setEmail: setEmailLink,
    isValid: isEmailValid,
    error: emailValidationError,
    warning: emailValidationWarning,
  } = useEmailValidation();
  const [isEmailSent, setIsEmailSent] = React.useState(false);
  const [loadingService, setLoadingService] = React.useState<'google' | 'github' | 'email' | null>(
    null
  );
  const [loginError, setLoginError] = React.useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoadingService('google');
    try {
      await loginWithGoogle();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Erreur connexion Google');
    } finally {
      setLoadingService(null);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50 dark:bg-brand-950 p-6 transition-colors duration-500">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-200/30 dark:bg-brand-800/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent-200/30 dark:bg-accent-800/20 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="max-w-md w-full glass p-10 rounded-[2.5rem] shadow-2xl text-center border border-white/40 dark:border-white/5 relative z-10 animate-fade-in">
          <div className="w-24 h-24 bg-brand-900 dark:bg-brand-800 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl rotate-6 hover:rotate-0 transition-transform duration-500">
            <LogIn className="text-white" size={48} />
          </div>
          <h1 className="text-4xl font-bold text-brand-900 dark:text-white mb-4 tracking-tight">
            Micro Gestion
          </h1>
          <p className="text-brand-600 dark:text-brand-300 mb-12 text-lg">
            Votre allié quotidien pour une gestion simplifiée et intelligente.
          </p>

          <div className="space-y-4">
            {/* Erreur Banner - Remplace l'ancien div simple */}
            <ErrorBanner
              error={loginError}
              type="auth"
              onDismiss={() => setLoginError(null)}
              showDismiss={true}
            />

            {/* Google Login Button - Responsive 44px min */}
            <button
              onClick={handleGoogleLogin}
              disabled={loadingService !== null}
              className={`
                w-full
                min-h-[44px] sm:min-h-[50px]
                py-3 sm:py-4
                px-4 sm:px-8
                bg-brand-900 dark:bg-white
                text-white dark:text-brand-900
                rounded-2xl
                font-bold
                flex items-center justify-center gap-3 sm:gap-4
                hover:scale-100 sm:hover:scale-[1.02]
                active:scale-95
                transition-all
                shadow-xl
                hover:shadow-brand-900/20 dark:hover:shadow-white/10
                group
                disabled:opacity-50
                disabled:cursor-not-allowed
                disabled:scale-100
              `}
            >
              {loadingService === 'google' ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
              )}
              <span className="hidden sm:inline">Se connecter avec Google</span>
              <span className="sm:hidden">Google</span>
            </button>

            {/* GitHub Login Button - More responsive */}
            <div className="[&>button]:w-full [&>button]:min-h-[44px] sm:[&>button]:min-h-[50px] [&>button]:py-3 sm:[&>button]:py-4">
              <GitHubLoginButton
                onSuccess={() => {
                  // Auto-redirect to dashboard via useGitHubAuth / onAuthStateChanged
                }}
                onError={(err) => {
                  console.error('GitHub login error:', err);
                  setLoginError(err.message);
                }}
                label="Se connecter avec GitHub"
                showText={true}
              />
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-200 dark:border-brand-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-brand-50 dark:bg-brand-950 px-4 text-brand-400 font-bold tracking-widest">
                  OU
                </span>
              </div>
            </div>

            {!isEmailSent ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!emailLink || loadingService !== null || !isEmailValid) {
                    return;
                  }
                  setLoadingService('email');
                  try {
                    await sendEmailLink(emailLink);
                    setIsEmailSent(true);
                  } catch {
                    setLoginError("Erreur lors de l'envoi du lien.");
                  } finally {
                    setLoadingService(null);
                  }
                }}
                className="space-y-3 text-left"
              >
                <div className="relative">
                  <Mail
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                      emailValidationError
                        ? 'text-red-500'
                        : emailValidationWarning
                          ? 'text-yellow-500'
                          : isEmailValid
                            ? 'text-green-500'
                            : 'text-brand-400'
                    }`}
                    size={20}
                  />
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    required
                    value={emailLink}
                    onChange={(e) => setEmailLink(e.target.value)}
                    disabled={loadingService !== null}
                    className={`w-full pl-12 pr-4 py-4 bg-white dark:bg-brand-900/50 border rounded-2xl focus:ring-4 outline-none transition-all dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                      emailValidationError
                        ? 'border-red-500 focus:ring-red-500/10'
                        : emailValidationWarning
                          ? 'border-yellow-500 focus:ring-yellow-500/10'
                          : isEmailValid
                            ? 'border-green-500 focus:ring-green-500/10'
                            : 'border-brand-200 dark:border-brand-800 focus:ring-brand-500/10 focus:border-brand-500'
                    }`}
                  />
                </div>

                {/* Real-time feedback */}
                {emailValidationError && (
                  <p className="text-xs text-red-600 dark:text-red-400 px-2 flex items-center gap-1 animate-fade-in">
                    <AlertCircle size={12} /> {emailValidationError}
                  </p>
                )}
                {emailValidationWarning && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 px-2 flex items-center gap-1 animate-fade-in">
                    <AlertCircle size={12} /> {emailValidationWarning}
                  </p>
                )}
                {isEmailValid && !emailValidationWarning && (
                  <p className="text-xs text-green-600 dark:text-green-400 px-2 flex items-center gap-1 animate-fade-in">
                    <CheckCircle2 size={12} /> Email valide ✓
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loadingService !== null || !isEmailValid}
                  className={`
                    w-full
                    min-h-[44px]
                    py-3 sm:py-4
                    px-4 sm:px-6
                    bg-brand-50 dark:bg-brand-800
                    text-brand-900 dark:text-white
                    rounded-2xl
                    font-bold
                    flex items-center justify-center gap-2 sm:gap-3
                    hover:bg-brand-100 dark:hover:bg-brand-700
                    transition-all
                    border border-brand-200 dark:border-brand-700
                    group
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                    active:scale-95
                  `}
                >
                  {loadingService === 'email' ? (
                    <>
                      <Loader2 size={16} className="sm:size-[18px] animate-spin" />
                      <span className="hidden sm:inline">Envoi...</span>
                      <span className="sm:hidden">Envoi...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Recevoir un lien magique</span>
                      <span className="sm:hidden">Lien magique</span>
                      <ArrowRight
                        size={16}
                        className="sm:size-[18px] group-hover:translate-x-1 transition-transform"
                      />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <EmailSuccessBanner
                email={emailLink}
                onResend={async () => {
                  setLoadingService('email');
                  try {
                    await sendEmailLink(emailLink);
                  } catch (error) {
                    setLoginError(
                      error instanceof Error ? error.message : 'Erreur lors du renvoi du lien'
                    );
                  } finally {
                    setLoadingService(null);
                  }
                }}
                onEdit={() => {
                  setIsEmailSent(false);
                  setEmailLink('');
                }}
                isResending={loadingService === 'email'}
              />
            )}
          </div>

          <p className="mt-10 text-xs text-brand-400 dark:text-brand-500 uppercase tracking-widest font-semibold">
            Sécurisé par Google Auth
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-brand-50 dark:bg-brand-950 font-sans text-brand-900 dark:text-brand-50 selection:bg-brand-200 dark:selection:bg-brand-800 selection:text-brand-900 transition-colors duration-500">
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 xl:p-12 overflow-x-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex justify-between items-center mb-8 sticky top-0 bg-brand-50/80 dark:bg-brand-950/80 backdrop-blur-md z-30 py-4 border-b border-brand-200/50 dark:border-brand-800/50">
          <h1 className="text-xl font-bold text-brand-900 dark:text-white tracking-tight">
            Micro Gestion
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 bg-white dark:bg-brand-900 rounded-xl shadow-sm border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-200 hover:bg-brand-50 transition-colors"
              title="Changer de thème"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2.5 bg-brand-900 text-white rounded-xl shadow-lg hover:bg-brand-800 transition-all active:scale-90"
              title="Ouvrir le menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Desktop Header / Top Bar */}
        <div className="hidden lg:flex justify-end items-center gap-6 mb-10 animate-fade-in">
          <div className="flex items-center gap-4 px-4 py-2 bg-white/50 dark:bg-brand-900/50 backdrop-blur-sm rounded-2xl border border-brand-100 dark:border-brand-800 shadow-sm">
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-brand-400 dark:text-brand-500 uppercase tracking-wider">
                Connecté en tant que
              </span>
              <span className="text-sm font-bold text-brand-900 dark:text-brand-100">
                {user.displayName || user.email}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-800 flex items-center justify-center overflow-hidden border border-brand-200 dark:border-brand-700">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-brand-600 dark:text-brand-200 font-bold">
                  {user.email?.[0].toUpperCase()}
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
    </div>
  );
};

export default App;

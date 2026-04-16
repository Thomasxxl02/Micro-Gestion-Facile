import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { Loader2, LogIn, LogOut, Menu, Moon, Sun } from "lucide-react";
import React, { useEffect, useState } from "react";
import AccountingManager from "./components/AccountingManager";
import AIAssistant from "./components/AIAssistant";
import CalendarManager from "./components/CalendarManager";
import ClientManager from "./components/ClientManager";
import Dashboard from "./components/Dashboard";
import EmailManager from "./components/EmailManager";
import InvoiceManager from "./components/InvoiceManager";
import ProductManager from "./components/ProductManager";
import SettingsManager from "./components/SettingsManager";
import Sidebar from "./components/Sidebar";
import SupplierManager from "./components/SupplierManager";
import {
  auth,
  db,
  handleFirestoreError,
  loginWithGoogle,
  logout,
  OperationType,
} from "./firebase";
import {
  CalendarEvent,
  Client,
  Email,
  EmailTemplate,
  Expense,
  Invoice,
  Product,
  Supplier,
  Theme,
  UserProfile,
  ViewState,
} from "./types";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "system";
    }
    return "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (t: Theme) => {
      root.classList.remove("light", "dark");

      if (t === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(t);
      }
      localStorage.setItem("theme", t);
    };

    applyTheme(theme);

    // Listen for system theme changes if theme is 'system'
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("system");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  // --- STATE ---
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([
    {
      id: "1",
      name: "Envoi Facture",
      subject: "Votre facture {{invoice_number}}",
      body: "Bonjour {{client_name}},\n\nVeuillez trouver ci-joint votre facture {{invoice_number}} d'un montant de {{total}}.\n\nCordialement,\n{{company_name}}",
      type: "invoice",
    },
    {
      id: "2",
      name: "Relance Paiement",
      subject: "Relance : Facture {{invoice_number}} impayée",
      body: "Bonjour {{client_name}},\n\nSauf erreur de notre part, le paiement de la facture {{invoice_number}} ne nous est pas parvenu.\n\nMerci de régulariser la situation au plus vite.\n\nCordialement,\n{{company_name}}",
      type: "reminder",
    },
  ]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    companyName: "Ma Micro-Entreprise",
    professionalTitle: "Consultant Indépendant",
    siret: "123 456 789 00012",
    address: "123 Avenue de la République, 75001 Paris",
    email: "contact@mon-entreprise.fr",
    phone: "01 02 03 04 05",
    website: "www.mon-entreprise.fr",
    linkedin: "linkedin.com/in/mon-profil",
    bankAccount: "FR76 1234 5678 9012 3456 7890 123",
    bic: "TRPUFRPPXXX",
    currency: "€",
    invoicePrefix: "FAC-",
    quotePrefix: "DEV-",
    orderPrefix: "COM-",
    creditNotePrefix: "AVO-",
    defaultVatRate: 0,
    logoColor: "#102a43",
    activityType: "SERVICE_BNC",
    isAcreBeneficiary: false,
    vatThresholdAlert: true,
    revenueThresholdAlert: true,
    preferences: {
      theme: "system",
      language: "fr",
      dateFormat: "DD/MM/YYYY",
      currencySymbol: "€",
      currencyPosition: "after",
      roundingMode: "nearest",
      autoSave: true,
      notificationsEnabled: true,
      defaultDueDateDays: 30,
    },
  });

  // --- AUTH ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // --- FIRESTORE SYNC ---
  useEffect(() => {
    if (!user) return;

    const qInvoices = query(
      collection(db, "invoices"),
      where("uid", "==", user.uid),
    );
    const unsubInvoices = onSnapshot(
      qInvoices,
      (snapshot) => {
        setInvoices(snapshot.docs.map((doc) => doc.data() as Invoice));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "invoices"),
    );

    const qClients = query(
      collection(db, "clients"),
      where("uid", "==", user.uid),
    );
    const unsubClients = onSnapshot(
      qClients,
      (snapshot) => {
        setClients(snapshot.docs.map((doc) => doc.data() as Client));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "clients"),
    );

    const qSuppliers = query(
      collection(db, "suppliers"),
      where("uid", "==", user.uid),
    );
    const unsubSuppliers = onSnapshot(
      qSuppliers,
      (snapshot) => {
        setSuppliers(snapshot.docs.map((doc) => doc.data() as Supplier));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "suppliers"),
    );

    const qProducts = query(
      collection(db, "products"),
      where("uid", "==", user.uid),
    );
    const unsubProducts = onSnapshot(
      qProducts,
      (snapshot) => {
        setProducts(snapshot.docs.map((doc) => doc.data() as Product));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "products"),
    );

    const qExpenses = query(
      collection(db, "expenses"),
      where("uid", "==", user.uid),
    );
    const unsubExpenses = onSnapshot(
      qExpenses,
      (snapshot) => {
        setExpenses(snapshot.docs.map((doc) => doc.data() as Expense));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "expenses"),
    );

    const qEmails = query(
      collection(db, "emails"),
      where("uid", "==", user.uid),
    );
    const unsubEmails = onSnapshot(
      qEmails,
      (snapshot) => {
        setEmails(snapshot.docs.map((doc) => doc.data() as Email));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "emails"),
    );

    const qTemplates = query(
      collection(db, "emailTemplates"),
      where("uid", "==", user.uid),
    );
    const unsubTemplates = onSnapshot(
      qTemplates,
      (snapshot) => {
        setEmailTemplates(
          snapshot.docs.map((doc) => doc.data() as EmailTemplate),
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "emailTemplates"),
    );

    const qEvents = query(
      collection(db, "calendarEvents"),
      where("uid", "==", user.uid),
    );
    const unsubEvents = onSnapshot(
      qEvents,
      (snapshot) => {
        setCalendarEvents(
          snapshot.docs.map((doc) => doc.data() as CalendarEvent),
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "calendarEvents"),
    );

    // Profile sync
    const unsubProfile = onSnapshot(
      doc(db, "profiles", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        }
      },
      (err) =>
        handleFirestoreError(err, OperationType.GET, `profiles/${user.uid}`),
    );

    return () => {
      unsubInvoices();
      unsubClients();
      unsubSuppliers();
      unsubProducts();
      unsubExpenses();
      unsubEmails();
      unsubTemplates();
      unsubEvents();
      unsubProfile();
    };
  }, [user]);

  // --- WRAPPERS FOR SETTERS ---
  const saveDoc = async (collectionName: string, data: any) => {
    if (!user) return;
    try {
      await setDoc(doc(db, collectionName, data.id), {
        ...data,
        uid: user.uid,
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `${collectionName}/${data.id}`,
      );
    }
  };

  const deleteDocFromFirestore = async (collectionName: string, id: string) => {
    if (!user) return;
    try {
      // We don't have a deleteDoc tool but we can use setDoc with a deleted flag or just use the firebase SDK deleteDoc
      // Wait, I should import deleteDoc from firebase/firestore
      const { deleteDoc: firestoreDeleteDoc } =
        await import("firebase/firestore");
      await firestoreDeleteDoc(doc(db, collectionName, id));
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `${collectionName}/${id}`,
      );
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard
            invoices={invoices}
            products={products}
            expenses={expenses}
            emails={emails}
            events={calendarEvents}
            onNavigate={(page) => setCurrentView(page as ViewState)}
            userProfile={userProfile}
          />
        );
      case "invoices":
        return (
          <InvoiceManager
            invoices={invoices}
            setInvoices={(newInvoices) => {
              // This is a bit complex because InvoiceManager uses setInvoices for everything
              // For now, let's just update the state and we'll need to update the component to use saveDoc
              setInvoices(newInvoices);
            }}
            clients={clients}
            userProfile={userProfile}
            products={products}
            onSave={(inv) => saveDoc("invoices", inv)}
            onDelete={(id) => deleteDocFromFirestore("invoices", id)}
          />
        );
      case "clients":
        return (
          <ClientManager
            clients={clients}
            setClients={setClients}
            invoices={invoices}
            onSave={(c) => saveDoc("clients", c)}
            onDelete={(id) => deleteDocFromFirestore("clients", id)}
          />
        );
      case "suppliers":
        return (
          <SupplierManager
            suppliers={suppliers}
            setSuppliers={setSuppliers}
            expenses={expenses}
            onSave={(s) => saveDoc("suppliers", s)}
            onDelete={(id) => deleteDocFromFirestore("suppliers", id)}
          />
        );
      case "products":
        return (
          <ProductManager
            products={products}
            setProducts={setProducts}
            onSave={(p) => saveDoc("products", p)}
            onDelete={(id) => deleteDocFromFirestore("products", id)}
          />
        );
      case "accounting":
        return (
          <AccountingManager
            expenses={expenses}
            setExpenses={setExpenses}
            invoices={invoices}
            suppliers={suppliers}
            onSaveExpense={(e) => saveDoc("expenses", e)}
            onDeleteExpense={(id) => deleteDocFromFirestore("expenses", id)}
          />
        );
      case "emails":
        return (
          <EmailManager
            emails={emails}
            setEmails={setEmails}
            templates={emailTemplates}
            setTemplates={setEmailTemplates}
            clients={clients}
            invoices={invoices}
            userProfile={userProfile}
            onSaveEmail={(e) => saveDoc("emails", e)}
            onDeleteEmail={(id) => deleteDocFromFirestore("emails", id)}
            onSaveTemplate={(t) => saveDoc("emailTemplates", t)}
            onDeleteTemplate={(id) =>
              deleteDocFromFirestore("emailTemplates", id)
            }
          />
        );
      case "calendar":
        return (
          <CalendarManager
            events={calendarEvents}
            setEvents={setCalendarEvents}
            clients={clients}
            invoices={invoices}
            onSaveEvent={(e) => saveDoc("calendarEvents", e)}
            onDeleteEvent={(id) => deleteDocFromFirestore("calendarEvents", id)}
          />
        );
      case "settings":
        return (
          <SettingsManager
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            onSaveProfile={(p) => {
              if (user) {
                setDoc(doc(db, "profiles", user.uid), {
                  ...p,
                  uid: user.uid,
                }).catch((err) =>
                  handleFirestoreError(
                    err,
                    OperationType.WRITE,
                    `profiles/${user.uid}`,
                  ),
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
            currentTheme={theme}
            setTheme={setTheme}
          />
        );
      case "ai_assistant":
        return <AIAssistant />;
      default:
        return (
          <Dashboard
            invoices={invoices}
            products={products}
            expenses={expenses}
            emails={emails}
            events={calendarEvents}
            onNavigate={(page) => setCurrentView(page as ViewState)}
            userProfile={userProfile}
          />
        );
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
      <div className="min-h-screen flex items-center justify-center bg-(--bg-main) p-6 transition-colors duration-500">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-200/30 dark:bg-brand-800/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent-200/30 dark:bg-accent-800/20 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="max-w-md w-full bg-(--card-bg) p-10 rounded-[2.5rem] shadow-2xl text-center border border-(--card-border) relative z-10 animate-fade-in">
          <div className="w-24 h-24 bg-brand-900 dark:bg-brand-800 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl rotate-6 hover:rotate-0 transition-transform duration-500">
            <LogIn className="text-white" size={48} />
          </div>
          <h1 className="text-4xl font-bold text-(--text-main) mb-4 tracking-tight">
            Micro Gestion
          </h1>
          <p className="text-(--text-muted) mb-12 text-lg">
            Votre allié quotidien pour une gestion simplifiée et intelligente.
          </p>

          <button
            onClick={loginWithGoogle}
            className="w-full py-5 px-8 bg-brand-900 dark:bg-white text-white dark:text-brand-900 rounded-2xl font-bold flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl hover:shadow-brand-900/20 dark:hover:shadow-white/10 group"
          >
            <LogIn
              size={24}
              className="group-hover:translate-x-1 transition-transform"
            />
            Se connecter avec Google
          </button>

          <p className="mt-10 text-xs text-(--text-muted) uppercase tracking-widest font-semibold">
            Sécurisé par Google Auth
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-(--bg-main) font-sans text-(--text-main) selection:bg-brand-200 dark:selection:bg-brand-800 selection:text-brand-900 transition-colors duration-500 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-pink-300/30 dark:bg-blue-900/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] bg-blue-300/30 dark:bg-indigo-900/10 rounded-full blur-[100px] animate-pulse delay-700" />
        <div className="absolute bottom-[10%] right-[20%] w-[35%] h-[35%] bg-yellow-300/20 dark:bg-purple-900/10 rounded-full blur-[80px] animate-pulse delay-1000" />
        <div className="absolute bottom-[30%] left-[20%] w-[30%] h-[30%] bg-emerald-300/20 dark:bg-sky-900/10 rounded-full blur-[60px] animate-pulse delay-500" />

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay" />
      </div>

      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        theme={theme}
        setTheme={setTheme}
      />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 xl:p-12 overflow-x-hidden relative z-10">
        {/* Mobile Header */}
        <div className="lg:hidden flex justify-between items-center mb-8 sticky top-0 bg-(--bg-main)/60 backdrop-blur-xl z-30 py-4 border-b border-(--card-border) px-4 -mx-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-brand-900 shadow-lg">
              <Menu size={20} />
            </div>
            <h1 className="text-xl font-black text-(--text-main) tracking-tighter">
              MICRO<span className="text-brand-500">GESTION</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 bg-(--card-bg) rounded-xl shadow-sm border border-(--card-border) text-(--text-muted) hover:bg-(--bg-main) transition-all active:scale-90"
              title="Changer de thème"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2.5 bg-brand-900 dark:bg-white text-white dark:text-brand-900 rounded-xl shadow-lg hover:bg-brand-800 transition-all active:scale-90"
              title="Ouvrir le menu"
              aria-label="Ouvrir la navigation"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Desktop Header / Top Bar */}
        <div className="hidden lg:flex justify-end items-center gap-6 mb-10 animate-fade-in">
          <div className="flex items-center gap-4 px-4 py-2 bg-(--card-bg)/50 backdrop-blur-sm rounded-2xl border border-(--card-border) shadow-sm">
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider">
                Connecté en tant que
              </span>
              <span className="text-sm font-bold text-(--text-main)">
                {user.displayName || user.email}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-(--bg-main) flex items-center justify-center overflow-hidden border border-(--card-border)">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-(--text-main) font-bold">
                  {user.email?.[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="w-px h-8 bg-(--card-border) mx-1" />
            <button
              onClick={logout}
              className="p-2 text-(--text-muted) hover:text-red-500 dark:hover:text-red-400 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
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

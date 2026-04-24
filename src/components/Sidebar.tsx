import {
  Briefcase,
  Calculator,
  Calendar,
  FileText,
  Landmark,
  LayoutDashboard,
  Mail,
  Moon,
  Package,
  ReceiptText,
  Settings,
  Sun,
  Truck,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { motion } from "motion/react";
import React from "react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useDataStore } from "../store/useDataStore";
import type { ViewState } from "../types";

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setView,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isDarkMode,
  toggleDarkMode,
}) => {
  const { isOffline } = useNetworkStatus();
  const { userProfile } = useDataStore();

  const menuItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: <LayoutDashboard size={18} />,
    },
    { id: "invoices", label: "Devis & Factures", icon: <FileText size={18} /> },
    { id: "calendar", label: "Agenda", icon: <Calendar size={18} /> },
    { id: "clients", label: "Clients", icon: <Users size={18} /> },
    { id: "suppliers", label: "Fournisseurs", icon: <Truck size={18} /> },
    { id: "products", label: "Catalogue", icon: <Package size={18} /> },
    { id: "accounting", label: "Comptabilité", icon: <Calculator size={18} /> },
    {
      id: "bank_reconciliation",
      label: "Rapprochement",
      icon: <Landmark size={18} />,
    },
    {
      id: "vat_dashboard",
      label: "Suivi TVA",
      icon: <ReceiptText size={18} />,
    },
    { id: "emails", label: "Emails", icon: <Mail size={18} /> },
    { id: "settings", label: "Paramètres", icon: <Settings size={18} /> },
  ];

  // Filtrage et réorganisation selon les préférences utilisateur (sidebarFavorites)
  // On garde toujours dashboard et settings pour éviter de se bloquer
  const filteredMenuItems = userProfile.sidebarFavorites
    ? menuItems
        .filter(
          (item) =>
            item.id === "dashboard" ||
            item.id === "settings" ||
            userProfile.sidebarFavorites?.includes(item.id),
        )
        .sort((a, b) => {
          const indexA = userProfile.sidebarFavorites?.indexOf(a.id) ?? 999;
          const indexB = userProfile.sidebarFavorites?.indexOf(b.id) ?? 999;
          return indexA - indexB;
        })
    : menuItems;

  const handleNavClick = (view: ViewState) => {
    setView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <button
          className="fixed inset-0 z-20 bg-brand-900/50 backdrop-blur-sm lg:hidden transition-opacity w-full h-full border-none cursor-default"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Fermer le menu"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-screen w-72 glass text-brand-600 dark:text-brand-300 transition-transform duration-500 ease-in-out flex flex-col
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        aria-label="Menu de navigation"
      >
        {/* Logo Area */}
        <div className="flex items-center justify-between px-8 py-12">
          <button
            className="flex items-center gap-4 group cursor-pointer border-none bg-transparent p-0 text-left"
            onClick={() => setView("dashboard")}
            aria-label="Aller au tableau de bord"
          >
            <div
              className="bg-brand-600 dark:bg-white text-white dark:text-brand-900 p-3 rounded-2xl shadow-xl group-hover:rotate-12 transition-transform duration-500"
              aria-hidden="true"
            >
              <Briefcase size={24} />
            </div>
            <div>
              <p
                className="text-xl font-black text-brand-900 dark:text-white tracking-tighter leading-none"
                aria-hidden="true"
              >
                MICRO
                <br />
                <span className="text-brand-500 dark:text-brand-400">
                  GESTION
                </span>
              </p>
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 px-6 py-4 space-y-1.5 overflow-y-auto custom-scrollbar"
          aria-label="Navigation principale"
        >
          <div
            className="text-[10px] font-black text-brand-300 dark:text-brand-700 uppercase tracking-[0.25em] mb-6 px-4"
            aria-hidden="true"
          >
            Menu Principal
          </div>
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              aria-current={currentView === item.id ? "page" : undefined}
              className={`
                w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group relative overflow-hidden
                ${
                  currentView === item.id
                    ? "bg-brand-600 dark:bg-primary-500 text-white shadow-xl shadow-brand-600/30 dark:shadow-primary-500/30"
                    : "text-brand-500 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-800/60 hover:text-brand-600 dark:hover:text-brand-100"
                }
              `}
            >
              <span
                className={`transition-colors duration-300 ${currentView === item.id ? "text-white" : "text-brand-300 dark:text-brand-600 group-hover:text-brand-900 dark:group-hover:text-brand-100"}`}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span className="relative z-10">{item.label}</span>
              {currentView === item.id && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-brand-600 dark:bg-primary-500 -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Theme Toggle & Footer */}
        <div className="p-6 mt-auto space-y-4">
          <button
            onClick={toggleDarkMode}
            aria-label={
              isDarkMode ? "Passer au mode clair" : "Passer au mode sombre"
            }
            className="w-full flex items-center justify-between gap-3 px-5 py-3.5 bg-brand-50 dark:bg-brand-800/50 rounded-2xl transition-all hover:bg-brand-100 dark:hover:bg-brand-800 text-brand-600 dark:text-brand-300 border border-brand-100 dark:border-brand-700/60 group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 bg-white dark:bg-brand-700 rounded-xl shadow-sm group-hover:scale-110 transition-transform"
                aria-hidden="true"
              >
                {isDarkMode ? (
                  <Sun size={16} className="text-amber-400" />
                ) : (
                  <Moon size={16} className="text-primary-600" />
                )}
              </div>
              <span className="text-sm font-semibold tracking-tight">
                {isDarkMode ? "Mode Clair" : "Mode Sombre"}
              </span>
            </div>
            {/* Toggle pill animé */}
            <div
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                isDarkMode ? "bg-primary-500" : "bg-brand-300"
              }`}
              aria-hidden="true"
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
                  isDarkMode ? "left-6" : "left-1"
                }`}
              />
            </div>
          </button>

          <div className="flex items-center gap-4 p-4 bg-white dark:bg-brand-800/40 rounded-4xl border border-brand-100 dark:border-brand-700/50 shadow-sm group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-brand-900 to-brand-700 dark:from-white dark:to-brand-200 flex items-center justify-center text-lg font-black text-white dark:text-brand-900 shadow-lg group-hover:rotate-3 transition-transform">
              MG
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-black text-brand-900 dark:text-white truncate tracking-tight">
                Espace Pro
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isOffline ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`}
                ></span>
                <p className="text-[10px] font-bold text-brand-400 dark:text-brand-500 truncate uppercase tracking-widest flex items-center gap-1">
                  {isOffline ? (
                    <>
                      <WifiOff size={10} /> Hors Ligne
                    </>
                  ) : (
                    <>
                      <Wifi size={10} /> Connecté
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

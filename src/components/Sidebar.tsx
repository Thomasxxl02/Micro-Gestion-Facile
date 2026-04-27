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
          fixed top-0 left-0 z-30 h-screen w-72 glass-strong text-brand-600 dark:text-brand-300 transition-all duration-500 ease-in-out flex flex-col border-r border-white/20 dark:border-white/5
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        aria-label="Menu de navigation"
      >
        {/* Logo Area */}
        <div className="flex items-center justify-between px-8 py-10">
          <button
            className="flex items-center gap-4 group cursor-pointer border-none bg-transparent p-0 text-left"
            onClick={() => setView("dashboard")}
            aria-label="Aller au tableau de bord"
          >
            <div
              className="bg-linear-to-tr from-brand-600 to-accent-500 text-white p-3 rounded-2xl shadow-lg shadow-brand-500/20 group-hover:rotate-12 transition-all duration-500"
              aria-hidden="true"
            >
              <Briefcase size={24} />
            </div>
            <div>
              <p
                className="text-xl font-black text-brand-950 dark:text-white tracking-tighter leading-none font-display uppercase"
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
          className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar"
          aria-label="Navigation principale"
        >
          <div
            className="text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-[0.2em] mb-4 px-4 opacity-70"
            aria-hidden="true"
          >
            Menu Principal
          </div>
          {filteredMenuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as ViewState)}
                aria-current={isActive ? "page" : undefined}
                className={`
                  w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group
                  ${
                    isActive
                      ? "bg-brand-600 text-white shadow-lg shadow-brand-500/30 scale-[1.02]"
                      : "hover:bg-brand-100 dark:hover:bg-brand-800/50 text-brand-500 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-200"
                  }
                `}
              >
                <span
                  className={`transition-transform duration-500 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                >
                  {item.icon}
                </span>
                <span className="flex-1 text-left tracking-tight">
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle & Footer */}
        <div className="p-4 mt-auto border-t border-brand-100/50 dark:border-brand-800/50 space-y-3">
          <button
            onClick={toggleDarkMode}
            aria-label={
              isDarkMode ? "Passer au mode clair" : "Passer au mode sombre"
            }
            className="w-full flex items-center justify-between p-4 rounded-3xl bg-brand-50 dark:bg-brand-900/50 hover:bg-brand-100 dark:hover:bg-brand-800 transition-colors group shadow-sm border border-brand-100 dark:border-brand-800"
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 bg-white dark:bg-brand-700 rounded-xl shadow-sm group-hover:rotate-12 transition-transform"
                aria-hidden="true"
              >
                {isDarkMode ? (
                  <Sun size={18} className="text-amber-500" />
                ) : (
                  <Moon size={18} className="text-brand-600" />
                )}
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-brand-600 dark:text-brand-300">
                Thème
              </span>
            </div>
            <div
              className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                isDarkMode ? "bg-brand-600" : "bg-brand-200"
              }`}
              aria-hidden="true"
            >
              <div
                className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-300 ${
                  isDarkMode ? "left-6" : "left-1"
                }`}
              />
            </div>
          </button>

          <div className="flex items-center gap-4 p-4 bg-white/40 dark:bg-brand-900/40 rounded-3xl border border-brand-100/50 dark:border-brand-800/50 shadow-xs group hover:shadow-sm transition-all">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-brand-900 to-brand-700 dark:from-white dark:to-brand-200 flex items-center justify-center text-lg font-black text-white dark:text-brand-900 shadow-lg group-hover:scale-105 transition-transform">
              MG
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-black text-brand-900 dark:text-white truncate tracking-tight uppercase">
                Espace Pro
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isOffline ? "bg-rose-500" : "bg-emerald-500 animate-pulse"}`}
                ></span>
                <p className="text-[9px] font-black text-brand-400 dark:text-brand-500 truncate uppercase tracking-widest flex items-center gap-1">
                  {isOffline ? "Mode Déconnecté" : "Synchronisé"}
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

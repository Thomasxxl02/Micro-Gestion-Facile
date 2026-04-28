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
} from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
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

interface MenuItemConfig {
  id: ViewState;
  label: string;
  icon: React.ReactNode;
  group: "platform" | "gestion" | "finances" | "outils";
  shortcut?: string;
  badge?: number | string;
  description?: string;
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
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const menuItems: MenuItemConfig[] = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: <LayoutDashboard size={18} />,
      group: "platform",
      shortcut: "1",
      description: "Vue d'ensemble de votre activité",
    },
    {
      id: "invoices",
      label: "Devis & Factures",
      icon: <FileText size={18} />,
      group: "gestion",
      shortcut: "2",
      description: "Gérer vos documents commerciaux",
      badge: 3,
    },
    {
      id: "calendar",
      label: "Agenda",
      icon: <Calendar size={18} />,
      group: "gestion",
      shortcut: "3",
    },
    {
      id: "clients",
      label: "Clients",
      icon: <Users size={18} />,
      group: "gestion",
      shortcut: "4",
    },
    {
      id: "suppliers",
      label: "Fournisseurs",
      icon: <Truck size={18} />,
      group: "gestion",
      shortcut: "5",
    },
    {
      id: "products",
      label: "Catalogue",
      icon: <Package size={18} />,
      group: "gestion",
      shortcut: "6",
    },
    {
      id: "accounting",
      label: "Comptabilité",
      icon: <Calculator size={18} />,
      group: "finances",
      shortcut: "7",
    },
    {
      id: "bank_reconciliation",
      label: "Rapprochement",
      icon: <Landmark size={18} />,
      group: "finances",
      shortcut: "8",
    },
    {
      id: "vat_dashboard",
      label: "Suivi TVA",
      icon: <ReceiptText size={18} />,
      group: "finances",
      shortcut: "9",
    },
    {
      id: "emails",
      label: "Emails",
      icon: <Mail size={18} />,
      group: "outils",
      badge: 2,
    },
    {
      id: "settings",
      label: "Paramètres",
      icon: <Settings size={18} />,
      group: "platform",
    },
  ];

  // Mémoriser menuItems pour éviter les recalculs
  const memoMenuItems = React.useMemo(
    () => menuItems,
    [], // menuItems ne change jamais
  );

  // Filtrage et réorganisation selon les préférences utilisateur
  const filteredMenuItems = userProfile.sidebarFavorites
    ? menuItems
        .filter(
          (item) =>
            item.id === "dashboard" ||
            item.group === "platform" ||
            item.id === "settings" ||
            userProfile.sidebarFavorites?.includes(item.id),
        )
        .sort((a, b) => {
          if (a.group === "platform") return -1;
          if (b.group === "platform") return 1;
          const indexA = userProfile.sidebarFavorites?.indexOf(a.id) ?? 999;
          const indexB = userProfile.sidebarFavorites?.indexOf(b.id) ?? 999;
          return indexA - indexB;
        })
    : menuItems;

  // Grouper les items par catégorie
  const groupedMenuItems = React.useMemo(() => {
    const groups = {
      platform: [] as MenuItemConfig[],
      gestion: [] as MenuItemConfig[],
      finances: [] as MenuItemConfig[],
      outils: [] as MenuItemConfig[],
    };
    filteredMenuItems.forEach((item) => {
      if (item.group) groups[item.group].push(item);
    });
    return groups;
  }, [filteredMenuItems]);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Alt+[1-9] pour navigation rapide
      if (e.altKey && /^[1-9]$/.test(e.key)) {
        const itemIndex = parseInt(e.key) - 1;
        const allItems = memoMenuItems.filter((item) => item.shortcut);
        if (itemIndex < allItems.length) {
          setView(allItems[itemIndex].id);
          setIsMobileMenuOpen(false);
        }
      }
      // Cmd/Ctrl+K pour recherche
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [setView, setIsMobileMenuOpen, searchOpen, memoMenuItems]);

  const handleNavClick = (view: ViewState) => {
    setView(view);
    setIsMobileMenuOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
  };

  // Filtrer les items par recherche
  const searchResults = searchQuery
    ? menuItems.filter(
        (item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

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
          fixed top-0 left-0 z-30 h-screen w-72 glass-strong text-brand-600 dark:text-brand-300 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col border-r border-white/20 dark:border-white/5
          ${isMobileMenuOpen ? "translate-x-0 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.3)]" : "-translate-x-full lg:translate-x-0"}
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
              className="relative bg-linear-to-tr from-brand-600 to-indigo-500 text-white p-3.5 rounded-2xl shadow-xl shadow-brand-500/30 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500"
              aria-hidden="true"
            >
              <Briefcase size={26} strokeWidth={2.5} />
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-[2px]" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-brand-950 dark:text-white tracking-tighter leading-[0.85] font-display uppercase italic">
                Micro
              </span>
              <span className="text-[14px] font-bold text-brand-600 dark:text-brand-400 tracking-widest uppercase ml-0.5">
                Gestion
              </span>
            </div>
          </button>
        </div>

        {/* Navigation avec Recherche */}
        <div className="px-4 py-3">
          {/* Bouton Recherche Rapide */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-800/50 text-brand-600 dark:text-brand-400 transition-all group border border-brand-100 dark:border-brand-800/50 mb-3"
            title="Cmd/Ctrl+K"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-xs font-bold uppercase tracking-widest flex-1 text-left">
              Chercher...
            </span>
            <kbd className="text-[10px] px-2 py-0.5 bg-brand-200 dark:bg-brand-700 rounded text-brand-700 dark:text-brand-300 font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Zone de Recherche Ouverte */}
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3 space-y-2"
            >
              <input
                type="text"
                placeholder="Rechercher un menu..."
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-brand-400 dark:border-brand-600 bg-white dark:bg-brand-900/50 text-brand-900 dark:text-white placeholder-brand-400 dark:placeholder-brand-500 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {searchResults.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-100 dark:bg-brand-800/50 hover:bg-brand-200 dark:hover:bg-brand-700 text-brand-900 dark:text-white text-sm font-bold transition-all text-left"
                    >
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Navigation avec Groupes */}
        <nav
          className={`flex-1 px-4 py-2 ${isCompactMode ? "space-y-0.5" : "space-y-4"} overflow-y-auto custom-scrollbar transition-all duration-300`}
          aria-label="Navigation principale"
        >
          {/* Groupe GESTION */}
          {groupedMenuItems.gestion.length > 0 && (
            <div>
              <div
                className={`text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-[0.25em] mb-2 px-4 opacity-70 ${isCompactMode ? "hidden" : ""}`}
                aria-hidden="true"
              >
                📊 Gestion
              </div>
              <div className={isCompactMode ? "space-y-0.5" : "space-y-1.5"}>
                {groupedMenuItems.gestion.map((item) => (
                  <MenuItemButton
                    key={item.id}
                    item={item}
                    isActive={currentView === item.id}
                    onClick={() => handleNavClick(item.id)}
                    isCompact={isCompactMode}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Groupe FINANCES */}
          {groupedMenuItems.finances.length > 0 && (
            <div>
              <div
                className={`text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-[0.25em] mb-2 px-4 opacity-70 mt-4 ${isCompactMode ? "hidden" : ""}`}
                aria-hidden="true"
              >
                💰 Finances
              </div>
              <div className={isCompactMode ? "space-y-0.5" : "space-y-1.5"}>
                {groupedMenuItems.finances.map((item) => (
                  <MenuItemButton
                    key={item.id}
                    item={item}
                    isActive={currentView === item.id}
                    onClick={() => handleNavClick(item.id)}
                    isCompact={isCompactMode}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Groupe OUTILS */}
          {groupedMenuItems.outils.length > 0 && (
            <div>
              <div
                className={`text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-[0.25em] mb-2 px-4 opacity-70 mt-4 ${isCompactMode ? "hidden" : ""}`}
                aria-hidden="true"
              >
                🔧 Outils
              </div>
              <div className={isCompactMode ? "space-y-0.5" : "space-y-1.5"}>
                {groupedMenuItems.outils.map((item) => (
                  <MenuItemButton
                    key={item.id}
                    item={item}
                    isActive={currentView === item.id}
                    onClick={() => handleNavClick(item.id)}
                    isCompact={isCompactMode}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Theme Toggle & Compact Mode & Footer */}
        <div className="p-4 mt-auto border-t border-brand-100/50 dark:border-brand-800/50 space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              aria-label={
                isDarkMode ? "Passer au mode clair" : "Passer au mode sombre"
              }
              className="flex-1 flex items-center justify-between p-4 rounded-3xl bg-brand-50 dark:bg-brand-900/50 hover:bg-brand-100 dark:hover:bg-brand-800 transition-colors group shadow-sm border border-brand-100 dark:border-brand-800"
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
                <span
                  className={`text-xs font-black uppercase tracking-widest text-brand-600 dark:text-brand-300 ${isCompactMode ? "hidden" : ""}`}
                >
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

            {/* Bouton Mode Compact */}
            <button
              onClick={() => setIsCompactMode(!isCompactMode)}
              aria-label={isCompactMode ? "Mode normal" : "Mode compact"}
              className="p-4 rounded-3xl bg-brand-50 dark:bg-brand-900/50 hover:bg-brand-100 dark:hover:bg-brand-800 transition-colors group shadow-sm border border-brand-100 dark:border-brand-800"
              title={isCompactMode ? "Mode normal" : "Mode compact"}
            >
              <svg
                className="w-5 h-5 text-brand-600 dark:text-brand-300 group-hover:rotate-12 transition-transform"
                fill={isCompactMode ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/60 dark:bg-brand-900/60 rounded-4xl border border-white/50 dark:border-brand-800/50 shadow-sm group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-brand-700 via-brand-600 to-brand-800 dark:from-white dark:to-neutral-100 flex items-center justify-center text-lg font-black text-white dark:text-brand-900 shadow-lg group-hover:scale-110 transition-transform">
              {userProfile.companyName?.[0] || "M"}
              {userProfile.companyName?.[1] || "G"}
            </div>
            <div
              className={`overflow-hidden flex-1 ${isCompactMode ? "hidden" : ""}`}
            >
              <p className="text-sm font-black text-brand-950 dark:text-white truncate tracking-tight uppercase">
                {userProfile.companyName || "Espace Pro"}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`w-2 h-2 rounded-full border border-white/20 ${isOffline ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"}`}
                ></span>
                <p className="text-[10px] font-black text-brand-500 dark:text-neutral-400 truncate uppercase tracking-widest flex items-center gap-1">
                  {isOffline ? "Hors ligne" : "En ligne"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

/**
 * Composant MenuItemButton — Item de navigation avec badges et raccourcis
 */
interface MenuItemButtonProps {
  item: MenuItemConfig;
  isActive: boolean;
  onClick: () => void;
  isCompact: boolean;
}

const MenuItemButton: React.FC<MenuItemButtonProps> = ({
  item,
  isActive,
  onClick,
  isCompact,
}) => {
  return (
    <motion.button
      key={item.id}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-current={isActive ? "page" : undefined}
      className={`
        interactive-item w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group relative
        ${
          isActive
            ? "bg-brand-600 text-white shadow-xl shadow-brand-500/30 scale-[1.02]"
            : "hover:bg-brand-100/60 dark:hover:bg-brand-800/30 text-brand-500/90 dark:text-brand-400/90 hover:text-brand-950 dark:hover:text-brand-50"
        }
      `}
      title={isCompact ? item.label : undefined}
    >
      {/* Icône */}
      <span
        className={`flex-shrink-0 transition-all duration-500 ${
          isActive
            ? "scale-110 drop-shadow-sm"
            : "group-hover:scale-110 group-hover:rotate-3"
        }`}
      >
        {React.isValidElement(item.icon)
          ? React.cloneElement(
              item.icon as React.ReactElement<{ size?: number }>,
              { size: 20 },
            )
          : item.icon}
      </span>

      {/* Texte (caché en mode compact) */}
      {!isCompact && (
        <span className="flex-1 text-left tracking-tight">{item.label}</span>
      )}

      {/* Badge de notification */}
      {item.badge !== undefined && !isCompact && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`inline-flex items-center justify-center w-5 h-5 text-xs font-black rounded-full text-white ${
            item.badge && typeof item.badge === "number" && item.badge > 0
              ? "bg-rose-500 shadow-lg shadow-rose-500/50"
              : "bg-brand-700"
          }`}
        >
          {item.badge}
        </motion.span>
      )}

      {/* Indicateur actif */}
      {isActive && (
        <motion.div
          layoutId="active-nav-dot"
          className={`rounded-full bg-accent-400 shadow-[0_0_12px_rgba(251,113,133,0.8)] ${
            isCompact ? "w-2 h-2" : "w-1.5 h-1.5"
          }`}
        />
      )}

      {/* Raccourci clavier (visible au hover) */}
      {item.shortcut && !isCompact && (
        <span className="absolute right-2 opacity-0 group-hover:opacity-100 text-[10px] font-mono font-bold text-brand-500 dark:text-brand-400 transition-opacity">
          alt+{item.shortcut}
        </span>
      )}
    </motion.button>
  );
};

export default Sidebar;

import React from 'react';
import { motion } from 'motion/react';
import { ViewState, Theme } from '../types';
import { LayoutDashboard, FileText, Users, Settings, Briefcase, Package, Truck, Calculator, Sparkles, Mail, Calendar, Sun, Moon, Monitor } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isMobileMenuOpen, setIsMobileMenuOpen, theme, setTheme }) => {
  const menuItems: { id: ViewState; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={18} />, color: 'from-blue-600 to-indigo-600' },
    { id: 'invoices', label: 'Devis & Factures', icon: <FileText size={18} />, color: 'from-emerald-600 to-teal-600' },
    { id: 'calendar', label: 'Agenda', icon: <Calendar size={18} />, color: 'from-amber-500 to-orange-600' },
    { id: 'clients', label: 'Clients', icon: <Users size={18} />, color: 'from-violet-600 to-purple-600' },
    { id: 'suppliers', label: 'Fournisseurs', icon: <Truck size={18} />, color: 'from-rose-600 to-pink-600' },
    { id: 'products', label: 'Catalogue', icon: <Package size={18} />, color: 'from-cyan-600 to-blue-600' },
    { id: 'accounting', label: 'Comptabilité', icon: <Calculator size={18} />, color: 'from-indigo-600 to-blue-700' },
    { id: 'emails', label: 'Emails', icon: <Mail size={18} />, color: 'from-sky-500 to-blue-600' },
    { id: 'ai_assistant', label: 'Assistant IA', icon: <Sparkles size={18} />, color: 'from-fuchsia-600 to-purple-600' },
    { id: 'settings', label: 'Paramètres', icon: <Settings size={18} />, color: 'from-slate-600 to-slate-800' },
  ];

  const handleNavClick = (view: ViewState) => {
    setView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-20 bg-brand-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-30 h-screen w-72 bg-[var(--bg-sidebar)] text-[var(--text-main)] transition-transform duration-500 ease-in-out border-r border-[var(--card-border)] flex flex-col shadow-2xl lg:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Area */}
        <div className="flex items-center justify-between px-8 py-12">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="bg-linear-to-br from-brand-900 to-brand-700 dark:from-white dark:to-brand-200 text-white dark:text-brand-900 p-3 rounded-2xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
              <Briefcase size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-brand-900 dark:text-white tracking-tighter leading-none">MICRO<br/><span className="text-brand-500 dark:text-brand-400">GESTION</span></h1>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-black text-brand-300 dark:text-brand-600 uppercase tracking-[0.25em] mb-6 px-4">Menu Principal</div>
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`
                w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group relative overflow-hidden
                ${currentView === item.id 
                  ? `bg-linear-to-br ${item.color} text-white shadow-xl shadow-brand-900/10` 
                  : 'text-brand-500 dark:text-brand-500 hover:bg-pastel-blue/40 dark:hover:bg-brand-900/50 hover:text-vibrant-blue dark:hover:text-brand-100'}
              `}
              style={index === 0 ? { fontFamily: 'Arial' } : {}}
            >
              <span className={`transition-colors duration-300 ${currentView === item.id ? 'text-white' : 'text-brand-300 dark:text-brand-700 group-hover:text-brand-900 dark:group-hover:text-brand-100'}`}>
                {item.icon}
              </span>
              <span className="relative z-10">{item.label}</span>
              {currentView === item.id && (
                <motion.div 
                  layoutId="activeNav"
                  className={`absolute inset-0 bg-linear-to-br ${item.color} -z-10`}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Theme Toggle & Footer */}
        <div className="p-6 mt-auto space-y-4">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-brand-50 dark:bg-brand-900/30 rounded-2xl transition-all hover:bg-brand-100 dark:hover:bg-brand-900/50 text-brand-600 dark:text-brand-300 border border-brand-100 dark:border-brand-800/50 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-brand-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                {theme === 'dark' ? <Sun size={18} className="text-amber-500" /> : theme === 'light' ? <Moon size={18} className="text-brand-600" /> : <Monitor size={18} className="text-blue-500" />}
              </div>
              <span className="text-sm font-bold tracking-tight">
                {theme === 'dark' ? 'Mode Clair' : theme === 'light' ? 'Mode Sombre' : 'Mode Système'}
              </span>
            </div>
            <div className={`w-10 h-5 rounded-full p-1 transition-colors duration-300 ${theme === 'dark' ? 'bg-brand-700' : theme === 'light' ? 'bg-brand-200' : 'bg-blue-500'}`}>
              <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-300 ${theme === 'dark' ? 'translate-x-5' : theme === 'light' ? 'translate-x-0' : 'translate-x-2.5'}`} />
            </div>
          </button>

          <div className="flex items-center gap-4 p-4 bg-white dark:bg-brand-900/30 rounded-[2rem] border border-brand-100 dark:border-brand-800/50 shadow-sm group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 dark:from-white dark:to-brand-200 flex items-center justify-center text-lg font-black text-white dark:text-brand-900 shadow-lg group-hover:rotate-3 transition-transform">
              MG
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-black text-brand-900 dark:text-white truncate tracking-tight">Espace Pro</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] font-bold text-brand-400 dark:text-brand-500 truncate uppercase tracking-widest">Connecté</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

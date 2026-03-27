import React, { useState, useRef, useEffect, useMemo, useId } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Interface pour les options du Combobox
 */
export interface ComboboxOption {
  id: string;
  label: string;
  subLabel?: string;
  data?: unknown;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string; // ID de l'option sélectionnée
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Composant Combobox (Autocomplétion) réutilisable
 * Offre une meilleure UX que le select standard pour les longues listes
 */
const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Rechercher...',
  label,
  error,
  emptyMessage = 'Aucun résultat trouvé',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  // Trouver l'option actuellement sélectionnée pour affichage
  const selectedOption = useMemo(() => options.find((opt) => opt.id === value), [options, value]);

  // Filtrer les options selon la recherche
  const filteredOptions = useMemo(() => {
    if (!searchTerm) {
      return options;
    }
    const lowerSearch = searchTerm.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lowerSearch) ||
        opt.subLabel?.toLowerCase().includes(lowerSearch)
    );
  }, [options, searchTerm]);

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.id);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1.5 ml-1">
          {label}
        </label>
      )}

      <div
        className={`group relative flex items-center bg-brand-50/50 border rounded-2xl transition-all duration-200 cursor-text
          ${isOpen ? 'border-brand-900 ring-4 ring-brand-900/5' : 'border-brand-100'}
          ${error ? 'border-red-500 ring-red-500/10' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className="pl-4 text-brand-300">
          <Search size={18} />
        </div>

        <input
          ref={inputRef}
          id={inputId}
          type="text"
          className="w-full p-4 bg-transparent outline-none text-sm font-medium placeholder:text-brand-300"
          placeholder={selectedOption ? selectedOption.label : placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled}
          onFocus={() => setIsOpen(true)}
        />

        <div className="flex items-center gap-1 pr-3">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-brand-300 hover:text-brand-600 transition-colors"
              title="Effacer la sélection"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => { if (!disabled) { setIsOpen(!isOpen); inputRef.current?.focus(); } }}
            className="p-1 text-brand-400 focus:outline-none"
            aria-label="Ouvrir/fermer les options"
          >
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {error && <p className="text-[10px] text-red-600 font-medium mt-1 ml-1">⚠️ {error}</p>}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 4 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-800 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
          >
            {filteredOptions.length > 0 ? (
              <div className="p-1">
                {filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors
                      ${
                        value === option.id
                          ? 'bg-brand-900 text-white dark:bg-white dark:text-brand-900'
                          : 'hover:bg-brand-50 dark:hover:bg-brand-800 text-brand-900 dark:text-white'
                      }
                    `}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{option.label}</span>
                      {option.subLabel && (
                        <span
                          className={`text-[10px] ${value === option.id ? 'opacity-80' : 'text-brand-500'}`}
                        >
                          {option.subLabel}
                        </span>
                      )}
                    </div>
                    {value === option.id && <Check size={16} />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-brand-400 italic">{emptyMessage}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Combobox;

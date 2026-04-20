/**
 * Combobox — Sélecteur avec recherche intégrée.
 */
import { ChevronDown, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface ComboboxOption {
  id: string;
  label: string;
  subLabel?: string;
}

interface ComboboxProps {
  label?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

const Combobox: React.FC<ComboboxProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Rechercher...",
  disabled = false,
  error,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value);

  const filtered =
    query.trim() === ""
      ? options
      : options.filter(
          (o) =>
            o.label.toLowerCase().includes(query.toLowerCase()) ||
            o.subLabel?.toLowerCase().includes(query.toLowerCase()),
        );

  const handleSelect = useCallback(
    (id: string) => {
      onChange(id);
      setQuery("");
      setOpen(false);
    },
    [onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("");
      setQuery("");
    },
    [onChange],
  );

  // Fermer en dehors du composant
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const btnClass = `w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-sm text-left transition-all
    ${error ? "border-red-400 dark:border-red-500" : "border-brand-200 dark:border-brand-700"}
    bg-white dark:bg-brand-900 text-brand-900 dark:text-brand-50
    hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30
    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`;

  const btnInner = (
    <>
      <span className={selected ? "" : "text-brand-400"}>
        {selected ? selected.label : placeholder}
      </span>
      <span className="flex items-center gap-1 shrink-0">
        {value && (
          <span
            role="button"
            aria-label="Effacer la sélection"
            onClick={handleClear}
            className="p-0.5 rounded hover:bg-brand-100 dark:hover:bg-brand-800 text-brand-400"
          >
            <X size={12} />
          </span>
        )}
        <ChevronDown
          size={14}
          className={`text-brand-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </span>
    </>
  );

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-semibold text-brand-600 dark:text-brand-300 mb-1">
          {label}
        </label>
      )}

      {open ? (
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded="true"
          onClick={() => !disabled && setOpen((v) => !v)}
          className={btnClass}
        >
          {btnInner}
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded="false"
          onClick={() => !disabled && setOpen((v) => !v)}
          className={btnClass}
        >
          {btnInner}
        </button>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-brand-900 border border-brand-200 dark:border-brand-700 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-brand-100 dark:border-brand-800">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full px-3 py-1.5 text-sm rounded-lg bg-brand-50 dark:bg-brand-800 text-brand-900 dark:text-brand-50 border-0 outline-none focus:ring-1 focus:ring-brand-400"
              aria-label="Filtrer les options"
            />
          </div>
          <ul
            role="listbox"
            aria-label={label}
            className="max-h-48 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <div
                role="option"
                aria-selected="false"
                aria-disabled="true"
                className="px-4 py-3 text-sm text-brand-400 text-center"
              >
                Aucun résultat
              </div>
            ) : (
              filtered.map((option) => {
                const isSelected = option.id === value;
                const itemClass = `px-4 py-2.5 cursor-pointer text-sm hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors ${
                  isSelected
                    ? "bg-brand-50 dark:bg-brand-800 font-semibold text-brand-700 dark:text-brand-200"
                    : "text-brand-900 dark:text-brand-100"
                }`;
                const itemContent = (
                  <>
                    <div>{option.label}</div>
                    {option.subLabel && (
                      <div className="text-[11px] text-brand-400 mt-0.5">
                        {option.subLabel}
                      </div>
                    )}
                  </>
                );
                return isSelected ? (
                  <li
                    key={option.id}
                    role="option"
                    aria-selected="true"
                    onClick={() => handleSelect(option.id)}
                    className={itemClass}
                  >
                    {itemContent}
                  </li>
                ) : (
                  <li
                    key={option.id}
                    role="option"
                    aria-selected="false"
                    onClick={() => handleSelect(option.id)}
                    className={itemClass}
                  >
                    {itemContent}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Combobox;

import { Search } from "lucide-react";
import React from "react";
import type { ValidationResult } from "../lib/zod-schemas";

// ---------------------------------------------------------------------------
// SearchFilterFields
// ---------------------------------------------------------------------------

interface SearchFilterFieldsProps {
  searchTerm: string;
  showArchived: boolean;
  onSearchChange: (value: string) => void;
  onShowArchivedChange: (value: boolean) => void;
  placeholder?: string;
}

export const SearchFilterFields: React.FC<SearchFilterFieldsProps> = ({
  searchTerm,
  showArchived,
  onSearchChange,
  onShowArchivedChange,
  placeholder = "Rechercher...",
}) => (
  <div className="flex flex-col sm:flex-row gap-3">
    <div className="relative flex-1">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none"
      />
      <input
        type="search"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-brand-200 dark:border-slate-600 rounded-xl text-sm text-brand-900 dark:text-white placeholder-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        aria-label="Rechercher"
      />
    </div>
    <label className="flex items-center gap-2 text-sm font-medium text-brand-700 dark:text-brand-300 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={showArchived}
        onChange={(e) => onShowArchivedChange(e.target.checked)}
        className="rounded border-brand-300 text-brand-600 focus:ring-brand-500"
        aria-label="Afficher les archivés"
      />
      Archivés
    </label>
  </div>
);

// ---------------------------------------------------------------------------
// ContactFields
// ---------------------------------------------------------------------------

type ValidationErrors = Partial<Record<string, ValidationResult | undefined>>;
type TouchedFields = Partial<Record<string, boolean>>;

interface ContactFieldsProps {
  name: string;
  email: string;
  phone: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  contactNameLabel?: string;
  required?: boolean;
  validationErrors?: ValidationErrors;
  touchedFields?: TouchedFields;
}

const fieldClass =
  "w-full px-3 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-sm text-brand-900 dark:text-white placeholder-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500";
const errorFieldClass = "border-red-400 focus:ring-red-400";
const normalFieldClass = "border-brand-200 dark:border-slate-600";

function resolveError(
  errors: ValidationErrors | undefined,
  touched: TouchedFields | undefined,
  field: string,
): string | undefined {
  if (!errors || !touched) return undefined;
  if (!touched[field]) return undefined;
  const result = errors[field];
  if (!result) return undefined;
  if (typeof result === "object" && "valid" in result) {
    return result.valid ? undefined : (result.error ?? "Valeur invalide");
  }
  return undefined;
}

export const ContactFields: React.FC<ContactFieldsProps> = ({
  name,
  email,
  phone,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  contactNameLabel = "Nom",
  required = false,
  validationErrors,
  touchedFields,
}) => {
  const nameError = resolveError(validationErrors, touchedFields, "name");
  const emailError = resolveError(validationErrors, touchedFields, "email");
  const phoneError = resolveError(validationErrors, touchedFields, "phone");

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">
        Coordonnées
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider">
            {contactNameLabel}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required={required}
            className={`${fieldClass} ${nameError ? errorFieldClass : normalFieldClass}`}
            aria-label={contactNameLabel}
          />
          {nameError && <p className="text-xs text-red-500">{nameError}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className={`${fieldClass} ${emailError ? errorFieldClass : normalFieldClass}`}
            aria-label="E-mail"
          />
          {emailError && <p className="text-xs text-red-500">{emailError}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider">
            Téléphone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className={`${fieldClass} ${phoneError ? errorFieldClass : normalFieldClass}`}
            aria-label="Téléphone"
          />
          {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// AddressFields
// ---------------------------------------------------------------------------

interface AddressFieldsProps {
  address: string;
  postalCode: string;
  city: string;
  onAddressChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onCityChange: (value: string) => void;
  showPostalCity?: boolean;
  validationErrors?: ValidationErrors;
  touchedFields?: TouchedFields;
}

export const AddressFields: React.FC<AddressFieldsProps> = ({
  address,
  postalCode,
  city,
  onAddressChange,
  onPostalCodeChange,
  onCityChange,
  showPostalCity = true,
  validationErrors,
  touchedFields,
}) => {
  const addressError = resolveError(validationErrors, touchedFields, "address");

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider">
          Adresse
        </label>
        <textarea
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          rows={2}
          className={`${fieldClass} resize-none ${addressError ? errorFieldClass : normalFieldClass}`}
          aria-label="Adresse"
        />
        {addressError && <p className="text-xs text-red-500">{addressError}</p>}
      </div>

      {showPostalCity && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider">
              Code postal
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => onPostalCodeChange(e.target.value)}
              className={`${fieldClass} ${normalFieldClass}`}
              aria-label="Code postal"
              maxLength={5}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider">
              Ville
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              className={`${fieldClass} ${normalFieldClass}`}
              aria-label="Ville"
            />
          </div>
        </div>
      )}
    </div>
  );
};

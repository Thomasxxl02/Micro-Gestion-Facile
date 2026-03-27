/**
 * Composants réutilisables: Common Form Field Groups
 * Utilisés pour construire les formulaires dans InvoiceManager, ClientManager, SupplierManager
 * Réduit la duplication de ~300 LOC de formulaires identiques
 */

import React from 'react';
import { FormField, TextAreaField, SelectField } from './FormFields';
import { FormFieldValidated } from './FormFieldValidated';

/**
 * Champs de contact standards (nom, email, téléphone)
 * Utilisé par: Client, Supplier, EndUser (invoices)
 */
interface ContactFieldsProps {
  name: string;
  email: string;
  phone: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  nameError?: string;
  emailError?: string;
  phoneError?: string;
  contactNameLabel?: string; // ex: "Contact" pour supplier
  required?: boolean;
}

export const ContactFields: React.FC<ContactFieldsProps> = ({
  name,
  email,
  phone,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  nameError: _nameError,
  emailError: _emailError,
  phoneError: _phoneError,
  contactNameLabel = 'Nom',
  required = true,
}) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <FormFieldValidated
      label={contactNameLabel}
      value={name}
      onChange={onNameChange}
      type="text"
      validationType="name"
      required={required}
    />
    <FormFieldValidated
      label="Email"
      value={email}
      onChange={onEmailChange}
      type="email"
      validationType="email"
      required={required}
    />
    <FormFieldValidated
      label="Téléphone"
      value={phone}
      onChange={onPhoneChange}
      type="tel"
      validationType="phone"
    />
  </div>
);

/**
 * Champs d'adresse standards (rue, code postal, ville, pays)
 * Utilisé par: Client, Supplier
 */
interface AddressFieldsProps {
  address: string;
  postalCode: string;
  city: string;
  country?: string;
  onAddressChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onCountryChange?: (value: string) => void;
  addressError?: string;
  postalCodeError?: string;
  cityError?: string;
  required?: boolean;
}

export const AddressFields: React.FC<AddressFieldsProps> = ({
  address,
  postalCode,
  city,
  country = 'FR',
  onAddressChange,
  onPostalCodeChange,
  onCityChange,
  onCountryChange,
  addressError: _addressError,
  postalCodeError: _postalCodeError,
  cityError: _cityError,
  required = false,
}) => (
  <div className="space-y-4">
    <FormFieldValidated
      label="Adresse"
      value={address}
      onChange={onAddressChange}
      type="text"
      validationType="address"
      required={required}
    />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <FormFieldValidated
        label="Code postal"
        value={postalCode}
        onChange={onPostalCodeChange}
        type="text"
        validationType="postal-code"
        required={required}
      />
      <FormFieldValidated
        label="Ville"
        value={city}
        onChange={onCityChange}
        type="text"
        validationType="name"
        required={required}
      />
      {onCountryChange && (
        <SelectField
          label="Pays"
          value={country}
          onChange={onCountryChange}
          options={[
            { value: 'FR', label: 'France' },
            { value: 'BE', label: 'Belgique' },
            { value: 'LU', label: 'Luxembourg' },
            { value: 'CH', label: 'Suisse' },
            { value: 'ES', label: 'Espagne' },
            { value: 'IT', label: 'Italie' },
            { value: 'DE', label: 'Allemagne' },
            { value: 'NL', label: 'Pays-Bas' },
            { value: 'GB', label: 'Royaume-Uni' },
            { value: 'US', label: 'États-Unis' },
            { value: 'CA', label: 'Canada' },
            { value: 'AU', label: 'Australie' },
          ]}
          aria-label="Pays"
        />
      )}
    </div>
  </div>
);

/**
 * Champs financiers standards (TVA, conditions paiement, notes)
 * Utilisé par: Client, Supplier, Invoice
 */
interface FinancialFieldsProps {
  tvaNumber?: string;
  paymentTerms?: string;
  notes?: string;
  onTvaNumberChange?: (value: string) => void;
  onPaymentTermsChange?: (value: string) => void;
  onNotesChange?: (value: string) => void;
  tvaLabel?: string;
  notesLabel?: string;
}

export const FinancialFields: React.FC<FinancialFieldsProps> = ({
  tvaNumber = '',
  paymentTerms = '30',
  notes = '',
  onTvaNumberChange,
  onPaymentTermsChange,
  onNotesChange,
  tvaLabel = 'Numéro TVA',
  notesLabel = 'Notes',
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {onTvaNumberChange && (
        <FormFieldValidated
          label={tvaLabel}
          value={tvaNumber}
          onChange={onTvaNumberChange}
          type="text"
          validationType="vat"
          placeholder="FR12345678901"
        />
      )}
      {onPaymentTermsChange && (
        <FormFieldValidated
          label="Délai paiement (jours)"
          value={paymentTerms}
          onChange={onPaymentTermsChange}
          type="number"
          validationType="amount"
          placeholder="30"
          min="0"
        />
      )}
    </div>
    {onNotesChange && (
      <TextAreaField
        label={notesLabel}
        value={notes}
        onChange={onNotesChange}
        placeholder="Remarques internes..."
        rows={3}
        aria-label={notesLabel}
      />
    )}
  </div>
);

/**
 * Champs de produit/service standards
 * Utilisé par: InvoiceManager (ligne item), ProductManager
 */
interface ProductFieldsProps {
  name: string;
  description: string;
  price: string;
  category?: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onCategoryChange?: (value: string) => void;
  categories?: Array<{ value: string; label: string }>;
  nameError?: string;
  priceError?: string;
}

export const ProductFields: React.FC<ProductFieldsProps> = ({
  name,
  description,
  price,
  category,
  onNameChange,
  onDescriptionChange,
  onPriceChange,
  onCategoryChange,
  categories = [],
  nameError,
  priceError,
}) => (
  <div className="space-y-4">
    <FormField
      label="Produit/Service"
      value={name}
      onChange={onNameChange}
      type="text"
      error={nameError}
      aria-label="Produit/Service"
      aria-required
      required
    />
    <TextAreaField
      label="Description"
      value={description}
      onChange={onDescriptionChange}
      rows={2}
      aria-label="Description"
    />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <FormField
        label="Prix unitaire"
        value={price}
        onChange={onPriceChange}
        type="number"
        step="0.01"
        min="0"
        error={priceError}
        aria-label="Prix unitaire"
        aria-required
        required
      />
      {onCategoryChange && categories.length > 0 && (
        <SelectField
          label="Catégorie"
          value={category || ''}
          onChange={onCategoryChange}
          options={categories}
          aria-label="Catégorie"
        />
      )}
    </div>
  </div>
);

/**
 * Champs de recherche/filtre standards
 * Utilisé par tous les managers pour la barre de recherche
 */
interface SearchFilterFieldsProps {
  searchTerm: string;
  showArchived: boolean;
  onSearchChange: (value: string) => void;
  onShowArchivedChange: (value: boolean) => void;
  placeholder?: string;
  hasArchive?: boolean;
}

export const SearchFilterFields: React.FC<SearchFilterFieldsProps> = ({
  searchTerm,
  showArchived,
  onSearchChange,
  onShowArchivedChange,
  placeholder = 'Rechercher...',
  hasArchive = true,
}) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <FormField
      label="Rechercher"
      value={searchTerm}
      onChange={onSearchChange}
      type="search"
      placeholder={placeholder}
      aria-label="Rechercher"
      className="w-full md:w-64"
    />
    {hasArchive && (
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => onShowArchivedChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
          aria-label="Afficher les archives"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Afficher les archives</span>
      </label>
    )}
  </div>
);

export default {
  ContactFields,
  AddressFields,
  FinancialFields,
  ProductFields,
  SearchFilterFields,
};

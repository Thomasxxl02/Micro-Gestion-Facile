/**
 * Composant FormFieldValidated - FormField avec validation intégrée
 * Remplace le FormField basique avec validation live
 *
 * Usage simple:
 * ```tsx
 * <FormFieldValidated
 *   label="Email"
 *   type="email"
 *   value={email}
 *   onChange={setEmail}
 *   validator={validateEmail}
 * />
 *
 * <FormFieldValidated
 *   label="SIRET"
 *   value={siret}
 *   onChange={setSiret}
 *   validator={validateSIRET}
 *   validationType="siret"
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
import { type LucideIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  validateSIRET,
  validateSIREN,
  validateIBAN,
  validateEmail,
  validateFrenchPostalCode,
  validateFrenchPhone,
  validateVATNumber,
  validateWebsite,
  validateName,
  validateAmount,
  validateDate,
  validateRequired,
  validateAddress,
  type ValidationResult,
} from '../lib/validators';

type ValidationType =
  | 'siret'
  | 'siren'
  | 'iban'
  | 'email'
  | 'postal-code'
  | 'phone'
  | 'vat'
  | 'website'
  | 'name'
  | 'amount'
  | 'date'
  | 'required'
  | 'address'
  | 'none';

// Map des validateurs - accepte any pour les différentes signatures de validateurs
const validatorsMap: Record<ValidationType, (value: unknown) => ValidationResult> = {
  siret: validateSIRET as (value: unknown) => ValidationResult,
  siren: validateSIREN as (value: unknown) => ValidationResult,
  iban: validateIBAN as (value: unknown) => ValidationResult,
  email: validateEmail as (value: unknown) => ValidationResult,
  'postal-code': validateFrenchPostalCode as (value: unknown) => ValidationResult,
  phone: validateFrenchPhone as (value: unknown) => ValidationResult,
  vat: validateVATNumber as (value: unknown) => ValidationResult,
  website: validateWebsite as (value: unknown) => ValidationResult,
  name: validateName as (value: unknown) => ValidationResult,
  amount: validateAmount as (value: unknown) => ValidationResult,
  date: validateDate as (value: unknown) => ValidationResult,
  required: validateRequired as (value: unknown) => ValidationResult,
  address: validateAddress as (value: unknown) => ValidationResult,
  none: () => ({ valid: true }),
};

// Suggestions d'auto-détection sur type HTML
const htmlTypeToValidation: Record<string, ValidationType> = {
  email: 'email',
  tel: 'phone',
  date: 'date',
  url: 'website',
  number: 'amount',
  text: 'none',
};

const getFieldBorderClass = (hasErr: boolean, hasSuc: boolean): string => {
  if (hasErr) {
    return 'border-red-500 focus:ring-red-500/10 focus:border-red-600';
  }
  if (hasSuc) {
    return 'border-green-500 focus:ring-green-500/10 focus:border-green-600';
  }
  return '';
};

interface FormFieldValidatedProps {
  id?: string;
  label: string;
  description?: string;
  required?: boolean;
  /**
   * Type HTML standard ou custom pour auto-détection
   */
  type?:
    | 'text'
    | 'email'
    | 'number'
    | 'password'
    | 'url'
    | 'tel'
    | 'search'
    | 'date'
    | 'checkbox'
    | 'textarea';
  value: string | number;
  onChange: (value: string) => void;
  /**
   * Validator personnalisé (surcharge auto-détection)
   */
  validator?: (value: string | number) => ValidationResult;
  /**
   * Type de validation: si fourni, surcharge auto-détection et validator prop
   */
  validationType?: ValidationType;
  placeholder?: string;
  icon?: LucideIcon;
  className?: string;
  inputClassName?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showValidationIcon?: boolean;
  'aria-label'?: string;
  autoComplete?: string;
  maxLength?: number;
}

export const FormFieldValidated: React.FC<FormFieldValidatedProps> = ({
  id,
  label,
  description,
  required = false,
  type = 'text',
  value,
  onChange,
  validator,
  validationType,
  placeholder,
  icon: Icon,
  className = '',
  inputClassName = '',
  min,
  max,
  step,
  _validateOnChange = true,
  _validateOnBlur = true,
  showValidationIcon = true,
  'aria-label': ariaLabel,
  autoComplete,
  maxLength,
}) => {
  // Déterminer le validateur à utiliser
  const determineValidator = (): ((value: string | number) => ValidationResult) => {
    // Si validationType est fourni, utiliser ça
    if (validationType) {
      return validatorsMap[validationType];
    }

    // Si validator personnalisé est fourni
    if (validator) {
      return validator;
    }

    // Auto-détection basée sur type HTML
    const autoDetectedValidation = htmlTypeToValidation[type] || 'none';
    return validatorsMap[autoDetectedValidation];
  };

  const finalValidator = determineValidator();

  // État de validation
  const [error, setError] = useState<ValidationResult | null>(null);

  // Validation effet - sauvegarde l'état de validation
  useEffect(() => {
    if (value) {
      const result = finalValidator(value);
      setError(result);
    } else {
      // Réinitialiser si vide
      setError(null);
    }
  }, [value, finalValidator]);

  const isValid = error?.valid === true;

  // Handler combiné pour onChange
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const fieldId = id || `field-${label.toLowerCase().replaceAll(/\s+/g, '-')}`;

  let describedByValue: string | undefined;
  if (error && !error.valid) {
    describedByValue = `${fieldId}-error`;
  } else if (description) {
    describedByValue = `${fieldId}-description`;
  }

  const ariaAttrs = {
    'aria-required': required ? ('true' as const) : ('false' as const),
    'aria-invalid': isValid ? ('false' as const) : ('true' as const),
  };

  const isTextarea = type === 'textarea';
  const hasError = error && !error.valid;
  const hasSuccess = error && error.valid && value;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={fieldId}
          className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {showValidationIcon && hasSuccess && (
          <CheckCircle2 size={14} className="text-green-600" aria-hidden="true" />
        )}
      </div>

      {/* Input Container */}
      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300 pointer-events-none"
            size={18}
            aria-hidden="true"
          />
        )}

        {isTextarea ? (
          <textarea
            id={fieldId}
            required={required}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            {...ariaAttrs}
            aria-label={ariaLabel}
            aria-describedby={describedByValue}
            maxLength={maxLength}
          className={`w-full ${Icon ? 'pl-12' : 'pl-4'} p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all resize-y min-h-24 ${getFieldBorderClass(!!hasError, !!(error && error.valid && value))} ${inputClassName}`}
          />
        ) : (
          <input
            id={fieldId}
            type={type}
            required={required}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            {...ariaAttrs}
            aria-label={ariaLabel}
            aria-describedby={describedByValue}
            min={min}
            max={max}
            step={step}
            autoComplete={autoComplete ?? (type === 'password' ? 'current-password' : 'on')}
            maxLength={maxLength}
            className={`w-full ${Icon ? 'pl-12' : 'pl-4'} p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all ${getFieldBorderClass(!!hasError, !!(error && error.valid && value))} ${inputClassName}`}
          />
        )}

        {/* Erreur Icon */}
        {showValidationIcon && hasError && (
          <AlertCircle
            size={18}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-red-600 pointer-events-none"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Description */}
      {description && (
        <p
          id={`${fieldId}-description`}
          className="text-[10px] text-brand-400 mt-1 font-medium italic"
        >
          {description}
        </p>
      )}

      {/* Erreur */}
      {hasError && (
        <p
          id={`${fieldId}-error`}
          className="text-[10px] text-red-600 font-medium flex items-center gap-1"
        >
          <AlertCircle size={12} aria-hidden="true" />
          {error.error}
        </p>
      )}

      {/* Succès (optionnel) */}
      {hasSuccess && !description && (
        <p className="text-[10px] text-green-600 font-medium flex items-center gap-1">
          <CheckCircle2 size={12} aria-hidden="true" />
          Valide !
        </p>
      )}
    </div>
  );
};

/**
 * Preset pour champs courants (avec le bon type de validation pré-configuré)
 */

export const SIRETField: React.FC<Omit<FormFieldValidatedProps, 'validationType'>> = (props) => (
  <FormFieldValidated
    {...props}
    validationType="siret"
    placeholder="12345678901234"
    maxLength={14}
  />
);

export const SIRENField: React.FC<Omit<FormFieldValidatedProps, 'validationType'>> = (props) => (
  <FormFieldValidated {...props} validationType="siren" placeholder="123456789" maxLength={9} />
);

export const IBANField: React.FC<Omit<FormFieldValidatedProps, 'validationType'>> = (props) => (
  <FormFieldValidated
    {...props}
    validationType="iban"
    placeholder="FR1420041010050500013M02800"
    maxLength={34}
    autoComplete="off"
  />
);

export const EmailField: React.FC<Omit<FormFieldValidatedProps, 'validationType' | 'type'>> = (
  props
) => <FormFieldValidated {...props} type="email" validationType="email" />;

export const PhoneField: React.FC<Omit<FormFieldValidatedProps, 'validationType' | 'type'>> = (
  props
) => <FormFieldValidated {...props} type="tel" validationType="phone" placeholder="0123456789" />;

export const PostalCodeField: React.FC<Omit<FormFieldValidatedProps, 'validationType'>> = (
  props
) => (
  <FormFieldValidated {...props} validationType="postal-code" placeholder="75001" maxLength={5} />
);

export const VATField: React.FC<Omit<FormFieldValidatedProps, 'validationType'>> = (props) => (
  <FormFieldValidated {...props} validationType="vat" placeholder="FR12345678901" maxLength={15} />
);

export const WebsiteField: React.FC<Omit<FormFieldValidatedProps, 'validationType' | 'type'>> = (
  props
) => (
  <FormFieldValidated
    {...props}
    type="url"
    validationType="website"
    placeholder="https://example.com"
    autoComplete="url"
  />
);

export const AmountField: React.FC<Omit<FormFieldValidatedProps, 'validationType' | 'type'>> = (
  props
) => (
  <FormFieldValidated
    {...props}
    type="number"
    validationType="amount"
    step={0.01}
    min="0"
    autoComplete="off"
  />
);

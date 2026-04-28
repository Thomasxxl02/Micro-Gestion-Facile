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

import { type LucideIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  validateAddressForm,
  validateAmount,
  validateDate,
  validateEmailForm,
  validateFrenchPostalCode,
  validateIBAN,
  validateName,
  validatePhoneForm,
  validateRequired,
  validateSIREN,
  validateSIRETForm,
  validateTVANumberForm,
  validateWebsiteForm,
  type ValidationResult,
} from "../lib/zod-schemas";
import {
  ErrorMessage,
  ErrorIcon,
  getFieldBorderClass,
  InputIcon,
  LabelSection,
  SuccessMessage,
} from "./FormFieldValidatedSections";

// Aliases for validator map keys
const validateFrenchPhone = validatePhoneForm;
const validateVATNumber = validateTVANumberForm;

type ValidationType =
  | "siret"
  | "siren"
  | "iban"
  | "email"
  | "postal-code"
  | "phone"
  | "vat"
  | "website"
  | "name"
  | "amount"
  | "date"
  | "required"
  | "address"
  | "none";

// Map des validateurs - accepte any pour les différentes signatures de validateurs
const validatorsMap: Record<
  ValidationType,
  (value: unknown) => ValidationResult
> = {
  siret: validateSIRETForm,
  siren: validateSIREN,
  iban: validateIBAN,
  email: validateEmailForm,
  "postal-code": validateFrenchPostalCode,
  phone: validateFrenchPhone,
  vat: validateVATNumber,
  website: validateWebsiteForm,
  name: validateName,
  amount: validateAmount,
  date: validateDate,
  required: validateRequired,
  address: validateAddressForm,
  none: () => ({ valid: true }),
};

// Suggestions d'auto-détection sur type HTML
const htmlTypeToValidation: Record<string, ValidationType> = {
  email: "email",
  tel: "phone",
  date: "date",
  url: "website",
  number: "amount",
  text: "none",
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
    | "text"
    | "email"
    | "number"
    | "password"
    | "url"
    | "tel"
    | "search"
    | "date"
    | "checkbox"
    | "textarea";
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
  showErrorsImmediate?: boolean;
  showValidationIcon?: boolean;
  "aria-label"?: string;
  autoComplete?: string;
  maxLength?: number;
  error?: ValidationResult | null;
  touched?: boolean;
}

export const FormFieldValidated: React.FC<FormFieldValidatedProps> = ({
  id,
  label,
  description,
  required = false,
  type = "text",
  value,
  onChange,
  validator,
  validationType,
  placeholder,
  icon: Icon,
  className = "",
  inputClassName = "",
  min,
  max,
  step,
  validateOnChange = true,
  validateOnBlur = true,
  showErrorsImmediate = true,
  showValidationIcon = true,
  "aria-label": ariaLabel,
  maxLength,
  autoComplete: _autoComplete,
  // Propriétés optionnelles pour intégration avec useFormValidation
  error: externalError,
  touched: externalTouched,
}) => {
  const isTextarea = type === "textarea";

  // Déterminer le validateur à utiliser
  const determineValidator = (): ((
    value: string | number,
  ) => ValidationResult) => {
    // Si validationType est fourni, utiliser ça
    if (validationType) {
      return validatorsMap[validationType];
    }

    // Si validator personnalisé est fourni
    if (validator) {
      return validator;
    }

    // Auto-détection basée sur type HTML
    const autoDetectedValidation = htmlTypeToValidation[type] || "none";
    return validatorsMap[autoDetectedValidation];
  };

  const finalValidator = determineValidator();

  // État de validation interne (fallback si pas d'error externe)
  const [internalError, setInternalError] = useState<ValidationResult | null>(
    null,
  );
  const [internalTouched, setInternalTouched] = useState(false);

  // Validation au changement
  useEffect(() => {
    if (validateOnChange && value !== undefined) {
      const result = finalValidator(value);
      setInternalError(result);
    }
  }, [value, finalValidator, validateOnChange]);

  // Déterminer l'erreur et le statut touché final
  const currentError =
    externalError !== undefined ? externalError : internalError;
  const isTouched = externalTouched ?? internalTouched;

  // Afficher l'erreur si on a une erreur ET (soit on affiche tout de suite, soit le champ a été touché)
  const shouldShowError =
    currentError && !currentError.valid && (showErrorsImmediate || isTouched);
  const isValid = currentError?.valid === true;

  // Handler combiné pour onChange
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setInternalTouched(true);
    if (validateOnBlur) {
      const result = finalValidator(e.target.value);
      setInternalError(result);
    }
  };

  const fieldId = id ?? `field-${label.toLowerCase().replaceAll(/\s+/g, "-")}`;

  let describedByValue: string | undefined;
  if (shouldShowError) {
    describedByValue = `${fieldId}-error`;
  } else if (description) {
    describedByValue = `${fieldId}-description`;
  }

  const ariaAttrs = {
    "aria-required": required ? ("true" as const) : ("false" as const),
    "aria-invalid":
      !isValid && isTouched ? ("true" as const) : ("false" as const),
  };

  const hasError = shouldShowError;
  const hasSuccess = currentError && currentError.valid && value;

  const commonInputProps = {
    id: fieldId,
    required: required,
    value: value,
    onChange: handleChange,
    onBlur: handleBlur,
    placeholder: placeholder,
    ...(_autoComplete && { autoComplete: _autoComplete }),
    ...ariaAttrs,
    "aria-label": ariaLabel,
    "aria-describedby": describedByValue,
    maxLength: maxLength,
  };

  const borderClass = getFieldBorderClass(!!hasError, !!hasSuccess);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <LabelSection
        fieldId={fieldId}
        label={label}
        required={required}
        showValidationIcon={showValidationIcon}
        hasSuccess={hasSuccess}
      />

      <div className="relative">
        <InputIcon icon={Icon} />

        {isTextarea ? (
          <textarea
            {...commonInputProps}
            className={`w-full ${Icon ? "pl-12" : "pl-4"} p-4 bg-white dark:bg-(--input-bg) border border-(--input-border) rounded-2xl outline-none focus:ring-4 focus:ring-(--input-focus-ring) focus:border-(--input-focus-border) text-(--input-text) placeholder:text-(--input-placeholder) transition-all resize-y min-h-24 ${borderClass} ${inputClassName}`}
          />
        ) : (
          <input
            {...commonInputProps}
            type={type}
            min={min}
            max={max}
            step={step}
            className={`w-full ${Icon ? "pl-12" : "pl-4"} p-4 bg-white dark:bg-(--input-bg) border border-(--input-border) rounded-2xl outline-none focus:ring-4 focus:ring-(--input-focus-ring) focus:border-(--input-focus-border) text-(--input-text) placeholder:text-(--input-placeholder) transition-all ${borderClass} ${inputClassName}`}
          />
        )}

        <ErrorIcon
          showValidationIcon={showValidationIcon}
          hasError={!!hasError}
        />
      </div>

      {description && (
        <p
          id={`${fieldId}-description`}
          className="text-[10px] text-brand-400 dark:text-brand-500 mt-1 font-medium italic"
        >
          {description}
        </p>
      )}

      <ErrorMessage
        hasError={!!hasError}
        fieldId={fieldId}
        currentError={currentError}
      />

      <SuccessMessage hasSuccess={hasSuccess} description={description} />
    </div>
  );
};

/**
 * Preset pour champs courants (avec le bon type de validation pré-configuré)
 */

export const SIRETField: React.FC<
  Omit<FormFieldValidatedProps, "validationType">
> = (props) => (
  <FormFieldValidated
    {...props}
    validationType="siret"
    placeholder="12345678901234"
    maxLength={14}
  />
);

export const SIRENField: React.FC<
  Omit<FormFieldValidatedProps, "validationType">
> = (props) => (
  <FormFieldValidated
    {...props}
    validationType="siren"
    placeholder="123456789"
    maxLength={9}
  />
);

export const IBANField: React.FC<
  Omit<FormFieldValidatedProps, "validationType">
> = (props) => (
  <FormFieldValidated
    {...props}
    validationType="iban"
    placeholder="FR1420041010050500013M02800"
    maxLength={34}
    autoComplete="off"
  />
);

export const EmailField: React.FC<
  Omit<FormFieldValidatedProps, "validationType" | "type">
> = (props) => (
  <FormFieldValidated {...props} type="email" validationType="email" />
);

export const PhoneField: React.FC<
  Omit<FormFieldValidatedProps, "validationType" | "type">
> = (props) => (
  <FormFieldValidated
    {...props}
    type="tel"
    validationType="phone"
    placeholder="0123456789"
  />
);

export const PostalCodeField: React.FC<
  Omit<FormFieldValidatedProps, "validationType">
> = (props) => (
  <FormFieldValidated
    {...props}
    validationType="postal-code"
    placeholder="75001"
    maxLength={5}
  />
);

export const VATField: React.FC<
  Omit<FormFieldValidatedProps, "validationType">
> = (props) => (
  <FormFieldValidated
    {...props}
    validationType="vat"
    placeholder="FR12345678901"
    maxLength={15}
  />
);

export const WebsiteField: React.FC<
  Omit<FormFieldValidatedProps, "validationType" | "type">
> = (props) => (
  <FormFieldValidated
    {...props}
    type="url"
    validationType="website"
    placeholder="https://example.com"
    autoComplete="url"
  />
);

export const AmountField: React.FC<
  Omit<FormFieldValidatedProps, "validationType" | "type">
> = (props) => (
  <FormFieldValidated
    {...props}
    type="number"
    validationType="amount"
    step={0.01}
    min="0"
    autoComplete="off"
  />
);

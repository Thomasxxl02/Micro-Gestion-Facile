import { 
  CircleAlert as AlertCircle, 
  CircleCheck as CheckCircle2,
  type LucideIcon 
} from "lucide-react";
import React from "react";
import { type ValidationResult } from "../lib/zod-schemas";

export const getFieldBorderClass = (hasErr: boolean, hasSuc: boolean): string => {
  if (hasErr) {
    return "border-red-500 focus:ring-red-500/10 focus:border-red-600";
  }
  if (hasSuc) {
    return "border-green-500 focus:ring-green-500/10 focus:border-green-600";
  }
  return "";
};

interface LabelSectionProps {
  fieldId: string;
  label: string;
  required: boolean;
  showValidationIcon: boolean;
  hasSuccess: string | number | boolean | null;
}

export const LabelSection: React.FC<LabelSectionProps> = ({
  fieldId,
  label,
  required,
  showValidationIcon,
  hasSuccess,
}) => (
  <div className="flex items-center justify-between gap-2">
    <label
      htmlFor={fieldId}
      className="block text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest"
    >
      {label}
      {required && (
        <span className="text-red-500 ml-1" aria-hidden="true">
          *
        </span>
      )}
    </label>
    {showValidationIcon && hasSuccess && (
      <CheckCircle2
        size={14}
        className="text-green-600 dark:text-green-400"
        aria-hidden="true"
      />
    )}
  </div>
);

interface ErrorMessageProps {
  hasError: boolean;
  fieldId: string;
  currentError: ValidationResult | null;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  hasError,
  fieldId,
  currentError,
}) => {
  if (!hasError || !currentError) return null;
  return (
    <p
      id={`${fieldId}-error`}
      className="text-[10px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1"
    >
      <AlertCircle size={12} aria-hidden="true" />
      {currentError.error}
    </p>
  );
};

interface SuccessMessageProps {
  hasSuccess: string | number | boolean | null;
  description?: string;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  hasSuccess,
  description,
}) => {
  if (!hasSuccess || description) return null;
  return (
    <p className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
      <CheckCircle2 size={12} aria-hidden="true" />
      Valide !
    </p>
  );
};

interface InputIconProps {
  icon?: LucideIcon;
}

export const InputIcon: React.FC<InputIconProps> = ({ icon: Icon }) => {
  if (!Icon) return null;
  return (
    <Icon
      className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300 dark:text-brand-600 pointer-events-none"
      size={18}
      aria-hidden="true"
    />
  );
};

interface ErrorIconProps {
  showValidationIcon: boolean;
  hasError: boolean;
}

export const ErrorIcon: React.FC<ErrorIconProps> = ({ showValidationIcon, hasError }) => {
  if (!showValidationIcon || !hasError) return null;
  return (
    <AlertCircle
      size={18}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-red-600 dark:text-red-400 pointer-events-none"
      aria-hidden="true"
    />
  );
};

import React from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * Composant FormField réutilisable avec accessibilité intégrée
 * Élimine la duplication de code et garantit WCAG compliance
 */
interface FormFieldProps {
  id?: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'number' | 'password' | 'url' | 'tel';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  className?: string;
  inputClassName?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  description,
  error,
  required,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  className = '',
  inputClassName = '',
}) => {
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        <label htmlFor={fieldId} className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required field">*</span>}
        </label>
      </div>

      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300 pointer-events-none" size={18} />}
        <input
          id={fieldId}
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined}
          className={`w-full ${Icon ? 'pl-12' : 'pl-4'} p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all ${error ? 'border-red-500 focus:ring-red-500/10' : ''} ${inputClassName}`}
        />
      </div>

      {description && (
        <p id={`${fieldId}-description`} className="text-[10px] text-brand-400 mt-1 font-medium italic">
          {description}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="text-[10px] text-red-600 font-medium">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
};

/**
 * Composant TextAreaField réutilisable
 */
interface TextAreaFieldProps {
  id?: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  rows?: number;
  className?: string;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  id,
  label,
  description,
  error,
  required,
  value,
  onChange,
  placeholder,
  icon: Icon,
  rows = 3,
  className = '',
}) => {
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={fieldId} className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest">
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required field">*</span>}
      </label>

      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-4 text-brand-300 pointer-events-none" size={18} />}
        <textarea
          id={fieldId}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          aria-label={label}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined}
          className={`w-full ${Icon ? 'pl-12' : 'pl-4'} p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all resize-none ${error ? 'border-red-500 focus:ring-red-500/10' : ''}`}
        />
      </div>

      {description && (
        <p id={`${fieldId}-description`} className="text-[10px] text-brand-400 mt-1 font-medium italic">
          {description}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="text-[10px] text-red-600 font-medium">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
};

/**
 * Composant SelectField réutilisable
 */
interface SelectFieldProps {
  id?: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  id,
  label,
  description,
  error,
  required,
  value,
  onChange,
  options,
  className = '',
}) => {
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={fieldId} className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest">
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required field">*</span>}
      </label>

      <select
        id={fieldId}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined}
        className={`w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-bold text-brand-900 cursor-pointer appearance-none ${error ? 'border-red-500 focus:ring-red-500/10' : ''}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {description && (
        <p id={`${fieldId}-description`} className="text-[10px] text-brand-400 mt-1 font-medium italic">
          {description}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="text-[10px] text-red-600 font-medium">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
};

/**
 * Composant ToggleSwitch accessible avec ARIA
 */
interface ToggleSwitchProps {
  id?: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  label,
  checked,
  onChange,
  description,
}) => {
  const switchId = id || `toggle-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex items-center gap-4 p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
      <div className="flex-1">
        <label htmlFor={switchId} className="text-sm font-bold text-brand-900 block cursor-pointer">
          {label}
        </label>
        {description && <p className="text-[10px] text-brand-400 mt-0.5">{description}</p>}
      </div>
      <button
        id={switchId}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full relative transition-all focus:outline-none focus:ring-4 focus:ring-brand-900/20 ${checked ? 'bg-brand-900' : 'bg-brand-200'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'right-1' : 'left-1'}`} />
      </button>
    </div>
  );
};

/**
 * Composant ColorPicker accessible
 */
interface ColorPickerProps {
  id?: string;
  label: string;
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  id,
  label,
  value,
  onChange,
  presets = ['#102a43', '#0f172a', '#1e293b', '#334155', '#059669', '#0891b2', '#4f46e5', '#7c3aed'],
}) => {
  const pickerId = id || `color-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-3">
      <label htmlFor={pickerId} className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest">
        {label}
      </label>
      
      <div className="flex items-center gap-6 p-6 bg-brand-50/50 border border-brand-100 rounded-[2rem]">
        <input
          id={pickerId}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="w-20 h-20 rounded-2xl cursor-pointer border-none shadow-lg"
        />
        <div>
          <p className="text-sm font-bold text-brand-900 uppercase font-mono mb-1">{value}</p>
          <p className="text-[10px] text-brand-400 font-medium">Couleur personnalisée</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {presets.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`w-full aspect-square rounded-xl border-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-900 ${value === color ? 'border-brand-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
            style={{ backgroundColor: color }}
            aria-label={`Select color ${color}`}
            aria-pressed={value === color}
          />
        ))}
      </div>
    </div>
  );
};

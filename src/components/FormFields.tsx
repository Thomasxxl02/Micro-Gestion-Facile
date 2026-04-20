import {
  Image as ImageIcon,
  type LucideIcon,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
  type?: "text" | "email" | "number" | "password" | "url" | "tel" | "search";
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  className?: string;
  inputClassName?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  "aria-label"?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  description,
  error,
  required,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  className = "",
  inputClassName = "",
  min,
  max,
  step,
  "aria-label": ariaLabel,
}) => {
  const fieldId = id || `field-${label.toLowerCase().replaceAll(/\s+/g, "-")}`;
  let describedByValue: string | undefined;
  if (error) {
    describedByValue = `${fieldId}-error`;
  } else if (description) {
    describedByValue = `${fieldId}-description`;
  }

  const ariaAttrs = {
    "aria-required": required ? ("true" as const) : ("false" as const),
    "aria-invalid": error ? ("true" as const) : ("false" as const),
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-2">
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
      </div>

      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300 dark:text-brand-600 pointer-events-none"
            size={18}
            aria-hidden="true"
          />
        )}
        <input
          id={fieldId}
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          {...ariaAttrs}
          aria-label={ariaLabel}
          aria-describedby={describedByValue}
          min={min}
          max={max}
          step={step}
          className={`w-full ${Icon ? "pl-12" : "pl-4"} pr-4 py-4 bg-white dark:bg-(--input-bg) border border-(--input-border) rounded-2xl outline-none focus:ring-4 focus:ring-(--input-focus-ring) focus:border-(--input-focus-border) text-(--input-text) placeholder:text-(--input-placeholder) transition-all ${error ? "border-red-500 dark:border-red-500/70 focus:ring-red-500/10" : ""} ${inputClassName}`}
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
      {error && (
        <p
          id={`${fieldId}-error`}
          className="text-[10px] text-red-600 dark:text-red-400 font-medium"
        >
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
  className = "",
}) => {
  const fieldId = id || `field-${label.toLowerCase().replaceAll(/\s+/g, "-")}`;
  let describedByValue: string | undefined;
  if (error) {
    describedByValue = `${fieldId}-error`;
  } else if (description) {
    describedByValue = `${fieldId}-description`;
  }

  const ariaAttrs = {
    "aria-required": required ? ("true" as const) : ("false" as const),
    "aria-invalid": error ? ("true" as const) : ("false" as const),
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={fieldId}
        className="block text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="Champ requis">
            *
          </span>
        )}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-4 top-4 text-brand-300 dark:text-brand-600 pointer-events-none"
            size={18}
          />
        )}
        <textarea
          id={fieldId}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          {...ariaAttrs}
          aria-describedby={describedByValue}
          className={`w-full ${Icon ? "pl-12" : "pl-4"} p-4 bg-white dark:bg-(--input-bg) border border-(--input-border) rounded-2xl outline-none focus:ring-4 focus:ring-(--input-focus-ring) focus:border-(--input-focus-border) text-(--input-text) placeholder:text-(--input-placeholder) transition-all resize-none ${error ? "border-red-500 dark:border-red-500/70 focus:ring-red-500/10" : ""} ${className}`}
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
      {error && (
        <p
          id={`${fieldId}-error`}
          className="text-[10px] text-red-600 dark:text-red-400 font-medium"
        >
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
  className = "",
}) => {
  const fieldId = id || `field-${label.toLowerCase().replaceAll(/\s+/g, "-")}`;
  let describedByValue: string | undefined;
  if (error) {
    describedByValue = `${fieldId}-error`;
  } else if (description) {
    describedByValue = `${fieldId}-description`;
  }

  const ariaAttrs = {
    "aria-required": required ? ("true" as const) : ("false" as const),
    "aria-invalid": error ? ("true" as const) : ("false" as const),
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={fieldId}
        className="block text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="Champ requis">
            *
          </span>
        )}
      </label>

      <select
        id={fieldId}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...ariaAttrs}
        aria-describedby={describedByValue}
        className={`w-full p-4 bg-white dark:bg-(--input-bg) border border-(--input-border) rounded-2xl outline-none focus:ring-4 focus:ring-(--input-focus-ring) focus:border-(--input-focus-border) text-(--input-text) transition-all font-bold cursor-pointer appearance-none ${error ? "border-red-500 dark:border-red-500/70 focus:ring-red-500/10" : ""} ${className}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {description && (
        <p
          id={`${fieldId}-description`}
          className="text-[10px] text-brand-400 dark:text-brand-500 mt-1 font-medium italic"
        >
          {description}
        </p>
      )}
      {error && (
        <p
          id={`${fieldId}-error`}
          className="text-[10px] text-red-600 dark:text-red-400 font-medium"
        >
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
  const switchId =
    id || `toggle-${label.toLowerCase().replaceAll(/\s+/g, "-")}`;

  return (
    <div
      className={`flex items-center gap-4 p-4 bg-white dark:bg-(--input-bg) rounded-2xl border border-(--input-border) transition-colors ${id ? "" : ""}`}
    >
      <div className="flex-1">
        <label
          htmlFor={switchId}
          className="text-sm font-bold text-brand-900 dark:text-brand-100 block cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <p className="text-[10px] text-brand-400 dark:text-brand-500 mt-0.5">
            {description}
          </p>
        )}
      </div>
      {checked ? (
        <button
          id={switchId}
          type="button"
          role="switch"
          aria-checked="true"
          aria-label={label}
          onClick={() => onChange(!checked)}
          className={`w-12 h-6 rounded-full relative transition-all focus:outline-none focus:ring-4 focus:ring-brand-900/20 bg-brand-900`}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all right-1`}
          />
        </button>
      ) : (
        <button
          id={switchId}
          type="button"
          role="switch"
          aria-checked="false"
          aria-label={label}
          onClick={() => onChange(!checked)}
          className={`w-12 h-6 rounded-full relative transition-all focus:outline-none focus:ring-4 focus:ring-brand-900/20 bg-brand-200`}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all left-1`}
          />
        </button>
      )}
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
  presets = [
    "#102a43",
    "#0f172a",
    "#1e293b",
    "#334155",
    "#059669",
    "#0891b2",
    "#4f46e5",
    "#7c3aed",
  ],
}) => {
  const pickerId = id || `color-${label.toLowerCase().replaceAll(/\s+/g, "-")}`;

  return (
    <div className={`space-y-3 ${id ? "" : ""}`}>
      <label
        htmlFor={pickerId}
        className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest"
      >
        {label}
      </label>

      <div className="flex items-center gap-6 p-6 bg-brand-50/50 border border-brand-100 rounded-4xl">
        <input
          id={pickerId}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="w-20 h-20 rounded-2xl cursor-pointer border-none shadow-lg"
        />
        <div>
          <p className="text-sm font-bold text-brand-900 uppercase font-mono mb-1">
            {value}
          </p>
          <p className="text-[10px] text-brand-400 font-medium">
            Couleur personnalisée
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {presets.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            title={`Choisir la couleur ${color}`}
            aria-label={`Choisir la couleur ${color}`}
            aria-pressed={value === color}
            className={`w-full aspect-square rounded-xl border-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-900 ${
              value === color
                ? "border-brand-900 scale-110 shadow-md"
                : "border-transparent hover:scale-105"
            }`}
            style={{ backgroundColor: color } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Color Selection Field (Circle style for user profiles)
 */
export const ColorCirclePicker: React.FC<{
  label: string;
  value: string;
  onChange: (color: string) => void;
  colors: string[];
}> = ({ label, value, onChange, colors }) => {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-brand-500 uppercase tracking-widest">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            title={`Choisir la couleur ${color}`}
            aria-label={`Choisir la couleur ${color}`}
            aria-pressed={value === color}
            className={`w-full aspect-square rounded-xl border-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-900 ${
              value === color
                ? "border-brand-900 scale-110 shadow-md"
                : "border-transparent hover:scale-105"
            }`}
            style={{ backgroundColor: color } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Composant LogoUploader
 */
interface LogoUploaderProps {
  logoUrl?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  logoUrl,
  onChange,
  onRemove,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const id = "logo-upload-input";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("L'image est trop lourde (max 1Mo)");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onChange(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label
          htmlFor={id}
          className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest cursor-pointer"
        >
          Logo d&apos;entreprise
        </label>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 p-8 bg-brand-50/50 border-2 border-dashed border-brand-200 rounded-4xl transition-all hover:border-brand-400 group">
        <div className="relative w-32 h-32 bg-white rounded-4xl shadow-xl flex items-center justify-center overflow-hidden border border-brand-100 group-hover:scale-105 transition-transform">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo entreprise"
              className="w-full h-full object-contain p-4"
            />
          ) : (
            <div className="text-brand-200">
              <ImageIcon size={48} aria-hidden="true" />
            </div>
          )}
          {logoUrl && (
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
              aria-label="Supprimer le logo"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-4">
          <div>
            <h4 className="font-bold text-brand-900 leading-tight">
              Identité visuelle
            </h4>
            <p className="text-xs text-brand-500 mt-1">
              Format JPG, PNG ou SVG (max 1Mo). Recommandé : 400x400px.
            </p>
          </div>
          <input
            id={id}
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            title="Importer un logo"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-brand-800 transition-all shadow-lg shadow-brand-900/10"
          >
            <Upload size={16} aria-hidden="true" />
            {logoUrl ? "Changer le logo" : "Importer un logo"}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Composant SignatureUploader amélioré avec Canvas de dessin
 */
interface SignatureUploaderProps {
  signatureUrl?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  label?: string;
  description?: string;
}

export const SignatureUploader: React.FC<SignatureUploaderProps> = ({
  signatureUrl,
  onChange,
  onRemove,
  label = "Signature Numérique",
  description = "Format PNG transparent recommandé (max 512Ko). Apposée en bas de vos factures.",
}) => {
  const [mode, setMode] = useState<"upload" | "draw">("upload");
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const id = `signature-input-${label.toLowerCase().replace(/\s+/g, "-")}`;

  // Initialisation du canvas
  useEffect(() => {
    if (mode === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#000000";
      }
    }
  }, [mode]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x =
      "touches" in e
        ? e.touches[0].clientX - rect.left
        : (e as React.MouseEvent).clientX - rect.left;
    const y =
      "touches" in e
        ? e.touches[0].clientY - rect.top
        : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const saveCanvas = () => {
    if (canvasRef.current) {
      // On vérifie si le canvas est vide (optionnel mais recommandé)
      const dataUrl = canvasRef.current.toDataURL("image/png");
      onChange(dataUrl);
      setMode("upload");
      toast.success("Signature enregistrée");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 512 * 1024) {
        toast.error("L'image est trop lourde (max 512Ko)");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onChange(base64);
        toast.success("Image chargée");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest">
          {label}
        </label>
        <div className="flex bg-brand-100 dark:bg-brand-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
              mode === "upload"
                ? "bg-white dark:bg-brand-700 text-brand-600 dark:text-brand-300 shadow-sm"
                : "text-brand-400 hover:text-brand-600"
            }`}
          >
            IMPORT
          </button>
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
              mode === "draw"
                ? "bg-white dark:bg-brand-700 text-brand-600 dark:text-brand-300 shadow-sm"
                : "text-brand-400 hover:text-brand-600"
            }`}
          >
            DESSIN
          </button>
        </div>
      </div>

      <div className="relative group">
        {mode === "upload" ? (
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-brand-50/50 dark:bg-brand-800/20 border-2 border-dashed border-brand-200 dark:border-brand-700 rounded-3xl transition-all hover:border-brand-400">
            <div className="relative w-48 h-24 bg-white dark:bg-brand-900 rounded-xl shadow-inner flex items-center justify-center overflow-hidden border border-brand-100 dark:border-brand-800">
              {signatureUrl ? (
                <img
                  src={signatureUrl}
                  alt={label}
                  className="w-full h-full object-contain p-2 grayscale dark:font-white"
                />
              ) : (
                <div className="text-brand-100 dark:text-brand-800">
                  <ImageIcon size={48} />
                </div>
              )}
              {signatureUrl && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                  aria-label="Supprimer le fichier"
                  title="Supprimer le fichier"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-bold text-brand-900 dark:text-white text-sm">
                Fichier image
              </h4>
              <p className="text-[11px] text-brand-500 dark:text-brand-400 mb-4 whitespace-pre-line">
                {description}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                <Upload size={14} />
                Parcourir
              </button>
              <input
                id={id}
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png,image/jpeg"
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white dark:bg-brand-900 border-2 border-brand-100 dark:border-brand-800 rounded-3xl shadow-xl">
            <div className="relative bg-brand-50 dark:bg-brand-950 rounded-2xl overflow-hidden border border-brand-100 dark:border-brand-800 cursor-crosshair">
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                onTouchMove={draw}
                className="w-full touch-none"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="p-2 bg-white/80 dark:bg-brand-800/80 backdrop-blur-sm text-brand-600 rounded-lg hover:bg-white transition-colors shadow-sm"
                  title="Effacer"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-900/10 dark:bg-brand-100/10 backdrop-blur-[2px] rounded-full">
                <p className="text-[10px] text-brand-400 font-medium">
                  Zone de signature
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={saveCanvas}
                className="flex-1 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 transition-all shadow-md active:scale-95"
              >
                Valider le tracé
              </button>
              <button
                type="button"
                onClick={() => setMode("upload")}
                className="px-4 py-2 border border-brand-200 dark:border-brand-700 text-brand-600 dark:text-brand-400 text-xs font-bold rounded-xl hover:bg-brand-50 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

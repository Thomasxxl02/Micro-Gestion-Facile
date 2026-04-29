/**
 * PreferencesTab - Style, apparence et préférences
 * ✅ Thèmes, polices, couleurs
 * ✅ Accessibilité (animations, haute visibilité)
 * ✅ Gabarits de factures
 */

import {
  Check,
  ExternalLink,
  FileText,
  ImageIcon,
  Layout,
  Palette,
  Sparkles,
  Zap,
} from "lucide-react";
import React from "react";
import type { UserProfile } from "../../types";
import { ColorPicker, SelectField, SignatureUploader } from "../FormFields";
import { InvoiceTemplateThumbnail } from "../InvoiceTemplateSelector";

interface PreferencesTabProps {
  userProfile: UserProfile;
  handleChange: (
    field: keyof UserProfile,
    value: string | number | boolean | string[] | Record<string, unknown>,
  ) => void;
  onPreviewPDF: () => Promise<void>;
  uiState: {
    fontSize: number;
    setFontSize: (size: number) => void;
    reducedMotion: boolean;
    setReducedMotion: (val: boolean) => void;
    soundEnabled: boolean;
    setSoundEnabled: (val: boolean) => void;
    highVisibility: boolean;
    setHighVisibility: (val: boolean) => void;
    offlinePriority: boolean;
    setOfflinePriority: (val: boolean) => void;
    colorTheme: string;
    setColorTheme: (theme: string) => void;
  };
}

const INVOICE_TEMPLATES = [
  { id: "modern" as const, label: "Moderne" },
  { id: "classic" as const, label: "Classique" },
  { id: "minimal" as const, label: "Épuré" },
  { id: "corporate" as const, label: "Corporate" },
] as const;

const FONT_OPTIONS = [
  { id: "sans" as const, label: "Inter (Sans-serif)", className: "font-sans" },
  {
    id: "serif" as const,
    label: "Merriweather (Serif)",
    className: "font-serif",
  },
  { id: "mono" as const, label: "JetBrains (Mono)", className: "font-mono" },
  { id: "slab" as const, label: "Roboto Slab (Tech)", className: "font-slab" },
] as const;

type _InvoiceTemplateId = "modern" | "classic" | "minimal" | "corporate";

/**
 * PreferencesTab - Onglet Préférences & Style
 * Responsabilités :
 * - Thèmes ("Expert", "Artisan", "Créatif")
 * - Personnalisation visuelle (couleurs, polices, gabarits)
 * - Accessibilité (animations, contraste, taille)
 * - Notifications et automatisation
 * - Signature et tampons
 */
export const PreferencesTab: React.FC<PreferencesTabProps> = ({
  userProfile,
  handleChange,
  onPreviewPDF,
  uiState,
}) => {
  const applyPreset = (presetName: "expert" | "artisan" | "creative") => {
    const presets = {
      expert: {
        primaryColor: "#102a43",
        secondaryColor: "#486581",
        fontFamily: "Inter",
      },
      artisan: {
        primaryColor: "#854d0e",
        secondaryColor: "#a16207",
        fontFamily: "Lora",
      },
      creative: {
        primaryColor: "#7c3aed",
        secondaryColor: "#db2777",
        fontFamily: "Montserrat",
      },
    };

    const config = presets[presetName];
    // Also apply global color theme
    const themeMap = {
      expert: "ocean",
      artisan: "emerald",
      creative: "royal",
    };
    uiState.setColorTheme(themeMap[presetName]);

    Object.entries(config).forEach(([key, value]) => {
      handleChange(key as keyof UserProfile, value);
    });
  };

  return (
    <div
      id="panel-preferences"
      role="tabpanel"
      aria-labelledby="tab-preferences"
      className="space-y-8 animate-slide-up"
    >
      {/* Presets Card */}
      <div className="bg-linear-to-br from-brand-900 to-brand-800 dark:from-brand-950 dark:to-brand-900 rounded-4xl p-8 shadow-xl border border-brand-700/50 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <Sparkles size={120} className="text-white" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <div className="p-2 bg-brand-700/50 text-brand-200 rounded-xl">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">
                Styles "Métiers" Instantanés
              </h3>
              <p className="text-xs text-brand-300">
                Configuration visuelle complète en un clic
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["expert", "artisan", "creative"] as const).map((preset) => {
              const icons = {
                expert: "🎩",
                artisan: "🛠️",
                creative: "✨",
              };
              const names = {
                expert: "L'Expert",
                artisan: "L'Artisan",
                creative: "Le Créatif",
              };
              const descriptions = {
                expert: "Sérieux & Institutionnel",
                artisan: "Chaleureux & Authentique",
                creative: "Vibrant & Moderne",
              };
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="p-4 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-2xl transition-all text-left"
                >
                  <div className="text-2xl mb-3">{icons[preset]}</div>
                  <h4 className="text-white font-bold text-sm">
                    {names[preset]}
                  </h4>
                  <p className="text-[10px] text-brand-300 mt-1">
                    {descriptions[preset]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Colors & Appearance Card */}
      <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
        <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
          <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
            <Palette size={24} />
          </div>
          <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
            Apparence
          </h3>
        </div>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SelectField
              label="Mode Lumineux/Sombre"
              value={userProfile.theme ?? "auto"}
              onChange={(val) => handleChange("theme", val)}
              options={[
                { value: "light", label: "☀️ Clair (Light)" },
                { value: "dark", label: "🌙 Sombre (Dark)" },
                { value: "auto", label: "🔄 Auto (selon système)" },
              ]}
            />
            <SelectField
              label="Ambiance de Couleurs (Interface)"
              value={uiState.colorTheme}
              onChange={(val) => uiState.setColorTheme(val)}
              options={[
                { value: "default", label: "🏳️ Défaut (Indigo & Rose)" },
                { value: "emerald", label: "🌿 Émeraude (Nature & Artisan)" },
                { value: "ocean", label: "🌊 Océan (Bleu & Expert)" },
                { value: "royal", label: "👑 Royal (Violet & Prestige)" },
              ]}
              description="Change les couleurs principales de l'interface"
            />
            <SelectField
              label="Police de caractères (factures)"
              value={userProfile.fontFamily ?? "Inter"}
              onChange={(val) => handleChange("fontFamily", val)}
              options={[
                { value: "Inter", label: "Inter (Moderne & Standard)" },
                { value: "Roboto", label: "Roboto (Technique & Clair)" },
                {
                  value: "Playfair Display",
                  label: "Playfair Display (Luxe & Raffiné)",
                },
                { value: "Montserrat", label: "Montserrat (Design)" },
                { value: "Lora", label: "Lora (Élégant & Littéraire)" },
              ]}
              description="Appliquée sur les PDF et aperçus de facture"
            />
          </div>

          {/* Font Size Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end border-t border-brand-50 dark:border-brand-800 pt-8">
            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-brand-700 dark:text-brand-300 flex items-center gap-2"
                htmlFor="font-size-slider"
              >
                Taille de la police de l'application
                <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-800 rounded text-brand-600 dark:text-brand-300 text-xs">
                  {uiState.fontSize}px
                </span>
              </label>
              <input
                id="font-size-slider"
                type="range"
                min={12}
                max={24}
                step={1}
                value={uiState.fontSize}
                onChange={(e) =>
                  uiState.setFontSize(Number.parseInt(e.target.value, 10))
                }
                className="w-full h-2 bg-brand-100 dark:bg-brand-800 rounded-lg appearance-none cursor-pointer accent-brand-600 dark:accent-brand-400"
                aria-valuemin={12}
                aria-valuemax={24}
                aria-valuenow={uiState.fontSize}
              />
              <div className="flex justify-between text-[10px] text-brand-400 font-medium">
                <span>Petite (12px)</span>
                <span>Normale (16px)</span>
                <span>Grande (24px)</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-800/20 border border-brand-100/50 dark:border-brand-700/30">
              <p className="text-xs text-brand-500 dark:text-brand-400 italic">
                L'aperçu de la taille s'applique instantanément à toute
                l'interface.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ColorPicker
              label="Couleur Primaire (en-tête facture)"
              value={
                userProfile.primaryColor ?? userProfile.logoColor ?? "#102a43"
              }
              onChange={(val) => handleChange("primaryColor", val)}
            />
            <ColorPicker
              label="Couleur Secondaire (accentuation)"
              value={userProfile.secondaryColor ?? "#059669"}
              onChange={(val) => handleChange("secondaryColor", val)}
              presets={[
                "#059669",
                "#0891b2",
                "#f59e0b",
                "#ef4444",
                "#8b5cf6",
                "#ec4899",
                "#14b8a6",
                "#f97316",
              ]}
            />
          </div>
        </div>
      </div>

      {/* Advanced UI Personalization Card */}
      <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800 animate-slide-up">
        <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
          <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
            <Layout size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
              Personnalisation Visuelle Avancée
            </h3>
            <p className="text-xs text-brand-400 dark:text-brand-500 mt-0.5">
              Ajustez finement l'expérience de l'interface
            </p>
          </div>
        </div>

        <div className="space-y-10">
          {/* Interface Density */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-brand-900 dark:text-white">
                  Densité de l'interface
                </span>
                <div className="px-2 py-0.5 bg-brand-50 dark:bg-brand-800 text-brand-500 text-[10px] rounded uppercase font-bold tracking-wider">
                  Nouveau
                </div>
              </div>
              <div className="flex bg-brand-50 dark:bg-brand-800 p-1 rounded-xl border border-brand-100 dark:border-brand-700">
                {(["compact", "normal", "spacious"] as const).map((density) => (
                  <button
                    key={density}
                    onClick={() => handleChange("uiDensity", density)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      (userProfile.uiDensity ?? "normal") === density
                        ? "bg-white dark:bg-brand-700 text-brand-900 dark:text-white shadow-sm"
                        : "text-brand-400 hover:text-brand-600 dark:hover:text-brand-200"
                    }`}
                  >
                    {density.charAt(0).toUpperCase() + density.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-brand-500 dark:text-brand-400 leading-relaxed max-w-2xl">
              Le mode <b>Compact</b> réduit les marges. Le mode <b>Espacé</b>{" "}
              privilégie le confort visuel.
            </p>
          </div>

          {/* Border Radius */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-t border-brand-50 dark:border-brand-800 pt-8">
            <div className="space-y-3">
              <label
                htmlFor="border-radius-slider"
                className="text-sm font-semibold text-brand-700 dark:text-brand-300 flex items-center gap-2"
              >
                Arrondi des bords (Border Radius)
                <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-800 rounded text-brand-600 dark:text-brand-300 text-xs font-mono">
                  {userProfile.borderRadius ?? 12}px
                </span>
              </label>
              <input
                id="border-radius-slider"
                type="range"
                min={0}
                max={32}
                step={2}
                value={userProfile.borderRadius ?? 12}
                onChange={(e) =>
                  handleChange("borderRadius", parseInt(e.target.value, 10))
                }
                aria-valuemin={0}
                aria-valuemax={32}
                aria-valuenow={userProfile.borderRadius ?? 12}
                className="w-full h-2 bg-brand-100 dark:bg-brand-800 rounded-lg appearance-none cursor-pointer accent-brand-600 dark:accent-brand-400"
              />
              <div className="flex justify-between text-[10px] text-brand-400 font-medium font-mono uppercase tracking-tighter">
                <span>Carré (0px)</span>
                <span>Standard (12px)</span>
                <span>Rond (32px)</span>
              </div>
            </div>
            <div
              className="flex gap-4 p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-800/20 border border-brand-100/50 dark:border-brand-700/30 overflow-hidden"
              style={
                {
                  "--preview-radius": `${userProfile.borderRadius ?? 12}px`,
                } as React.CSSProperties
              }
            >
              <div className="w-12 h-12 bg-brand-900 dark:bg-white shrink-0 shadow-sm rounded-(--preview-radius)" />
              <div className="w-12 h-12 bg-brand-500 shrink-0 shadow-sm rounded-(--preview-radius)" />
              <div className="w-12 h-12 bg-accent-500 shrink-0 shadow-sm rounded-(--preview-radius)" />
              <p className="text-[10px] text-brand-400 leading-tight self-center">
                Prévisualisation de l'arrondi
              </p>
            </div>
          </div>

          {/* Zen Mode */}
          <div className="flex items-center justify-between border-t border-brand-50 dark:border-brand-800 pt-8">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-brand-900 dark:text-white flex items-center gap-2">
                Mode "Zen" (Focus mode)
                <Zap size={14} className="text-amber-500 fill-amber-500" />
              </h4>
              <p className="text-xs text-brand-500 dark:text-brand-400 max-w-md leading-relaxed">
                Masque les indicateurs d'aide et widgets secondaires.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange("isZenMode", !userProfile.isZenMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-offset-2 ring-transparent focus:ring-brand-500 ${
                userProfile.isZenMode
                  ? "bg-brand-900 dark:bg-brand-600"
                  : "bg-brand-200 dark:bg-brand-800"
              }`}
              aria-label="Mode Zen"
              aria-pressed={userProfile.isZenMode}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  userProfile.isZenMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Accessibilité & Ergonomie */}
          <div className="space-y-6 border-t border-brand-50 dark:border-brand-800 pt-8">
            <h4 className="text-sm font-semibold text-brand-900 dark:text-white flex items-center gap-2">
              <Layout size={18} className="text-brand-600" />
              Ergonomie & Accessibilité
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reduced Motion */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-50/30 dark:bg-brand-800/10 border border-brand-100/50 dark:border-brand-700/30">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-brand-800 dark:text-brand-200">
                    Réduire les animations
                  </label>
                  <p className="text-[10px] text-brand-500 dark:text-brand-400 leading-tight pr-4">
                    Désactive les transitions superflues.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    uiState.setReducedMotion(!uiState.reducedMotion)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ${
                    uiState.reducedMotion
                      ? "bg-brand-900 dark:bg-brand-600"
                      : "bg-brand-200 dark:bg-brand-800"
                  }`}
                  aria-label="Réduire les animations"
                  aria-pressed={uiState.reducedMotion}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      uiState.reducedMotion ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Sound Notifications */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-50/30 dark:bg-brand-800/10 border border-brand-100/50 dark:border-brand-700/30">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-brand-800 dark:text-brand-200">
                    Sons de notification
                  </label>
                  <p className="text-[10px] text-brand-500 dark:text-brand-400 leading-tight pr-4">
                    Active des sons discrets lors des actions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => uiState.setSoundEnabled(!uiState.soundEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ${
                    uiState.soundEnabled
                      ? "bg-brand-900 dark:bg-brand-600"
                      : "bg-brand-200 dark:bg-brand-800"
                  }`}
                  aria-label="Sons de notification"
                  aria-pressed={uiState.soundEnabled}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      uiState.soundEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* High Visibility Mode */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-50/30 dark:bg-brand-800/10 border border-brand-100/50 dark:border-brand-700/30">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-brand-800 dark:text-brand-200">
                    Mode Haute Visibilité
                  </label>
                  <p className="text-[10px] text-brand-500 dark:text-brand-400 leading-tight pr-4">
                    Accentue les contrastes et les bordures.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    uiState.setHighVisibility(!uiState.highVisibility)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ${
                    uiState.highVisibility
                      ? "bg-brand-900 dark:bg-brand-600"
                      : "bg-brand-200 dark:bg-brand-800"
                  }`}
                  aria-label="Mode Haute Visibilité"
                  aria-pressed={uiState.highVisibility}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      uiState.highVisibility ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Offline Priority Mode */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-700/30 col-span-1 md:col-span-2">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <Zap size={14} className="text-amber-600" />
                    Mode Hors-ligne Prioritaire
                  </h4>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-tight">
                    Garantit une réactivité maximale : sauvegarde instantanée
                    locale.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    uiState.setOfflinePriority(!uiState.offlinePriority)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${
                    uiState.offlinePriority
                      ? "bg-amber-600 dark:bg-amber-500"
                      : "bg-amber-200 dark:bg-amber-800"
                  }`}
                  aria-label="Mode Hors-ligne Prioritaire"
                  aria-pressed={uiState.offlinePriority}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      uiState.offlinePriority
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Template Card */}
      <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
        <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
          <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
              Gabarit de Facture
            </h3>
            <p className="text-xs text-brand-400 dark:text-brand-500 mt-0.5">
              Mise en page appliquée aux PDF et aperçus
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {INVOICE_TEMPLATES.map((tpl) => {
            const isSelected =
              (userProfile.invoiceTemplate ?? "modern") === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => handleChange("invoiceTemplate", tpl.id)}
                className={`relative rounded-2xl border-2 p-3 transition-all text-left ${
                  isSelected
                    ? "border-brand-900 dark:border-white shadow-md"
                    : "border-brand-100 dark:border-brand-700 hover:border-brand-300 dark:hover:border-brand-500"
                }`}
                aria-pressed={isSelected}
                title={`Sélectionner le gabarit ${tpl.label}`}
              >
                <InvoiceTemplateThumbnail
                  template={tpl.id}
                  primaryColor={userProfile.primaryColor ?? "#102a43"}
                  secondaryColor={userProfile.secondaryColor ?? "#059669"}
                  fontFamily={userProfile.fontFamily ?? "Inter"}
                />
                <p
                  className={`mt-2 text-[10px] font-bold uppercase tracking-wider text-center ${
                    isSelected
                      ? "text-brand-900 dark:text-white"
                      : "text-brand-500 dark:text-brand-400"
                  }`}
                >
                  {tpl.label}
                </p>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand-900 dark:bg-white flex items-center justify-center">
                    <Check
                      size={10}
                      className="text-white dark:text-brand-900"
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-brand-50 dark:border-brand-800">
          <SelectField
            label="Police de caractères"
            description="Style appliqué aux textes des documents."
            value={userProfile.fontFamily ?? "sans"}
            onChange={(val) => handleChange("fontFamily", val)}
            options={FONT_OPTIONS.map((f) => ({
              value: f.id,
              label: f.label,
            }))}
          />

          <div className="mt-6">
            <label className="block text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest mb-3">
              Colonnes affichées
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "unit", label: "Unité (h, j...)" },
                { id: "vat", label: "Taux TVA (%)" },
                { id: "sku", label: "Référence SKU" },
                { id: "discount", label: "Remise ligne" },
              ].map((col) => {
                const isHidden = (
                  userProfile.hiddenInvoiceColumns ?? []
                ).includes(col.id);
                return (
                  <label
                    key={col.id}
                    className="flex items-center gap-2 p-3 bg-brand-50 dark:bg-brand-800/30 rounded-xl cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-800 transition-colors border border-brand-100 dark:border-brand-700"
                  >
                    <input
                      type="checkbox"
                      checked={!isHidden}
                      onChange={(e) => {
                        const hidden = [
                          ...(userProfile.hiddenInvoiceColumns ?? []),
                        ];
                        if (e.target.checked) {
                          const idx = hidden.indexOf(col.id);
                          if (idx > -1) hidden.splice(idx, 1);
                        } else {
                          if (!hidden.includes(col.id)) hidden.push(col.id);
                        }
                        handleChange("hiddenInvoiceColumns", hidden);
                      }}
                      className="rounded border-brand-300 text-brand-900 focus:ring-brand-900"
                    />
                    <span className="text-xs font-medium text-brand-700 dark:text-brand-300">
                      {col.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              void onPreviewPDF();
            }}
            className="w-full flex items-center justify-center gap-2 p-4 mt-8 bg-brand-50 dark:bg-brand-800 text-brand-700 dark:text-brand-300 rounded-2xl font-bold text-sm hover:bg-brand-100 dark:hover:bg-brand-700 transition-all border border-brand-100 dark:border-brand-700 shadow-sm"
          >
            <ExternalLink size={20} /> Aperçu PDF plein écran
          </button>
          <p className="text-[10px] text-brand-400 dark:text-brand-500 mt-3 text-center">
            Valide le rendu final avec vos informations.
          </p>
        </div>
      </div>

      {/* Signature & Stamp */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
          <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
            <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
              <Check size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                Signature Numérique
              </h3>
            </div>
          </div>
          <SignatureUploader
            signatureUrl={userProfile.signatureUrl}
            onChange={(url) => handleChange("signatureUrl", url)}
            onRemove={() => handleChange("signatureUrl", "")}
            label="Signature manuscrite"
            description="Dessinez ou importez un fichier PNG transparent."
          />
        </div>

        <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
          <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
            <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
              <ImageIcon size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                Cachet / Tampon
              </h3>
            </div>
          </div>
          <SignatureUploader
            signatureUrl={userProfile.stampUrl}
            onChange={(url) => handleChange("stampUrl", url)}
            onRemove={() => handleChange("stampUrl", "")}
            label="Tampon de l'entreprise"
            description="Importez votre tampon commercial professionnel."
          />
        </div>
      </div>
    </div>
  );
};

export default PreferencesTab;

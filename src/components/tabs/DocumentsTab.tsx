/**
 * DocumentsTab - Gestion des documents, CGV et archivage
 * ✅ Configuration des Conditions Générales de Vente (CGV)
 * ✅ Mentions Légales par défaut
 * ✅ Paramètres d'archivage légal
 */

import {
  Archive,
  FileCode,
  FileText,
  Gavel,
  Info,
  ShieldCheck,
  Upload,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import type { UserProfile } from "../../types";
import {
  SelectField,
  TextAreaField,
  ToggleSwitch,
} from "../FormFields";

interface DocumentsTabProps {
  userProfile: UserProfile;
  handleChange: (
    field: keyof UserProfile,
    value: string | number | boolean | string[] | Record<string, unknown>,
  ) => void;
}

/**
 * DocumentsTab - Nouvel onglet pour centraliser la gestion documentaire
 */
export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  userProfile,
  handleChange,
}) => {
  return (
    <div
      id="panel-documents"
      role="tabpanel"
      aria-labelledby="tab-documents"
      className="space-y-8 animate-slide-up"
    >
      {/* Conditions Générales de Vente (CGV) */}
      <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
        <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
          <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
            <Gavel size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
              Conditions Générales de Vente (CGV)
            </h3>
            <p className="text-xs text-brand-400 dark:text-brand-500 mt-0.5">
              Obligatoires pour les relations inter-professionnelles (art. L441-1 Code de commerce)
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <ToggleSwitch
            label="Joindre automatiquement mes CGV"
            description="Inclure automatiquement les CGV à chaque envoi de facture ou devis par email."
            checked={userProfile.autoAttachTerms ?? false}
            onChange={(val) => handleChange("autoAttachTerms", val)}
          />

          <TextAreaField
            label="Texte des CGV"
            value={userProfile.termsAndConditions ?? ""}
            onChange={(val) => handleChange("termsAndConditions", val)}
            placeholder="Saisissez ou collez vos CGV ici..."
            rows={10}
            description="Ce texte pourra être utilisé pour générer une page additionnelle dans vos exports PDF."
          />

          <div className="p-6 bg-brand-50 dark:bg-brand-800/30 rounded-3xl border border-dashed border-brand-200 dark:border-brand-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-brand-500" />
                <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                  Document PDF des CGV
                </span>
              </div>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-brand-700 border border-brand-200 dark:border-brand-600 rounded-xl text-xs font-semibold text-brand-600 dark:text-brand-300 hover:bg-brand-50 transition-colors"
                onClick={() => {
                  /* Simulation d'upload */
                  toast.info("L'upload de PDF sera bientôt disponible");
                }}
              >
                <Upload size={14} />
                Choisir un fichier
              </button>
            </div>
            <p className="text-xs text-brand-400">
              Format supporté : PDF uniquement. Taille max : 2 Mo. Ce fichier sera envoyé en pièce jointe de vos emails.
            </p>
          </div>
        </div>
      </div>

      {/* Mentions Légales par défaut */}
      <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
        <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
          <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
            <FileCode size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
              Mentions Légales & Pied de page
            </h3>
            <p className="text-xs text-brand-400 dark:text-brand-500 mt-0.5">
              Configuration globale des textes obligatoires
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <TextAreaField
            label="Mentions obligatoires (TVA, immatriculation...)"
            value={userProfile.legalMentions ?? ""}
            onChange={(val) => handleChange("legalMentions", val)}
            placeholder='Ex: "TVA non applicable, art. 293 B du CGI" ou "Dispensé d\u2019immatriculation au registre du commerce et des sociétés (RCS) et au répertoire des métiers (RM)"'
            rows={4}
            description="S'affiche tout en bas de vos factures et devis."
          />

          <div className="flex items-start gap-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 text-xs text-blue-700 dark:text-blue-300">
            <Info size={16} className="mt-0.5 shrink-0" />
            <p>
              Pour les micro-entrepreneurs, n'oubliez pas d'inclure les mentions spécifiques liées à votre statut et, le cas échéant, à l'absence de TVA.
            </p>
          </div>
        </div>
      </div>

      {/* Archivage & Conservation */}
      <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
        <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
          <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
            <Archive size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
              Archivage & Conservation
            </h3>
            <p className="text-xs text-brand-400 dark:text-brand-500 mt-0.5">
              Conformité à la durée légale de conservation des documents comptables
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SelectField
              label="Durée de conservation"
              value={String(userProfile.archiveRetentionYears ?? 10)}
              onChange={(val) => handleChange("archiveRetentionYears", parseInt(val, 10))}
              options={[
                { value: "5", label: "5 ans (Fiscal)" },
                { value: "10", label: "10 ans (Commercial - Recommandé)" },
                { value: "Infinity", label: "Illimité" },
              ]}
              description="Délai légal de conservation des pièces justificatives (art. L123-22 Code de commerce)."
            />
            <SelectField
              label="Service d'archivage Cloud"
              value={userProfile.archiveCloudProvider ?? "none"}
              onChange={(val) => handleChange("archiveCloudProvider", val)}
              options={[
                { value: "none", label: "Local uniquement (IndexDB)" },
                { value: "google_drive", label: "Google Drive" },
                { value: "dropbox", label: "Dropbox" },
                { value: "onedrive", label: "OneDrive" },
              ]}
              description="Sauvegarde automatique et pérenne de vos documents validés."
            />
          </div>

          <ToggleSwitch
            label="Archivage automatique post-validation"
            description="Générer et stocker automatiquement une copie PDF/A-3 scellée dès qu'une facture est marquée comme 'Validée'."
            checked={userProfile.autoArchiveInvoices ?? false}
            onChange={(val) => handleChange("autoArchiveInvoices", val)}
          />

          {userProfile.autoArchiveInvoices && (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
              <ShieldCheck size={18} className="text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                Mode Archivage Légal activé : vos documents sont sécurisés.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

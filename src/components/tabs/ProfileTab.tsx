/**
 * ProfileTab - Gestion du profil et de l'identité professionnelle
 * ✅ Accessibilité intégrée (WCAG 2.1 AA)
 * ✅ Validation SIRET
 */

import {
  Briefcase,
  Building,
  Globe,
  Hash,
  Mail as MailIcon,
  MapPin,
  Palette,
  Phone as PhoneIcon,
  ShieldCheck,
  FileSignature,
} from "lucide-react";
import React from "react";
import type { UserProfile } from "../../types";
import { FormField, LogoUploader, TextAreaField } from "../FormFields";
import { StampGenerator } from "./StampGenerator";
import { HandSignatureCanvas } from "./HandSignatureCanvas";

interface ProfileTabProps {
  userProfile: UserProfile;
  handleChange: (
    field: keyof UserProfile,
    value: string | number | boolean | string[] | Record<string, unknown>,
  ) => void;
  validationErrors: {
    siret?: string;
    bankAccount?: string;
    email?: string;
  };
}

/**
 * ProfileTab - Onglet Profil (Identité & Logo)
 * Responsabilités :
 * - Upload du logo et prévisualisation
 * - Saisie identité professionnelle (nom, titre, SIRET)
 * - Coordonnées (email, téléphone, adresse, web)
 */
export const ProfileTab: React.FC<ProfileTabProps> = ({
  userProfile,
  handleChange,
  validationErrors,
}) => {
  return (
    <div
      id="panel-profile"
      role="tabpanel"
      aria-labelledby="tab-profile"
      className="space-y-8 animate-slide-up"
    >
      {/* Image de marque & Outillage visuel */}
      <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
        <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
          <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
            <Palette size={24} />
          </div>
          <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
            Image de marque & Validation
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Logo Section */}
          <div className="lg:col-span-4 space-y-6">
            <label className="text-sm font-bold text-brand-700 dark:text-brand-300 block mb-4">
              Logo de l'entreprise
            </label>
            <LogoUploader
              logoUrl={userProfile.logoUrl}
              onChange={(url) => handleChange("logoUrl", url)}
              onRemove={() => handleChange("logoUrl", "")}
            />
            <p className="text-xs text-brand-500 italic mt-2">
              Format recommandé : PNG ou SVG, fond transparent.
            </p>
          </div>

          {/* Tools Section */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={20} className="text-brand-600 dark:text-brand-400" />
                <span className="font-bold text-sm text-brand-900 dark:text-white">Tampon Officiel</span>
              </div>
              <StampGenerator 
                companyName={userProfile.companyName}
                siret={userProfile.siret}
                onSave={(dataUrl) => handleChange("stampUrl", dataUrl)}
              />
              {userProfile.stampUrl && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg p-1 border border-green-200">
                    <img src={userProfile.stampUrl} alt="Tampon actuel" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xs font-semibold text-green-700 dark:text-green-300">Tampon enregistré</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <FileSignature size={20} className="text-brand-600 dark:text-brand-400" />
                <span className="font-bold text-sm text-brand-900 dark:text-white">Signature Numérique</span>
              </div>
              <HandSignatureCanvas 
                onSave={(svgData) => handleChange("signatureUrl", svgData)}
                initialSignature={userProfile.signatureUrl}
              />
              {userProfile.signatureUrl && (
                <div className="mt-4 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-100 dark:border-brand-800 flex items-center gap-3">
                  <div className="w-12 h-8 bg-white rounded-lg p-1 border border-brand-200">
                    <img src={userProfile.signatureUrl} alt="Signature actuelle" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">Signature prête</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Identity Card */}
      <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
        <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
          <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
            <Building size={24} />
          </div>
          <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
            Identité Professionnelle
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2">
            <FormField
              label="Nom commercial / Raison sociale"
              value={userProfile.companyName}
              onChange={(val) => handleChange("companyName", val)}
              placeholder="Ex: Mon Entreprise Digitale"
              required
            />
          </div>
          <FormField
            label="Titre Professionnel"
            value={userProfile.professionalTitle ?? ""}
            onChange={(val) => handleChange("professionalTitle", val)}
            placeholder="Ex: Consultant IT, Photographe..."
            icon={Briefcase}
          />
          <FormField
            label="SIRET"
            value={userProfile.siret}
            onChange={(val) => {
              handleChange("siret", val);
            }}
            placeholder="123 456 789 00012"
            icon={Hash}
            error={validationErrors.siret}
            description="14 chiffres obligatoires (art. L123-1 Code de commerce)"
          />
        </div>
      </div>

      {/* Contact Card */}
      <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
        <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
          <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
            <MailIcon size={24} />
          </div>
          <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
            Coordonnées & Web
          </h3>
        </div>

        <div className="space-y-8">
          <TextAreaField
            label="Adresse du siège"
            value={userProfile.address}
            onChange={(val) => handleChange("address", val)}
            placeholder="123 Avenue de la République, 75001 Paris"
            icon={MapPin}
            rows={2}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              label="Email Professionnel"
              type="email"
              value={userProfile.email}
              onChange={(val) => {
                handleChange("email", val);
              }}
              icon={MailIcon}
              error={validationErrors.email}
            />
            <FormField
              label="Téléphone"
              type="tel"
              value={userProfile.phone}
              onChange={(val) => handleChange("phone", val)}
              icon={PhoneIcon}
            />
            <FormField
              label="Site Web"
              type="url"
              value={userProfile.website ?? ""}
              onChange={(val) => handleChange("website", val)}
              placeholder="www.mon-site.fr"
              icon={Globe}
            />
            <FormField
              label="LinkedIn"
              value={userProfile.linkedin ?? ""}
              onChange={(val) => handleChange("linkedin", val)}
              placeholder="linkedin.com/in/profil"
              icon={Briefcase}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;

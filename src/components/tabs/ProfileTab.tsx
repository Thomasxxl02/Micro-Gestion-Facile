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
} from "lucide-react";
import React from "react";
import type { UserProfile } from "../../types";
import { FormField, LogoUploader, TextAreaField } from "../FormFields";

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
  const _validateSIRET = (value: string): string | undefined => {
    if (!value) {
      return undefined;
    }
    const digits = value.replace(/[\s-]/g, "");
    if (!/^\d{14}$/.test(digits)) {
      return "Le SIRET doit contenir exactement 14 chiffres";
    }
    return undefined;
  };

  const _validateEmail = (value: string): string | undefined => {
    if (!value) {
      return undefined;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Adresse email invalide";
    }
    return undefined;
  };

  return (
    <div
      id="panel-profile"
      role="tabpanel"
      aria-labelledby="tab-profile"
      className="space-y-8 animate-slide-up"
    >
      {/* Image de marque */}
      <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
        <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
          <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
            <Palette size={24} />
          </div>
          <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
            Image de marque
          </h3>
        </div>
        <LogoUploader
          logoUrl={userProfile.logoUrl}
          onChange={(url) => handleChange("logoUrl", url)}
          onRemove={() => handleChange("logoUrl", "")}
        />
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

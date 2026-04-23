/**
 * BillingTab - Gestion fiscale, conformité et documents
 * ✅ Calculs URSSAF 2026
 * ✅ Validation IBAN, numérotation des documents
 */

import { CreditCard, FileText, Hash, ShieldCheck, Wallet } from "lucide-react";
import React from "react";
import type { UserProfile } from "../../types";
import {
  FormField,
  SelectField,
  TextAreaField,
  ToggleSwitch,
} from "../FormFields";

interface BillingTabProps {
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
 * BillingTab - Onglet Facturation & Conformité Fiscale
 * Responsabilités :
 * - Régime fiscal (Micro-BNC, Micro-BIC, Libéral)
 * - URSSAF & TVA (seuils, alertes)
 * - Numérotation des documents (factures, devis, avoirs)
 * - Mentions légales et e-Facture
 */
export const BillingTab: React.FC<BillingTabProps> = ({
  userProfile,
  handleChange,
  validationErrors,
  // eslint-disable-next-line complexity
}) => {
  return (
    <div
      id="panel-billing"
      role="tabpanel"
      aria-labelledby="tab-billing"
      className="space-y-8 animate-slide-up"
    >
      {/* Conformité Fiscale */}
      <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
        <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
          <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
            Conformité Fiscale
          </h3>
        </div>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SelectField
              label="Régime d'imposition"
              value={userProfile.taxSystem ?? "MICRO-BNC"}
              onChange={(val) => handleChange("taxSystem", val)}
              options={[
                {
                  value: "MICRO-BNC",
                  label: "Micro-BNC (Services libéraux)",
                },
                {
                  value: "MICRO-BIC",
                  label: "Micro-BIC (Artisanat / Vente)",
                },
                { value: "LIBERAL", label: "Profession libérale" },
              ]}
            />
            <SelectField
              label="Type d'activité URSSAF"
              value={userProfile.activityType ?? "SERVICE_BNC"}
              onChange={(val) => handleChange("activityType", val)}
              options={[
                {
                  value: "SERVICE_BNC",
                  label: "Service BNC (Profession libérale)",
                },
                {
                  value: "SERVICE_BIC",
                  label: "Service BIC (Artisan / Commerçant)",
                },
                { value: "SALE", label: "Vente de marchandises" },
                {
                  value: "LIBERAL",
                  label: "Profession libérale réglementée",
                },
              ]}
              description="Détermine les taux de cotisations URSSAF applicables"
            />
          </div>
          <ToggleSwitch
            label="Franchise en base de TVA"
            description="Active la mention automatique 'TVA non applicable, art. 293 B du CGI' sur vos documents"
            checked={userProfile.isVatExempt ?? false}
            onChange={(val) => handleChange("isVatExempt", val)}
          />
          <ToggleSwitch
            label="Bénéficiaire de l'ACRE"
            description="Aide à la Création et Reprise d'Entreprise — réduction de 50 % des cotisations la 1ère année (art. L. 5141-1 Code du Travail)"
            checked={userProfile.isAcreBeneficiary ?? false}
            onChange={(val) => handleChange("isAcreBeneficiary", val)}
          />
          <ToggleSwitch
            label="Alerte seuil de TVA"
            description="Vous avertir à l'approche du seuil de franchise TVA (37 500 € services / 85 000 € ventes)"
            checked={userProfile.vatThresholdAlert ?? false}
            onChange={(val) => handleChange("vatThresholdAlert", val)}
          />
          {userProfile.vatThresholdAlert && (
            <div className="ml-14 animate-fade-in">
              <FormField
                label="Seuil d'alerte TVA (%)"
                type="number"
                value={String(userProfile.customVatThresholdPercentage ?? 80)}
                onChange={(val) => {
                  const parsed = Number.parseFloat(val);
                  handleChange(
                    "customVatThresholdPercentage",
                    Number.isNaN(parsed)
                      ? 80
                      : Math.min(100, Math.max(1, parsed)),
                  );
                }}
                min={1}
                max={100}
                description="Pourcentage du seuil à partir duquel vous recevrez une alerte (ex: 80%)"
              />
            </div>
          )}
          <ToggleSwitch
            label="Alerte plafond de revenus"
            description="Vous alerter à l'approche du plafond de CA de la micro-entreprise"
            checked={userProfile.revenueThresholdAlert ?? false}
            onChange={(val) => handleChange("revenueThresholdAlert", val)}
          />
          {userProfile.revenueThresholdAlert && (
            <div className="ml-14 animate-fade-in">
              <FormField
                label="Seuil d'alerte CA (%)"
                type="number"
                value={String(
                  userProfile.customRevenueThresholdPercentage ?? 90,
                )}
                onChange={(val) => {
                  const parsed = Number.parseFloat(val);
                  handleChange(
                    "customRevenueThresholdPercentage",
                    Number.isNaN(parsed)
                      ? 90
                      : Math.min(100, Math.max(1, parsed)),
                  );
                }}
                min={1}
                max={100}
                description="Pourcentage du plafond à partir duquel vous recevrez une alerte (ex: 90%)"
              />
            </div>
          )}

          <div className="border-t border-brand-50 dark:border-brand-800 pt-8 mt-4">
            <SelectField
              label="Périodicité des déclarations de CA"
              value={userProfile.taxDeclarationPeriod ?? "MONTHLY"}
              onChange={(val) => handleChange("taxDeclarationPeriod", val)}
              options={[
                {
                  value: "MONTHLY",
                  label: "Mensuelle (tous les mois)",
                },
                {
                  value: "QUARTERLY",
                  label: "Trimestrielle (tous les 3 mois)",
                },
              ]}
              description="Génère des rappels automatiques avant la date limite de télédéclaration URSSAF"
            />
          </div>
        </div>
      </div>

      {/* Bancaire & Légal */}
      <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
        <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
          <div className="p-2 bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 rounded-xl">
            <Wallet size={24} />
          </div>
          <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
            Bancaire & Légal
          </h3>
        </div>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              label="IBAN"
              value={userProfile.bankAccount ?? ""}
              onChange={(val) => {
                handleChange("bankAccount", val);
              }}
              placeholder="FR76 3000 6000 0112 3456 7890 189"
              icon={CreditCard}
              error={validationErrors.bankAccount}
            />
            <FormField
              label="BIC / SWIFT"
              value={userProfile.bic ?? ""}
              onChange={(val) => handleChange("bic", val)}
              placeholder="TRPUFRPPXXX"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SelectField
              label="Devise"
              value={userProfile.currency ?? "€"}
              onChange={(val) => handleChange("currency", val)}
              options={[
                { value: "€", label: "Euro (€)" },
                { value: "$", label: "Dollar ($)" },
                { value: "£", label: "Livre (£)" },
                { value: "CHF", label: "Franc Suisse" },
              ]}
            />
            <FormField
              label="TVA par défaut (%)"
              type="number"
              value={String(userProfile.defaultVatRate ?? 0)}
              onChange={(val) => {
                const parsed = Number.parseFloat(val);
                handleChange(
                  "defaultVatRate",
                  Number.isNaN(parsed) ? 0 : parsed,
                );
              }}
            />
          </div>
        </div>
      </div>

      {/* Numérotation des Documents */}
      <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
        <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
          <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
            <Hash size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
              Numérotation des Documents
            </h3>
            <p className="text-xs text-brand-400 dark:text-brand-500 mt-0.5">
              Conformité fiscale française — art. L441-9 du Code de commerce
            </p>
          </div>
        </div>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              label="Préfixe des Factures"
              value={userProfile.invoicePrefix ?? "FAC-"}
              onChange={(val) => handleChange("invoicePrefix", val)}
              placeholder="FAC-2026-"
              icon={Hash}
              description="Préfixe auto-ajouté avant le numéro séquentiel"
            />
            <FormField
              label="Prochain N° de Facture"
              type="number"
              value={String(userProfile.invoiceStartNumber ?? 1)}
              onChange={(val) => {
                const parsed = parseInt(val, 10);
                handleChange(
                  "invoiceStartNumber",
                  Number.isNaN(parsed) ? 1 : Math.max(1, parsed),
                );
              }}
              min={1}
              placeholder="1"
              description="Numéro de la prochaine facture émise"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              label="Préfixe des Devis"
              value={userProfile.quotePrefix ?? "DEV-"}
              onChange={(val) => handleChange("quotePrefix", val)}
              placeholder="DEV-2026-"
              icon={Hash}
            />
            <FormField
              label="Préfixe des Avoirs"
              value={userProfile.creditNotePrefix ?? "AV-"}
              onChange={(val) => handleChange("creditNotePrefix", val)}
              placeholder="AV-2026-"
              icon={Hash}
            />
          </div>
          <div className="p-4 bg-brand-50/50 dark:bg-brand-800/30 rounded-2xl border border-dashed border-brand-200 dark:border-brand-700">
            <p className="text-[10px] uppercase font-bold text-brand-400 mb-2">
              Aperçu du numéro généré
            </p>
            <p className="text-base font-mono font-bold text-brand-700 dark:text-brand-300">
              {userProfile.invoicePrefix ?? "FAC-"}
              {String(userProfile.invoiceStartNumber ?? 1).padStart(3, "0")}
            </p>
          </div>
        </div>
      </div>

      {/* Mentions Légales & Facturation Électronique */}
      <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
        <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
          <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
              Mentions Légales &amp; e-Facture
            </h3>
            <p className="text-xs text-brand-400 dark:text-brand-500 mt-0.5">
              Obligations légales et conformité 2026
            </p>
          </div>
        </div>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              label="N° TVA Intracommunautaire"
              value={userProfile.tvaNumber ?? ""}
              onChange={(val) => handleChange("tvaNumber", val)}
              placeholder="FR12 123456789"
              description="Obligatoire pour les échanges UE (art. 289 CGI)"
            />
            <SelectField
              label="Format e-Facture par défaut"
              value={userProfile.defaultEInvoiceFormat ?? "Factur-X"}
              onChange={(val) => handleChange("defaultEInvoiceFormat", val)}
              options={[
                {
                  value: "Factur-X",
                  label: "Factur-X (PDF/A-3 embarqué)",
                },
                {
                  value: "UBL",
                  label: "UBL 2.1 (Universal Business Language)",
                },
                { value: "CII", label: "CII (Cross Industry Invoice)" },
              ]}
              description="Obligatoire pour la facturation électronique 2026"
            />
          </div>
          <TextAreaField
            label="Mentions légales (pied de facture)"
            value={userProfile.legalMentions ?? ""}
            onChange={(val) => handleChange("legalMentions", val)}
            placeholder="Ex : Dispensé d'immatriculation — art. L123-1 Code de commerce. TVA non applicable, art. 293 B du CGI."
            rows={3}
            description="Texte affiché en bas de chaque facture"
          />
        </div>
      </div>
    </div>
  );
};

export default BillingTab;

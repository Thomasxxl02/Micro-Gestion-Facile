/**
 * BillingTab - Gestion fiscale, conformité et documents
 * ✅ Calculs URSSAF 2026
 * ✅ Validation IBAN, numérotation des documents
 */

import {
  AlertTriangle,
  Calendar,
  CreditCard,
  FileText,
  Hash,
  Info,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import React from "react";
import { getThresholds, isAcreActive } from "../../lib/fiscalCalculations";
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
   
}) => {
  const thresholds = getThresholds(userProfile.activityType ?? "SERVICE_BNC");

  // Prochaine échéance URSSAF selon la périodicité choisie
  const nextUrssafDeadline = (() => {
    const today = new Date();
    const period = userProfile.taxDeclarationPeriod ?? "MONTHLY";
    if (period === "QUARTERLY") {
      const year = today.getFullYear();
      const deadlines = [
        { date: new Date(year, 0, 31), period: "T4 (oct.\u2013déc.)" },
        { date: new Date(year, 3, 30), period: "T1 (jan.\u2013mar.)" },
        { date: new Date(year, 6, 31), period: "T2 (avr.\u2013juin)" },
        { date: new Date(year, 9, 31), period: "T3 (juil.\u2013sept.)" },
      ];
      const next = deadlines.find((d) => d.date > today);
      const result = next ?? {
        date: new Date(year + 1, 0, 31),
        period: "T4 (oct.\u2013déc.)",
      };
      return {
        ...result,
        daysUntil: Math.ceil(
          (result.date.getTime() - today.getTime()) / 86400000,
        ),
      };
    } else {
      const d = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      const monthLabel = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        1,
      ).toLocaleDateString("fr-FR", { month: "long" });
      return {
        date: d,
        period: `CA de ${monthLabel}`,
        daysUntil: Math.ceil((d.getTime() - today.getTime()) / 86400000),
      };
    }
  })();

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
            label="Versement libératoire de l'IR (VFL)"
            description="Payer l'impôt sur le revenu en même temps que les cotisations URSSAF. Taux : 2,2 % BNC · 1,7 % BIC services · 1 % vente. Conditions : revenu fiscal N-2 ≤ 28 797 €/part (art. 151-0 CGI)."
            checked={userProfile.hasTaxVersantLiberatoire ?? false}
            onChange={(val) => handleChange("hasTaxVersantLiberatoire", val)}
          />
          <ToggleSwitch
            label="Bénéficiaire de l'ACRE"
            description="Aide à la Création et Reprise d'Entreprise — réduction de 50 % des cotisations la 1ère année (art. L. 5141-1 Code du Travail)"
            checked={userProfile.isAcreBeneficiary ?? false}
            onChange={(val) => handleChange("isAcreBeneficiary", val)}
          />
          {userProfile.isAcreBeneficiary && (
            <div className="ml-14 space-y-3 animate-fade-in">
              <FormField
                label="Date de début d'activité"
                type="date"
                value={userProfile.businessStartDate ?? ""}
                onChange={(val) => handleChange("businessStartDate", val)}
                description="Détermine automatiquement l'expiration de l'ACRE (12 mois après cette date — art. L. 5141-1)"
              />
              {/* Alerte expiration ACRE */}
              {userProfile.businessStartDate && !isAcreActive(userProfile) && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 text-sm text-red-700 dark:text-red-300"
                >
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0 text-red-500"
                    aria-hidden="true"
                  />
                  <span>
                    <strong>ACRE expirée.</strong> Les 12 mois d'exonération
                    sont écoulés depuis le{" "}
                    {new Date(
                      new Date(userProfile.businessStartDate).setMonth(
                        new Date(userProfile.businessStartDate).getMonth() + 12,
                      ),
                    ).toLocaleDateString("fr-FR")}
                    . Les cotisations sont désormais calculées au taux plein.
                    Désactivez le bénéfice ACRE pour corriger vos calculs.
                  </span>
                </div>
              )}
              {/* Info : ACRE encore active */}
              {userProfile.businessStartDate && isAcreActive(userProfile) && (
                <div className="flex items-start gap-3 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 text-sm text-green-700 dark:text-green-300">
                  <Info
                    size={18}
                    className="mt-0.5 shrink-0 text-green-500"
                    aria-hidden="true"
                  />
                  <span>
                    ACRE active jusqu'au{" "}
                    <strong>
                      {new Date(
                        new Date(userProfile.businessStartDate).setMonth(
                          new Date(userProfile.businessStartDate).getMonth() +
                            12,
                        ),
                      ).toLocaleDateString("fr-FR")}
                    </strong>
                    . Les taux réduits s'appliquent automatiquement.
                  </span>
                </div>
              )}
            </div>
          )}
          <ToggleSwitch
            label="Alerte seuil de TVA"
            description={`Vous avertir à l'approche du seuil de franchise en base de TVA (${thresholds.tva.toLocaleString("fr-FR")} € — art. 293 B CGI)`}
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
            {/* Prochaine échéance URSSAF */}
            <div
              role="status"
              aria-live="polite"
              className={`mt-4 flex items-start gap-3 rounded-2xl p-4 border text-sm ${
                nextUrssafDeadline.daysUntil <= 15
                  ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                  : "bg-brand-50 dark:bg-brand-800/30 border-brand-100 dark:border-brand-700 text-brand-600 dark:text-brand-300"
              }`}
            >
              <Calendar
                size={18}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold">
                  Prochaine déclaration URSSAF — {nextUrssafDeadline.period}
                </p>
                <p className="text-xs mt-0.5 opacity-80">
                  Date limite :{" "}
                  <strong>
                    {nextUrssafDeadline.date.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>{" "}
                  (
                  {nextUrssafDeadline.daysUntil > 0
                    ? `dans ${nextUrssafDeadline.daysUntil} jour${
                        nextUrssafDeadline.daysUntil > 1 ? "s" : ""
                      }`
                    : "aujourd'hui ou dépassée"}
                  )
                </p>
              </div>
            </div>
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

          {/* Format de numérotation */}
          <FormField
            label="Format de numérotation"
            value={userProfile.numberingFormat ?? "{PREFIX}-{YEAR}-{NUM}"}
            onChange={(val) =>
              handleChange("numberingFormat", val || "{PREFIX}-{YEAR}-{NUM}")
            }
            placeholder="{PREFIX}-{YEAR}-{NUM}"
            icon={Hash}
            description="Jetons disponibles : {PREFIX} {YEAR} {YY} {MM} {NUM} — Ex : {PREFIX}-{YYYY}-{MM}-{NUM} → FAC-2026-04-001"
          />

          {/* Réinitialisation annuelle */}
          <ToggleSwitch
            label="Réinitialisation annuelle de la numérotation"
            description="Remet le compteur à 001 au 1er janvier de chaque année (pratique recommandée en France — art. 289-I-5° CGI). Désactivez uniquement si vous préférez une numérotation continue multi-annuelle."
            checked={userProfile.resetNumberingYearly ?? true}
            onChange={(val) => handleChange("resetNumberingYearly", val)}
          />

          {/* Alerte numérotation libre */}
          {!userProfile.resetNumberingYearly && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 text-sm text-amber-700 dark:text-amber-300"
            >
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-amber-500"
                aria-hidden="true"
              />
              <span>
                <strong>Numérotation continue multi-annuelle activée.</strong>{" "}
                Assurez-vous que vos numéros restent{" "}
                <strong>uniques et chronologiques</strong> au fil des années
                (art. L441-9 CGI). En cas de contrôle fiscal, une lacune ou un
                doublon dans la séquence peut entraîner une amende.
              </span>
            </div>
          )}

          <div className="p-4 bg-brand-50/50 dark:bg-brand-800/30 rounded-2xl border border-dashed border-brand-200 dark:border-brand-700">
            <p className="text-[10px] uppercase font-bold text-brand-400 mb-2">
              Aperçu du numéro généré
            </p>
            <p className="text-base font-mono font-bold text-brand-700 dark:text-brand-300">
              {(() => {
                const format =
                  userProfile.numberingFormat ?? "{PREFIX}-{YEAR}-{NUM}";
                const prefix = (userProfile.invoicePrefix ?? "FAC").replace(
                  /-$/,
                  "",
                );
                const year = new Date().getFullYear();
                const month = String(new Date().getMonth() + 1).padStart(
                  2,
                  "0",
                );
                const num = String(
                  userProfile.invoiceStartNumber ?? 1,
                ).padStart(3, "0");
                return format
                  .replace(/\{PREFIX\}|\[PREFIX\]/g, prefix)
                  .replace(/\{YEAR\}|\[YEAR\]|\{YYYY\}|\[YYYY\]/g, String(year))
                  .replace(/\{YY\}|\[YY\]/g, String(year).slice(-2))
                  .replace(/\{MM\}|\[MM\]/g, month)
                  .replace(/\{NUM\}|\[NUM\]|\{SEQ\}|\[SEQ\]/g, num);
              })()}
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
            {/* N° TVA Intracommunautaire — masqué en franchise de base (art. 293 B CGI) */}
            {userProfile.isVatExempt ? (
              <div
                role="note"
                aria-label="N° TVA Intracommunautaire non applicable en franchise de base"
                className="flex items-start gap-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 text-sm text-blue-700 dark:text-blue-300"
              >
                <Info
                  size={18}
                  className="mt-0.5 shrink-0 text-blue-500"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium">
                    N° TVA Intracommunautaire non applicable
                  </p>
                  <p className="mt-1 leading-relaxed">
                    En franchise en base de TVA (art. 293 B CGI), vous ne
                    disposez pas d'un numéro de TVA intracommunautaire. Ce champ
                    sera disponible après dépassement du seuil de franchise et
                    option pour la TVA.
                  </p>
                </div>
              </div>
            ) : (
              <FormField
                label="N° TVA Intracommunautaire"
                value={userProfile.tvaNumber ?? ""}
                onChange={(val) => handleChange("tvaNumber", val)}
                placeholder="FR12 123456789"
                description="Obligatoire pour les échanges UE (art. 289 CGI)"
              />
            )}
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

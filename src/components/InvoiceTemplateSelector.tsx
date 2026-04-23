/**
 * InvoiceTemplateSelector - Sélecteur et préview de gabarits de facture
 * ✅ Aperçu en temps réel avec couleurs
 */

import React from "react";

interface InvoiceTemplateThumbnailProps {
  template: "modern" | "classic" | "minimal" | "corporate";
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  companyName?: string;
  invoiceNumber?: string;
  size?: "thumb" | "preview";
}

/**
 * InvoiceTemplateThumbnail - Affiche un aperçu miniature de gabarit
 * Utilisé pour sélectionner le gabarit dans PreferencesTab
 */
export const InvoiceTemplateThumbnail: React.FC<
  InvoiceTemplateThumbnailProps
> = ({
  template,
  primaryColor,
  secondaryColor,
  fontFamily,
  companyName,
  invoiceNumber,
  size = "thumb",
}) => {
  const name = companyName ?? "Votre Entreprise";
  const number = invoiceNumber ?? "FAC-001";
  const isPreview = size === "preview";
  const wrapClass = isPreview
    ? "rounded-xl overflow-hidden border border-brand-100 dark:border-brand-700 shadow-sm text-[9px]"
    : "rounded-lg overflow-hidden border border-brand-100 dark:border-brand-700 text-[7px] h-24";
  const bodyPad = isPreview ? "px-3 py-2" : "px-2 py-1";
  const nameSize = isPreview ? "text-[10px]" : "text-[8px]";
  const spacing = isPreview ? "space-y-1.5" : "space-y-0.5";

  const cssVars = {
    "--itmpl-primary": primaryColor,
    "--itmpl-secondary": secondaryColor,
    "--itmpl-font": fontFamily,
  } as React.CSSProperties;

  if (template === "modern") {
    return (
      <div
        className={`${wrapClass} [font-family:var(--itmpl-font)]`}
        style={cssVars}
      >
        <div
          className="bg-(--itmpl-primary) text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <div className={`${bodyPad}`}>
            <p className={`font-bold truncate ${nameSize}`}>{name}</p>
            <p className="opacity-75 text-[6px]">FACTURE N° {number}</p>
          </div>
        </div>
        <div className={`${bodyPad} bg-white dark:bg-brand-900/50 ${spacing}`}>
          <div
            className="h-0.5 rounded-full w-8"
            style={{ backgroundColor: secondaryColor }}
          />
          <div className="flex justify-between text-brand-500 dark:text-brand-400 text-[6px]">
            <span>Prestation × 1</span>
            <span className="font-semibold">500,00 €</span>
          </div>
          <div className="border-t border-brand-100 dark:border-brand-700 pt-1 flex justify-between font-bold text-brand-700 dark:text-brand-300 text-[6px]">
            <span>Total TTC</span>
            <span>500,00 €</span>
          </div>
        </div>
      </div>
    );
  }

  if (template === "classic") {
    return (
      <div
        className={`${wrapClass} bg-white dark:bg-brand-900/60 [font-family:var(--itmpl-font)]`}
        style={cssVars}
      >
        <div
          className={`${bodyPad} flex justify-between items-start border-b-2`}
          style={{ borderBottomColor: primaryColor }}
        >
          <div>
            <p
              className={`font-bold ${nameSize}`}
              style={{ color: primaryColor }}
            >
              {name}
            </p>
            <p className="text-brand-400 text-[6px]">contact@entreprise.fr</p>
          </div>
          <div className="text-right">
            <p
              className={`font-bold ${nameSize} text-brand-700 dark:text-brand-300`}
            >
              FACTURE
            </p>
            <p className="text-brand-400 text-[6px]">{number}</p>
          </div>
        </div>
        <div className={`${bodyPad} ${spacing}`}>
          <div className="flex justify-between text-brand-400 text-[6px]">
            <span>Prestation × 1</span>
            <span>500,00 €</span>
          </div>
          <div
            className="border-t border-brand-200 pt-0.5 flex justify-between font-bold text-[6px]"
            style={{ color: primaryColor }}
          >
            <span>Total TTC</span>
            <span>500,00 €</span>
          </div>
        </div>
      </div>
    );
  }

  if (template === "minimal") {
    return (
      <div
        className={`${wrapClass} bg-white dark:bg-brand-900/60 [font-family:var(--itmpl-font)]`}
        style={cssVars}
      >
        <div className={`${bodyPad}`}>
          <p
            className={`${nameSize} text-brand-900 dark:text-white font-medium`}
          >
            {name}
          </p>
          <div
            className="h-px mt-1"
            style={{ backgroundColor: primaryColor }}
          />
          <div className="flex justify-between mt-1 text-brand-400 text-[6px]">
            <span>FACTURE {number}</span>
            <span>
              {new Date().toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
        <div className={`${bodyPad} ${spacing}`}>
          <div className="flex justify-between text-brand-400 text-[6px]">
            <span>Prestation × 1</span>
            <span>500,00 €</span>
          </div>
          <div className="border-t border-brand-100 pt-0.5 flex justify-between font-semibold text-brand-700 dark:text-brand-300 text-[6px]">
            <span>Total</span>
            <span>500,00 €</span>
          </div>
        </div>
      </div>
    );
  }

  // corporate
  return (
    <div
      className={`${wrapClass} [font-family:var(--itmpl-font)]`}
      style={cssVars}
    >
      <div className="flex h-10">
        <div
          className="w-2/3 px-2 py-1.5 text-white flex flex-col justify-center"
          style={{ backgroundColor: primaryColor }}
        >
          <p className={`font-bold ${nameSize} truncate`}>{name}</p>
          <p className="opacity-70 text-[6px]">SIRET : 000 000 000</p>
        </div>
        <div
          className="w-1/3 px-1.5 py-1.5 flex flex-col justify-center"
          style={{ backgroundColor: secondaryColor }}
        >
          <p className="font-bold text-white text-[7px]">FACTURE</p>
          <p className="text-white opacity-80 text-[6px]">{number}</p>
        </div>
      </div>
      <div className={`${bodyPad} bg-white dark:bg-brand-900/60 ${spacing}`}>
        <div className="flex justify-between text-brand-400 text-[6px]">
          <span>Prestation × 1</span>
          <span>500,00 €</span>
        </div>
        <div className="border-t border-brand-100 pt-0.5 flex justify-between font-bold text-brand-700 dark:text-brand-300 text-[6px]">
          <span>Total TTC</span>
          <span>500,00 €</span>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplateThumbnail;

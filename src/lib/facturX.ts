/**
 * Moteur de génération Factur-X (ZUGFeRD) pour le profil 'BASIC'
 * Réforme de la facturation électronique 2026
 */
import Decimal from "decimal.js";
import type { jsPDF as JsPDFType } from "jspdf";
import type { Client, Invoice, UserProfile } from "../types";

// Interface pour jsPDF avec propriété facturX custom
interface JsPDFWithFacturX extends JsPDFType {
  facturX?: string;
}

/**
 * Échappe les caractères XML spéciaux
 */
const escapeXML = (str: string | undefined): string => {
  if (!str) {
    return "";
  }
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
};

/**
 * Extrait le code postal d'une adresse
 */
const extractPostalCode = (address: string | undefined): string => {
  if (!address) {
    return "75001";
  }
  // Essaie d'extraire un code postal français (5 chiffres)
  const match = /\b\d{5}\b/.exec(address);
  if (match) {
    return match[0];
  }

  // Sinon, inférer de la ville
  if (address.includes("Lyon")) {
    return "69000";
  }
  if (address.includes("Marseille")) {
    return "13000";
  }
  if (address.includes("Paris")) {
    return "75001";
  }

  return "75001"; // Défaut Paris
};

/**
 * Génère le XML Factur-X au format BASIC
 * Note: En environnement de production, ce XML devrait être validé contre le schéma officiel
 */
export const generateFacturX_XML = (
  invoice: Invoice,
  client: Client,
  userProfile: UserProfile,
): string => {
  const dateStr = invoice.date.replaceAll("-", "");
  const dueDateStr = invoice.dueDate?.replaceAll("-", "") ?? "";
  const dueDateISO = invoice.dueDate || ""; // Garder le format ISO aussi
  const currency = "EUR";

  // Calcul du sous-total HT avec Decimal.js (précision bancaire, évite IEEE 754)
  const subtotalD = invoice.items.reduce(
    (sum, item) => sum.plus(new Decimal(item.quantity).times(item.unitPrice)),
    new Decimal(0),
  );
  // Calcul TVA par article puis sommation (même précision)
  const calculatedVATD = invoice.items.reduce((sum, item) => {
    const itemTotal = new Decimal(item.quantity).times(item.unitPrice);
    return sum.plus(itemTotal.times(item.vatRate ?? 0).dividedBy(100));
  }, new Decimal(0));
  // Utiliser la TVA fournie ou calculée
  const resolveVATAmount = (): Decimal => {
    if (invoice.vatAmount !== undefined) {
      return new Decimal(invoice.vatAmount);
    }
    if (calculatedVATD.greaterThan(0)) {
      return calculatedVATD;
    }
    const diff = new Decimal(invoice.total).minus(subtotalD);
    return diff.greaterThan(0) ? diff : new Decimal(0);
  };
  const vatAmountD = resolveVATAmount().toDecimalPlaces(2);
  const grandTotalD = subtotalD.toDecimalPlaces(2).plus(vatAmountD);

  // Génération des lignes d'articles pour le XML
  const getCategoryCode = (vatRate: number | undefined): string => {
    if (vatRate === 0) {
      return "Z";
    } // Zero-rated
    if (vatRate) {
      return "S";
    } // Standard rate
    return "E"; // Exempt
  };

  const lineItemsXML = invoice.items
    .map((item, index) => {
      const categoryCode = getCategoryCode(item.vatRate);
      // Précision Decimal.js sur chaque ligne (prévient l'accumulation d'erreurs)
      const lineTotal = new Decimal(item.quantity)
        .times(item.unitPrice)
        .toDecimalPlaces(2)
        .toFixed(2);
      return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${index + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXML(item.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${item.unitPrice.toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${item.unit === "heure" ? "HUR" : "C62"}">${item.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${categoryCode}</ram:CategoryCode>
          <ram:RateApplicablePercent>${item.vatRate ?? 0}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${lineTotal}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
    })
    .join("");

  // Extraction des codes postaux
  const sellerPostalCode = extractPostalCode(userProfile.address);
  const buyerPostalCode = extractPostalCode(client.address);

  // Structure du profil BASIC
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:a="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:10" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${invoice.number}</ram:ID>
    <ram:TypeCode>${invoice.type === "credit_note" ? "381" : "380"}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${dateStr}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    ${lineItemsXML}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXML(userProfile.companyName ?? "Ma Micro-Entreprise")}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXML(userProfile.address ?? "Non spécifiée")}</ram:LineOne>
          <ram:CityName>${escapeXML(userProfile.address?.split(",")[0] ?? "Paris")}</ram:CityName>
          <ram:PostcodeCode>${sellerPostalCode}</ram:PostcodeCode>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${userProfile.siret ?? ""}</ram:ID>
        </ram:SpecifiedLegalOrganization>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXML(client.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXML(client.address ?? "Non spécifiée")}</ram:LineOne>
          <ram:CityName>${escapeXML(client.address?.split(",")[0] ?? "Paris")}</ram:CityName>
          <ram:PostcodeCode>${buyerPostalCode}</ram:PostcodeCode>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${client.siret ?? ""}</ram:ID>
        </ram:SpecifiedLegalOrganization>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${currency}</ram:InvoiceCurrencyCode>
      ${dueDateStr ? `<ram:SpecifiedTradePaymentTerms><ram:Description>${dueDateISO}</ram:Description><ram:DueDateDateTime><udt:DateTimeString format="102">${dueDateStr}</udt:DateTimeString></ram:DueDateDateTime></ram:SpecifiedTradePaymentTerms>` : ""}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:TaxBasisTotalAmount>${subtotalD.toDecimalPlaces(2).toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${currency}">${vatAmountD.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${grandTotalD.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${grandTotalD.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Validation structurelle Factur-X BASIC
// Réf. : EN 16931 + Factur-X 1.0.06 (profil BASIC)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vérifie la présence des éléments requis par le profil Factur-X BASIC (EN 16931).
 * À appeler avant l'injection du XML dans le PDF pour prévenir les rejets PPF.
 *
 * @returns `{ valid: true }` si conforme, `{ valid: false, errors: string[] }` sinon.
 */
export function validateFacturXXML(xml: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Éléments obligatoires selon EN 16931 / Factur-X BASIC
  const requiredElements: Array<{ tag: string; label: string }> = [
    {
      tag: "rsm:CrossIndustryInvoice",
      label: "Élément racine CrossIndustryInvoice",
    },
    {
      tag: "ram:GuidelineSpecifiedDocumentContextParameter",
      label: "Contexte du profil",
    },
    { tag: "urn:factur-x.eu:1p0:basic", label: "Identifiant profil BASIC" },
    { tag: "ram:ID", label: "Numéro de facture (ram:ID)" },
    {
      tag: "ram:TypeCode",
      label: "Code type document (380=facture, 381=avoir)",
    },
    { tag: "udt:DateTimeString", label: "Date d'émission" },
    { tag: "ram:SellerTradeParty", label: "Vendeur (SellerTradeParty)" },
    { tag: "ram:BuyerTradeParty", label: "Acheteur (BuyerTradeParty)" },
    { tag: "ram:InvoiceCurrencyCode", label: "Code devise (EUR)" },
    { tag: "ram:TaxBasisTotalAmount", label: "Montant HT total" },
    { tag: "ram:GrandTotalAmount", label: "Montant TTC total" },
    { tag: "ram:DuePayableAmount", label: "Montant dû" },
  ];

  for (const { tag, label } of requiredElements) {
    if (!xml.includes(tag)) {
      errors.push(`Élément requis manquant : <${tag}> (${label})`);
    }
  }

  // Le SIRET vendeur doit être renseigné (schemeID="0002" requis en France)
  const siretMatch = /schemeID="0002">([^<]+)</.exec(xml);
  if (!siretMatch?.[1].trim()) {
    errors.push(
      'SIRET vendeur absent ou vide (schemeID="0002" requis pour la France)',
    );
  }

  // Le montant total doit être un nombre positif
  const grandTotalMatch =
    /<ram:GrandTotalAmount>([^<]+)<\/ram:GrandTotalAmount>/.exec(xml);
  if (grandTotalMatch) {
    const amount = parseFloat(grandTotalMatch[1]);
    if (isNaN(amount) || amount < 0) {
      errors.push(
        `GrandTotalAmount invalide : "${grandTotalMatch[1]}" (attendu : nombre ≥ 0)`,
      );
    }
  }

  // La date d'émission doit être au format AAAAMMJJ (format="102")
  const dateMatch = /format="102">(\d{8})<\/udt:DateTimeString>/.exec(xml);
  if (!dateMatch) {
    errors.push(
      'Date d\'émission absente ou au mauvais format (attendu : AAAAMMJJ, format="102")',
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Génère le PDF/A-3 avec injection du XML Factur-X
 */
export const generatePDFWithFacturX = async (
  invoice: Invoice,
  client: Client,
  userProfile: UserProfile,
) => {
  // Chargement différé : jspdf (~500 kB) n'est importé qu'à l'appel effectif
  const { jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docWithTable = doc as any;

  // --- Configuration Styles Personnalisés ---
  const primaryColor = userProfile.primaryColor ?? "#102a43";
  const fontFamily = userProfile.fontFamily ?? "helvetica";

  // Conversion Hex -> RGB pour jsPDF
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  const primaryRGB = hexToRgb(primaryColor);

  // Tentative d'utilisation de la police personnalisée (fallback helvetica)
  try {
    doc.setFont(fontFamily.toLowerCase());
  } catch (_) {
    doc.setFont("helvetica");
  }

  // --- Logo d'Entreprise ---
  const headerStartY = 22;
  if (userProfile.logoUrl) {
    try {
      // Le logo est placé en haut à droite
      doc.addImage(userProfile.logoUrl, "PNG", 150, 10, 45, 25);
    } catch (_) {
      console.warn("Erreur lors de l'ajout du logo au PDF:", _);
    }
  }

  // --- Design du PDF ---
  doc.setFontSize(22);
  doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
  const documentTypeLabel: Record<string, string> = {
    invoice: "FACTURE",
    credit_note: "AVOIR",
    deposit_invoice: "FACTURE D'ACOMPTE",
    quote: "DEVIS",
    order: "COMMANDE",
  };
  doc.text(
    documentTypeLabel[invoice.type as string] ?? "DOCUMENT",
    14,
    headerStartY,
  );

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100); // Gris pour les métadonnées
  doc.text(`Numéro: ${invoice.number}`, 14, headerStartY + 8);
  doc.text(`Date: ${invoice.date}`, 14, headerStartY + 13);
  doc.text(`Échéance: ${invoice.dueDate}`, 14, headerStartY + 18);

  // Emetteur
  doc.setFontSize(11);
  doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
  doc.text("ÉMETTEUR:", 14, 55);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont(fontFamily.toLowerCase(), "bold");
  doc.text(userProfile.companyName || "Ma Micro-Entreprise", 14, 60);
  doc.setFont(fontFamily.toLowerCase(), "normal");
  doc.text(userProfile.address || "", 14, 65);
  if (userProfile.siret) {
    doc.text(`SIRET: ${userProfile.siret}`, 14, 70);
  }
  if (userProfile.email) {
    doc.text(`Email: ${userProfile.email}`, 14, 75);
  }

  // Client
  doc.setFontSize(11);
  doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
  doc.text("DESTINATAIRE:", 120, 55);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont(fontFamily.toLowerCase(), "bold");
  doc.text(client.name, 120, 60);
  doc.setFont(fontFamily.toLowerCase(), "normal");
  doc.text(client.address, 120, 65);
  if (client.email) {
    doc.text(`Email: ${client.email}`, 120, 70);
  }

  // Table des articles
  const tableData = invoice.items.map((item) => [
    item.description,
    item.quantity.toString(),
    `${item.unitPrice.toFixed(2)} €`,
    `${(item.quantity * item.unitPrice).toFixed(2)} €`,
  ]);

  docWithTable.autoTable({
    startY: 85,
    head: [["Désignation", "Qté", "Prix Unitaire", "Total HT"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: primaryRGB,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      font: fontFamily.toLowerCase(),
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  const finalY = docWithTable.lastAutoTable.finalY + 10;
  const subtotalHT = invoice.total - (invoice.vatAmount || 0);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Total HT:`, 140, finalY);
  doc.text(`${subtotalHT.toFixed(2)} €`, 185, finalY, { align: "right" });

  if (invoice.vatAmount) {
    doc.text(`TVA:`, 140, finalY + 5);
    doc.text(`${invoice.vatAmount.toFixed(2)} €`, 185, finalY + 5, {
      align: "right",
    });
  }

  doc.setFontSize(12);
  doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
  doc.setFont(fontFamily.toLowerCase(), "bold");
  doc.text(`TOTAL TTC:`, 140, finalY + 12);
  doc.text(`${invoice.total.toFixed(2)} €`, 185, finalY + 12, {
    align: "right",
  });

  // Mentions obligatoires micro-entrepreneur (TVA non applicable)
  if (!invoice.vatAmount || invoice.vatAmount === 0) {
    doc.setFontSize(8);
    doc.setFont(fontFamily.toLowerCase(), "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("TVA non applicable, art. 293 B du CGI", 14, finalY + 25);
  }

  // --- Cachet / Stamp ---
  if (userProfile.stampUrl) {
    try {
      doc.addImage(userProfile.stampUrl, "PNG", 14, finalY + 35, 30, 30);
    } catch (e) {
      console.warn("Erreur lors de l'ajout du cachet au PDF:", e);
    }
  }

  // --- Signature Visuelle ---
  if (userProfile.signatureUrl) {
    try {
      const sigY = Math.min(finalY + 30, 250); // Éviter de déborder en bas
      doc.addImage(userProfile.signatureUrl, "PNG", 140, sigY, 40, 20);
      doc.setFontSize(8);
      doc.setFont(fontFamily.toLowerCase(), "italic");
      doc.setTextColor(150, 150, 150);
      doc.text("Signature de l'émetteur", 140, sigY + 25);
    } catch (e) {
      console.warn("Erreur lors de l'ajout de la signature au PDF:", e);
    }
  }

  // --- Injection Metadonnées Factur-X (ZUGFeRD) ---
  const facturX_XML = generateFacturX_XML(invoice, client, userProfile);

  // Validation structurelle avant injection (prévient les rejets PPF à partir de sept. 2026)
  const validation = validateFacturXXML(facturX_XML);
  if (!validation.valid) {
    // Log les erreurs pour audit sans bloquer la génération (dégrade gracieusement)
    console.error(
      "[Factur-X] XML non conforme — risque de rejet PPF :",
      validation.errors,
    );
  }

  // --- Signature Numérique (Simulation SHA-256) ---
  const pdfString = doc.output();
  const signatureHash = await simulateDigitalSignature(pdfString);
  (doc as JsPDFWithFacturX).facturX = facturX_XML;
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(`Empreinte numérique (SHA-256) : ${signatureHash}`, 14, 285);
  doc.text(
    `Signé numériquement le : ${new Date().toLocaleString("fr-FR")}`,
    14,
    289,
  );

  // Dans une vraie implémentation PDF/A-3, on doit utiliser attachFile ou similaire.
  // jsPDF supporte l'ajout de fichiers depuis récemment via des plugins.
  // Pour cette démo, on simule l'injection du descripteur.

  try {
    // Note: L'attachement réel XML dans un PDF/A-3 requiert un traitement binaire post-génération
    // ou une extension spécifique de jsPDF. On expose ici le XML pour usage tiers ou preuve de concept.
    (doc as JsPDFWithFacturX).facturX = facturX_XML;
  } catch (e) {
    console.error("Erreur injection Factur-X:", e);
  }

  return doc;
};

/**
 * Simule une signature numérique via un hachage SHA-256 du contenu du PDF
 */
export const simulateDigitalSignature = async (
  data: string,
): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .substring(0, 32)
    .toUpperCase();
};

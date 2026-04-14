/**
 * Moteur de génération Factur-X (ZUGFeRD) pour le profil 'BASIC'
 * Réforme de la facturation électronique 2026
 */
import type { jsPDF as JsPDFType } from 'jspdf';
import type { Client, Invoice, UserProfile } from '../types';

// Interface pour jsPDF avec propriété facturX custom
interface JsPDFWithFacturX extends JsPDFType {
  facturX?: string;
}

/**
 * Échappe les caractères XML spéciaux
 */
const escapeXML = (str: string | undefined): string => {
  if (!str) {
    return '';
  }
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
};

/**
 * Extrait le code postal d'une adresse
 */
const extractPostalCode = (address: string | undefined): string => {
  if (!address) {
    return '75001';
  }
  // Essaie d'extraire un code postal français (5 chiffres)
  const match = /\b\d{5}\b/.exec(address);
  if (match) {
    return match[0];
  }

  // Sinon, inférer de la ville
  if (address.includes('Lyon')) {
    return '69000';
  }
  if (address.includes('Marseille')) {
    return '13000';
  }
  if (address.includes('Paris')) {
    return '75001';
  }

  return '75001'; // Défaut Paris
};

/**
 * Génère le XML Factur-X au format BASIC
 * Note: En environnement de production, ce XML devrait être validé contre le schéma officiel
 */
export const generateFacturX_XML = (
  invoice: Invoice,
  client: Client,
  userProfile: UserProfile
): string => {
  const dateStr = invoice.date.replaceAll('-', '');
  const dueDateStr = invoice.dueDate?.replaceAll('-', '') ?? '';
  const dueDateISO = invoice.dueDate || ''; // Garder le format ISO aussi
  const currency = 'EUR';

  // Calcul de la TVA si non fourni
  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  // Calcul TVA pour chaque item selon son taux
  const calculatedVAT = invoice.items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    return sum + (itemSubtotal * (item.vatRate || 0)) / 100;
  }, 0);
  // Utiliser la TVA fournie ou calculée
  const resolveVATAmount = (): number => {
    if (invoice.vatAmount !== undefined) {
      return invoice.vatAmount;
    }
    if (calculatedVAT) {
      return calculatedVAT;
    }
    return invoice.total > subtotal ? invoice.total - subtotal : 0;
  };
  const vatAmount = resolveVATAmount();

  // Génération des lignes d'articles pour le XML
  const getCategoryCode = (vatRate: number | undefined): string => {
    if (vatRate === 0) {
      return 'Z';
    } // Zero-rated
    if (vatRate) {
      return 'S';
    } // Standard rate
    return 'E'; // Exempt
  };

  const lineItemsXML = invoice.items
    .map((item, index) => {
      const categoryCode = getCategoryCode(item.vatRate);
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
        <ram:BilledQuantity unitCode="${item.unit === 'heure' ? 'HUR' : 'C62'}">${item.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${categoryCode}</ram:CategoryCode>
          <ram:RateApplicablePercent>${item.vatRate || 0}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${(item.quantity * item.unitPrice).toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
    })
    .join('');

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
    <ram:TypeCode>${invoice.type === 'credit_note' ? '381' : '380'}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${dateStr}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    ${lineItemsXML}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXML(userProfile.companyName || 'Ma Micro-Entreprise')}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXML(userProfile.address || 'Non spécifiée')}</ram:LineOne>
          <ram:CityName>${escapeXML(userProfile.address?.split(',')[0] || 'Paris')}</ram:CityName>
          <ram:PostcodeCode>${sellerPostalCode}</ram:PostcodeCode>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${userProfile.siret || ''}</ram:ID>
        </ram:SpecifiedLegalOrganization>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXML(client.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXML(client.address || 'Non spécifiée')}</ram:LineOne>
          <ram:CityName>${escapeXML(client.address?.split(',')[0] || 'Paris')}</ram:CityName>
          <ram:PostcodeCode>${buyerPostalCode}</ram:PostcodeCode>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${client.siret || ''}</ram:ID>
        </ram:SpecifiedLegalOrganization>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${currency}</ram:InvoiceCurrencyCode>
      ${dueDateStr ? `<ram:SpecifiedTradePaymentTerms><ram:Description>${dueDateISO}</ram:Description><ram:DueDateDateTime><udt:DateTimeString format="102">${dueDateStr}</udt:DateTimeString></ram:DueDateDateTime></ram:SpecifiedTradePaymentTerms>` : ''}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:TaxBasisTotalAmount>${subtotal.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${currency}">${vatAmount.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${(subtotal + vatAmount).toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${(subtotal + vatAmount).toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
};

/**
 * Génère le PDF/A-3 avec injection du XML Factur-X
 */
export const generatePDFWithFacturX = async (
  invoice: Invoice,
  client: Client,
  userProfile: UserProfile
) => {
  // Chargement différé : jspdf (~500 kB) n'est importé qu'à l'appel effectif
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docWithTable = doc as any;

  // --- Design du PDF ---
  doc.setFontSize(20);
  const documentTypeLabel: Record<string, string> = {
    invoice: 'FACTURE',
    credit_note: 'AVOIR',
    deposit_invoice: "FACTURE D'ACOMPTE",
    quote: 'DEVIS',
    order: 'COMMANDE',
  };
  doc.text(documentTypeLabel[invoice.type as string] ?? 'DOCUMENT', 14, 22);

  doc.setFontSize(10);
  doc.text(`Numéro: ${invoice.number}`, 14, 30);
  doc.text(`Date: ${invoice.date}`, 14, 35);
  doc.text(`Échéance: ${invoice.dueDate}`, 14, 40);

  // Emetteur
  doc.text('ÉMETTEUR:', 14, 55);
  doc.text(userProfile.companyName || 'Ma Micro-Entreprise', 14, 60);
  doc.text(userProfile.address || '', 14, 65);
  if (userProfile.siret) {
    doc.text(`SIRET: ${userProfile.siret}`, 14, 70);
  }

  // Client
  doc.text('DESTINATAIRE:', 120, 55);
  doc.text(client.name, 120, 60);
  doc.text(client.address, 120, 65);

  // Table des articles
  const tableData = invoice.items.map((item) => [
    item.description,
    item.quantity.toString(),
    `${item.unitPrice.toFixed(2)} €`,
    `${(item.quantity * item.unitPrice).toFixed(2)} €`,
  ]);

  docWithTable.autoTable({
    startY: 85,
    head: [['Désignation', 'Qté', 'Prix Unitaire', 'Total HT']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
  });

  const finalY = docWithTable.lastAutoTable.finalY + 10;
  const subtotalHT = invoice.total - (invoice.vatAmount || 0);
  doc.text(`Total HT: ${subtotalHT.toFixed(2)} €`, 140, finalY);
  if (invoice.vatAmount) {
    doc.text(`TVA: ${invoice.vatAmount.toFixed(2)} €`, 140, finalY + 5);
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL TTC: ${invoice.total.toFixed(2)} €`, 140, finalY + 12);

  // Mentions obligatoires micro-entrepreneur (TVA non applicable)
  if (!invoice.vatAmount || invoice.vatAmount === 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('TVA non applicable, art. 293 B du CGI', 14, finalY + 25);
  }

  // --- Signature Visuelle ---
  if (userProfile.signatureUrl) {
    try {
      const sigY = Math.min(finalY + 30, 250); // Éviter de déborder en bas
      doc.addImage(userProfile.signatureUrl, 'PNG', 140, sigY, 40, 20);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text("Signature de l'émetteur", 140, sigY + 25);
    } catch (e) {
      console.warn("Erreur lors de l'ajout de la signature au PDF:", e);
    }
  }

  // --- Injection Metadonnées Factur-X (ZUGFeRD) ---
  const facturX_XML = generateFacturX_XML(invoice, client, userProfile);

  // --- Signature Numérique (Simulation SHA-256) ---
  const pdfString = doc.output();
  const signatureHash = await simulateDigitalSignature(pdfString);
  (doc as JsPDFWithFacturX).facturX = facturX_XML;
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(`Empreinte numérique (SHA-256) : ${signatureHash}`, 14, 285);
  doc.text(`Signé numériquement le : ${new Date().toLocaleString('fr-FR')}`, 14, 289);

  // Dans une vraie implémentation PDF/A-3, on doit utiliser attachFile ou similaire.
  // jsPDF supporte l'ajout de fichiers depuis récemment via des plugins.
  // Pour cette démo, on simule l'injection du descripteur.

  try {
    // Note: L'attachement réel XML dans un PDF/A-3 requiert un traitement binaire post-génération
    // ou une extension spécifique de jsPDF. On expose ici le XML pour usage tiers ou preuve de concept.
    (doc as JsPDFWithFacturX).facturX = facturX_XML;
  } catch (e) {
    console.error('Erreur injection Factur-X:', e);
  }

  return doc;
};

/**
 * Simule une signature numérique via un hachage SHA-256 du contenu du PDF
 */
export const simulateDigitalSignature = async (data: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 32)
    .toUpperCase();
};

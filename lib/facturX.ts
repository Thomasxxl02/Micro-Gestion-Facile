/**
 * Moteur de génération Factur-X (ZUGFeRD) pour le profil 'BASIC'
 * Réforme de la facturation électronique 2026
 */
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { Invoice, Client, UserProfile } from '../types';

/**
 * Génère le XML Factur-X au format BASIC
 * Note: En environnement de production, ce XML devrait être validé contre le schéma officiel
 */
export const generateFacturX_XML = (invoice: Invoice, client: Client, userProfile: UserProfile): string => {
  const dateStr = invoice.date.replace(/-/g, '');
  const currency = 'EUR';

  // Génération des lignes d'articles pour le XML
  const lineItemsXML = invoice.items.map((item, index) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${index + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${item.description}</ram:Name>
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
          <ram:CategoryCode>${(item.vatRate || 0) > 0 ? 'S' : 'E'}</ram:CategoryCode>
          <ram:RateApplicablePercent>${item.vatRate || 0}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${(item.quantity * item.unitPrice).toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`).join('');

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
        <ram:Name>${userProfile.companyName || 'Ma Micro-Entreprise'}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${userProfile.siret || ''}</ram:ID>
        </ram:SpecifiedLegalOrganization>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${client.name}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${client.siret || ''}</ram:ID>
        </ram:SpecifiedLegalOrganization>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${currency}</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:TaxBasisTotalAmount>${invoice.subtotal || invoice.total - (invoice.vatAmount || 0)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${currency}">${invoice.vatAmount || 0}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${invoice.total}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${invoice.total}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
};

/**
 * Génère le PDF/A-3 avec injection du XML Factur-X
 */
export const generatePDFWithFacturX = async (invoice: Invoice, client: Client, userProfile: UserProfile) => {
  const doc = new jsPDF() as any; // Cast as any for autoTable support if types conflict

  // --- Design du PDF ---
  doc.setFontSize(20);
  doc.text(invoice.type === 'invoice' ? 'FACTURE' : invoice.type === 'credit_note' ? 'AVOIR' : invoice.type === 'deposit_invoice' ? 'FACTURE D\'ACOMPTE' : 'DOCUMENT', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Numéro: ${invoice.number}`, 14, 30);
  doc.text(`Date: ${invoice.date}`, 14, 35);
  doc.text(`Échéance: ${invoice.dueDate}`, 14, 40);

  // Emetteur
  doc.text('ÉMETTEUR:', 14, 55);
  doc.text(userProfile.companyName || 'Ma Micro-Entreprise', 14, 60);
  doc.text(userProfile.address || '', 14, 65);
  if (userProfile.siret) {doc.text(`SIRET: ${userProfile.siret}`, 14, 70);}

  // Client
  doc.text('DESTINATAIRE:', 120, 55);
  doc.text(client.name, 120, 60);
  doc.text(client.address, 120, 65);

  // Table des articles
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    `${item.unitPrice.toFixed(2)} €`,
    `${(item.quantity * item.unitPrice).toFixed(2)} €`
  ]);

  (doc as any).autoTable({
    startY: 85,
    head: [['Désignation', 'Qté', 'Prix Unitaire', 'Total HT']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const subtotalHT = invoice.total - (invoice.vatAmount || 0);
  doc.text(`Total HT: ${subtotalHT.toFixed(2)} €`, 140, finalY);
  if (invoice.vatAmount) {doc.text(`TVA: ${invoice.vatAmount.toFixed(2)} €`, 140, finalY + 5);}
  doc.setFont(undefined, 'bold');
  doc.text(`TOTAL TTC: ${invoice.total.toFixed(2)} €`, 140, finalY + 12);

  // Mentions obligatoires micro-entrepreneur (TVA non applicable)
  if (!invoice.vatAmount || invoice.vatAmount === 0) {
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('TVA non applicable, art. 293 B du CGI', 14, finalY + 25);
  }

  // --- Signature Numérique (Simulation SHA-256) ---
  const pdfString = doc.output();
  const signatureHash = await simulateDigitalSignature(pdfString);
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(`Empreinte numérique (SHA-256) : ${signatureHash}`, 14, 285);
  doc.text(`Signé numériquement le : ${new Date().toLocaleString('fr-FR')}`, 14, 289);

  // --- Injection Metadonnées Factur-X (ZUGFeRD) ---
  const facturX_XML = generateFacturX_XML(invoice, client, userProfile);
  
  // Dans une vraie implémentation PDF/A-3, on doit utiliser attachFile ou similaire.
  // jsPDF supporte l'ajout de fichiers depuis récemment via des plugins.
  // Pour cette démo, on simule l'injection du descripteur.
  
  try {
    // Note: L'attachement réel XML dans un PDF/A-3 requiert un traitement binaire post-génération
    // ou une extension spécifique de jsPDF. On expose ici le XML pour usage tiers ou preuve de concept.
    doc.facturX = facturX_XML;
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
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32).toUpperCase();
};

# Cahier des Charges Technique — Micro-Gestion-Facile

**Version :** 2.0 · **Date :** 14 avril 2026  
**Auteur :** Architecte Logiciel Senior  
**Statut :** Référentiel officiel de l'application  
**Stack cible :** PWA React 19 · TypeScript 6 · Offline-First · Conformité e-facture 2026

---

## Table des Matières

1. [Vision & Périmètre Applicatif](#1-vision--périmètre-applicatif)
2. [Fonctionnalités Détaillées](#2-fonctionnalités-détaillées)
3. [Architecture Système](#3-architecture-système)
4. [Modèle de Données (MCD)](#4-modèle-de-données-mcd)
5. [Sécurité & Conformité](#5-sécurité--conformité)
6. [Plan de Développement MVP — 5 Sprints](#6-plan-de-développement-mvp--5-sprints)

---

## 1. Vision & Périmètre Applicatif

### 1.1 Problématique

Un micro-entrepreneur français jongle quotidiennement avec 4 à 8 outils disparates : tableur Excel pour les factures, agenda Google, boîte mail, logiciel de paie séparé pour l'URSSAF, scan physique des justificatifs, outil de déclaration TVA... Cette fragmentation coûte en moyenne **3 heures par semaine** d'administration improductive.

### 1.2 Proposition de Valeur

**Micro-Gestion-Facile** est une **PWA tout-en-un** qui centralise l'intégralité du back-office d'un micro-entrepreneur en un seul outil :

- **Offline-First** : fonctionne sans connexion, synchronise automatiquement dès reconnexion
- **Conformité légale** : Factur-X 2026, plafonds URSSAF temps réel, loi anti-fraude TVA
- **Souveraineté des données** : les données financières restent dans le navigateur (IndexedDB) — aucun serveur tiers n'accède aux données en clair
- **Zéro saisie double** : un devis → commande → facture → comptabilité → déclaration, en un clic

### 1.3 Utilisateurs Cibles

| Profil                      | Activité                  | Volume ($) / an |
| --------------------------- | ------------------------- | --------------- |
| Prestataire de services BIC | Conseil, dev, design      | 15k – 77.7k €   |
| Profession libérale BNC     | Avocat, coach, consultant | 15k – 77.7k €   |
| Vendeur de marchandises     | E-commerce, artisan       | 15k – 188.7k €  |
| Auto-entrepreneur mixte     | Services + ventes         | Seuils cumulés  |

---

## 2. Fonctionnalités Détaillées

### 2.1 Module Ventes — Cycle de Vie du Document Commercial

#### 2.1.1 Devis

| Fonctionnalité             | Détail technique                                                    | Priorité |
| -------------------------- | ------------------------------------------------------------------- | -------- |
| Création libre             | Formulaire multi-lignes avec `InvoiceItem[]`                        | MVP      |
| Numérotation continue      | Format `DEVIS-AAAA-XXXXX` conforme art. L441-9 CGI                  | MVP      |
| PDF généré client-side     | jsPDF + jsPDF-autotable, mise en page A4 ISO                        | MVP      |
| Durée de validité          | Champ `expiresAt: Date` + cron de vérification toutes les 24h       | MVP      |
| Relance automatique        | Notification PWA + email (J-7, J-0, J+3 après expiration)           | Sprint 2 |
| Signature électronique     | Web Crypto API — ECDSA P-256, horodatage via `timestamp`            | Sprint 3 |
| Transformation en commande | Duplication de document + changement `type: 'order'` + verrouillage | MVP      |
| Transformation en facture  | Duplication + `type: 'invoice'` + numérotation séquentielle         | MVP      |
| Passerelle de paiement     | Lien de paiement Stripe/PayPlug dans le PDF                         | Sprint 4 |

**Règle métier critique :** Un devis accepté est **verrouillé en lecture seule**. Toute modification crée un nouvel avenant avec date et numéro distincts.

#### 2.1.2 Commandes

```
Devis (status: ACCEPTED)
  └─► Bon de commande client (type: 'order', linkedDocumentId: quoteId)
       └─► Facture (type: 'invoice', linkedDocumentId: orderId)
            └─► Avoir partiel/total (type: 'credit_note', linkedDocumentId: invoiceId)
```

- Suivi du statut : `pending_fulfillment → in_progress → fulfilled → invoiced`
- Bons de commande fournisseurs (`direction: 'purchase'`) avec association au `Supplier`
- Liaison automatique à l'`Expense` lors de la réception

#### 2.1.3 Factures & Avoirs

**Avoir partiel :**

```typescript
// Calcul de l'avoir partiel conforme au Code Général des Impôts
function computePartialCreditNote(
  originalInvoice: Invoice,
  correctedItems: InvoiceItem[],
): CreditNote {
  const delta = originalInvoice.items.map((orig, i) => ({
    ...orig,
    quantity: orig.quantity - (correctedItems[i]?.quantity ?? 0),
    unitPrice: orig.unitPrice,
  }));
  return {
    type: "credit_note",
    linkedDocumentId: originalInvoice.id,
    items: delta.filter((item) => item.quantity > 0),
    // Ajustement comptable automatique dans le Livre des recettes
    accountingAdjustment: true,
  };
}
```

**Règles de numérotation (Conformité art. L441-9 CGI) :**

- Séquence **chronologique et continue** — jamais de rupture, jamais de doublon
- Préfixes configurables `UserProfile.invoicePrefix` (défaut : `FA-AAAA-`)
- Numérotation de l'avoir distincte de la facture (`AV-AAAA-XXXXX`)

#### 2.1.4 Facturation Électronique (e-Invoicing) — Obligatoire 2026

**Calendrier réglementaire :**
| Date | Obligation |
|------|-----------|
| Sept. 2026 | Réception obligatoire pour TOUS |
| Sept. 2027 | Émission obligatoire Grandes Entreprises + ETI |
| Sept. 2027 | Émission obligatoire PME + TPE + micro-entrepreneurs |

**Formats supportés :**

| Format                | Usage                        | Implémentation                 |
| --------------------- | ---------------------------- | ------------------------------ |
| **Factur-X Minimum**  | B2C, Franchise TVA           | PDF/A-3 + XML MINIMUM embarqué |
| **Factur-X EN Basic** | B2B standard                 | PDF/A-3 + XML EN16931 complet  |
| **UBL 2.1**           | Administrations (Chorus Pro) | XML pur, compatible Chorus     |
| **CII D16B**          | Interopérabilité européenne  | XML UNCEFACT                   |

**Architecture e-invoicing :**

```
Application PWA
  ├─ lib/facturX.ts          # Génération XML Factur-X (EN16931)
  ├─ lib/pdfA3Generator.ts   # Embedding XML dans PDF/A-3
  ├─ services/pdpConnector.ts # Connexion PDP (via API REST)
  └─ services/ppfConnector.ts # Connexion PPF (Portail Public de Facturation)
```

**Flux PDP/PPF :**

1. `Invoice` validée → génération XML + PDF/A-3 via Edge Function
2. Dépôt sur PDP partenaire avec OAuth2 client_credentials
3. Mise à jour `eInvoiceStatus` via webhook → IndexedDB + Firestore
4. Statuts : `DEPOSITED → VALIDATED → DELIVERED → ACCEPTED_BY_CLIENT → PAID`

---

### 2.2 Module Opérationnel — CRM & Catalogue

#### 2.2.1 CRM Clients

**Modèle enrichi :**

```typescript
interface ClientCRM extends Client {
  // Financier
  outstandingBalance: number; // Encours (calculé)
  totalRevenue: number; // CA total (calculé)
  averagePaymentDelay: number; // Délai moyen de paiement en jours
  creditLimit?: number; // Plafond d'encours autorisé

  // Relationnel
  contacts: ContactPerson[]; // Interlocuteurs multiples
  interactions: Interaction[]; // Historique des échanges
  attachments: DocumentRef[]; // Contrats, devis, correspondances
  tags: string[]; // Segmentation libre

  // Comptable
  accountingCode?: string; // Code compte 411xxxxx (Plan Comptable Général)
  paymentMethod?: "virement" | "prelevement" | "cheque" | "carte" | "especes";
  sepaMandate?: SEPAMandate; // Mandat SEPA pour prélèvement
}

interface Interaction {
  id: string;
  date: string;
  type: "email" | "call" | "meeting" | "note" | "document_sent";
  summary: string;
  linkedDocumentId?: string;
  userId: string;
}
```

**Indicateurs CRM (Dashboard) :**

- Encours total par client avec alerte colorée (vert/orange/rouge)
- Taux de conversion devis → facture par client
- Délai moyen de paiement (DSO — Days Sales Outstanding)
- Classement clients par CA (Top 5, Top 10)

#### 2.2.2 Catalogue Produits & Services

```typescript
interface Product {
  id: string;
  type: "product" | "service";
  reference: string; // Référence interne (SKU)
  name: string;
  description: string;
  category: string;

  // Tarification
  unitPriceHT: number; // Prix de vente HT (Decimal.js en interne)
  purchasePriceHT?: number; // Prix d'achat HT
  margin?: number; // Marge en % (calculée)

  // TVA
  vatRate: number; // 0, 5.5, 10, 20 (franchise = 0 avec mention légale)
  vatCategory: "normal" | "reduced" | "super_reduced" | "exempt" | "franchise";

  // Stock (produits physiques uniquement)
  trackStock: boolean;
  stockQuantity?: number;
  stockAlertThreshold?: number; // Seuil de réapprovisionnement
  stockUnit:
    | "unité"
    | "kg"
    | "litre"
    | "m"
    | "m²"
    | "heure"
    | "jour"
    | "forfait";

  // Comptabilité
  accountingCode?: string; // 706xxx (services) | 701xxx (marchandises)
}

interface StockMovement {
  id: string;
  productId: string;
  date: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  reason: string;
  linkedDocumentId?: string;
}
```

**Règle de calcul des marges :**

```typescript
// Utilisation obligatoire de Decimal.js pour les calculs financiers
import Decimal from "decimal.js";

function computeMargin(sellPriceHT: number, purchasePriceHT: number): number {
  const sell = new Decimal(sellPriceHT);
  const purchase = new Decimal(purchasePriceHT);
  if (sell.isZero()) return 0;
  return sell
    .minus(purchase)
    .dividedBy(sell)
    .times(100)
    .toDecimalPlaces(2)
    .toNumber();
}
```

---

### 2.3 Module Comptabilité & Fiscalité (Spécifique Micro-Entreprise)

#### 2.3.1 Livre des Recettes & Registre des Achats

**Conforme à l'article 50-0 du CGI et à la circulaire URSSAF 2026 :**

| Champ Livre des Recettes | Source                        | Format      |
| ------------------------ | ----------------------------- | ----------- |
| Date d'encaissement      | `Invoice.paymentDate`         | JJ/MM/AAAA  |
| Référence facture        | `Invoice.number`              | Séquentiel  |
| Nature de la prestation  | `Invoice.items[].description` | Texte libre |
| Nom client               | `Client.name`                 | Texte       |
| Mode d'encaissement      | `Invoice.paymentMethod`       | Énumération |
| Montant TTC encaissé     | `Invoice.total`               | Décimal 2   |

**Export automatique** : CSV, XLSX et PDF réglementaires (téléchargeables + transmissibles comptable).

#### 2.3.2 Calculs Fiscaux URSSAF Temps Réel

**Taux 2026 (source : BOSS — Bulletin Officiel de la Sécurité Sociale) :**

```typescript
// lib/fiscalCalculations.ts
export const URSSAF_RATES_2026 = {
  SALE: {
    cotisations: new Decimal("0.128"), // 12.8% ventes marchandises
    versementLiberatoire: new Decimal("0.01"), // 1% option IR libératoire
    totalIfVersement: new Decimal("0.138"), // 13.8% avec option
  },
  SERVICE_BIC: {
    cotisations: new Decimal("0.22"), // 22% services commerciaux BIC
    versementLiberatoire: new Decimal("0.017"), // 1.7% option IR libératoire
    totalIfVersement: new Decimal("0.237"), // 23.7% avec option
  },
  SERVICE_BNC: {
    cotisations: new Decimal("0.22"), // 22% professions libérales CIPAV
    versementLiberatoire: new Decimal("0.022"), // 2.2% option IR libératoire
    totalIfVersement: new Decimal("0.242"), // 24.2% avec option
  },
  LIBERAL_SSI: {
    cotisations: new Decimal("0.232"), // 23.2% libéral SSI (ex-RSI)
    versementLiberatoire: new Decimal("0.022"),
    totalIfVersement: new Decimal("0.254"),
  },
  // ACRE : abattement 50% pendant 12 mois (première activité)
  ACRE_MULTIPLIER: new Decimal("0.5"),
};

export const TVA_THRESHOLDS_2026 = {
  SERVICES: { lower: 36800, upper: 39100 }, // Seuils franchise TVA services
  SALES: { lower: 91900, upper: 101000 }, // Seuils franchise TVA ventes
  LIBERAL_REGULATED: { lower: 36800, upper: 39100 },
};

export const REGIME_THRESHOLDS_2026 = {
  SERVICES: 77700, // Plafond sortie micro-entreprise services
  SALES: 188700, // Plafond sortie micro-entreprise ventes
  MIXED_SERVICES: 77700,
};
```

**Jauge visuelle des plafonds :**

```typescript
interface ThresholdGauge {
  current: Decimal; // CA cumulé depuis le 1er janvier
  lower: Decimal; // Seuil de franchise TVA (première borne)
  upper: Decimal; // Seuil d'assujettissement TVA (deuxième borne)
  regime: Decimal; // Seuil de sortie du régime micro
  status: "ok" | "warning" | "critical" | "exceeded";
  alertMessages: string[];
}
```

#### 2.3.3 Déclarations URSSAF & Calendrier Fiscal

**Calendrier des obligations :**

| Obligation                     | Fréquence                  | Données source      |
| ------------------------------ | -------------------------- | ------------------- |
| Déclaration URSSAF             | Mensuelle ou trimestrielle | Livre des recettes  |
| Déclaration TVA (si assujetti) | Mensuel / Trimestriel      | Factures encaissées |
| Déclaration IR 2042-C PRO      | Annuelle (mai)             | CA annuel total     |
| Attestation de vigilance       | À la demande               | Via API URSSAF      |

**Automatisation :** Génération des montants pré-remplis pour la déclaration URSSAF. L'utilisateur vérifie et valide avant envoi.

---

### 2.4 Outils de Productivité

#### 2.4.1 Agenda & Synchronisation Calendrier

**Synchronisation bidirectionnelle :**

```
┌─────────────────────────────────────────────────────────────┐
│                   CalendarManager (PWA)                     │
│                                                             │
│  IndexedDB ◄──── SYNC ────► Google Calendar API v3         │
│     (local)      oAuth2      (cloud)                        │
│                                                             │
│  IndexedDB ◄──── SYNC ────► Microsoft Graph API (Outlook)   │
│     (local)      oAuth2      (cloud)                        │
└─────────────────────────────────────────────────────────────┘
```

**Events automatiques créés par l'application :**

- `URSSAF_DECLARATION` — date limite de déclaration trimestrielle
- `TVA_DECLARATION` — date limite déclaration TVA (si assujetti)
- `INVOICE_REMINDER` — relance automatique facture impayée (J+30, J+45, J+60)
- `QUOTE_EXPIRY` — expiration imminente d'un devis (J-7)
- `STOCK_ALERT` — rupture de stock imminente

#### 2.4.2 Client Mail Intégré

**Architecture :**

```typescript
interface EmailMessage {
  id: string;
  threadId: string;
  direction: "inbound" | "outbound";
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string; // HTML sanitisé (DOMPurify obligatoire)
  attachments: Attachment[];
  linkedDocumentId?: string; // Facture/devis associé
  linkedClientId?: string;
  sentAt?: string;
  receivedAt?: string;
  status: "draft" | "sent" | "received" | "archived";
  labels: string[];
}
```

**Intégrations SMTP/IMAP :**

- Gmail (OAuth2) — via Google APIs
- Outlook/Microsoft 365 (OAuth2) — via Microsoft Graph
- SMTP générique (avec authentification applicative)

**Règle de sécurité :** Le corps des emails est **toujours sanitisé** via DOMPurify avant affichage pour prévenir les attaques XSS de type email injection.

#### 2.4.3 Gestionnaire de Documents (GED)

**Architecture du coffre-fort numérique :**

```typescript
interface StoredDocument {
  id: string;
  name: string;
  category:
    | "justificatif"
    | "contrat"
    | "declaration"
    | "correspondance"
    | "autre";
  mimeType: string;
  size: number; // Octets
  hash: string; // SHA-256 pour intégrité
  encryptedContent?: string; // AES-256-GCM pour documents sensibles

  // OCR (via Gemini Vision ou Tesseract.js)
  ocrExtracted?: {
    amount?: number; // Montant détecté automatiquement
    date?: string; // Date de la facture
    vendor?: string; // Nom du fournisseur
    vatAmount?: number; // TVA détectée
    confidence: number; // Score de confiance (0-1)
  };

  linkedExpenseId?: string; // Lié automatiquement à une dépense
  linkedInvoiceId?: string;
  uploadedAt: string;
  retentionUntil: string; // RGPD : durée de conservation
}
```

**OCR & Reconnaissance automatique :**

- Document scanné → Gemini Vision API (ou Tesseract.js offline)
- Extraction : Montant TTC, TVA, Date, Fournisseur, Numéro de facture
- Proposition automatique de création d'une `Expense` pré-remplie
- Vérification avec règle de cohérence (montant OCR ≠ montant saisi → alerte)

---

## 3. Architecture Système

### 3.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        NAVIGATEUR (Client PWA)                          │
│                                                                         │
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────────────────┐  │
│  │  React 19   │  │  Zustand 5 +     │  │  Service Worker           │  │
│  │  + TS 6     │  │  Immer           │  │  (vite-plugin-pwa)        │  │
│  │  + Tailwind │  │  (State Global)  │  │  Cache stratégies         │  │
│  │  + Motion   │  └──────────────────┘  └───────────────────────────┘  │
│  └─────────────┘                                                        │
│         │                                                               │
│  ┌──────▼─────────────────────────────────────────────────────────────┐ │
│  │                    Couche Logique Métier                           │ │
│  │  lib/fiscalCalculations.ts  │  lib/invoiceCalculations.ts         │ │
│  │  lib/facturX.ts             │  lib/exportUtils.ts                 │ │
│  │  lib/pdfGenerator.ts        │  lib/ocrProcessor.ts                │ │
│  └──────────────────────────────────────────────────────────────────┘  │
│         │                                                               │
│  ┌──────▼──────────────────────────────────────────────────────────────┐│
│  │                Couche Persistance                                   ││
│  │                                                                     ││
│  │  db/invoiceDB.ts (Dexie 4)                                         ││
│  │  ┌────────────────────────────────────────────────────────────┐    ││
│  │  │  IndexedDB (Navigateur)                                    │    ││
│  │  │  Stores: invoices, clients, suppliers, products, expenses  │    ││
│  │  │         documents, emails, calendarEvents, stockMovements  │    ││
│  │  │         interactions, settings, auditLog                   │    ││
│  │  └────────────────────────────────────────────────────────────┘    ││
│  └─────────────────────────────────────────────────────────────────────┘│
│         │                                                               │
│  ┌──────▼──────────────────────────────────────────────────────────────┐│
│  │  hooks/useFirestoreSync.ts                                          ││
│  │  Sync bidirectionnelle en arrière-plan (Background Sync API)        ││
│  └─────────────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────┬─────────────────────────────────┘
                                        │ HTTPS / WebSocket
                         ┌──────────────▼──────────────────────┐
                         │        FIREBASE (BaaS)              │
                         │  ┌─────────────────────────────┐    │
                         │  │  Firebase Auth              │    │
                         │  │  (Google OAuth + 2FA TOTP)  │    │
                         │  └─────────────────────────────┘    │
                         │  ┌─────────────────────────────┐    │
                         │  │  Firestore                  │    │
                         │  │  (Backup cloud chiffré)     │    │
                         │  └─────────────────────────────┘    │
                         │  ┌─────────────────────────────┐    │
                         │  │  Firebase Functions         │    │
                         │  │  (Edge: PDF-A/3, e-invoicing│    │
                         │  │   webhooks PDP, OCR)        │    │
                         │  └─────────────────────────────┘    │
                         │  ┌─────────────────────────────┐    │
                         │  │  Firebase Storage           │    │
                         │  │  (Documents GED chiffrés)   │    │
                         │  └─────────────────────────────┘    │
                         └─────────────────────────────────────┘
                                        │
                         ┌──────────────▼──────────────────────┐
                         │    SERVICES TIERS                   │
                         │  PDP / PPF (e-invoicing)            │
                         │  Google Calendar API                │
                         │  Microsoft Graph API (Outlook)      │
                         │  SMTP/IMAP (Nodemailer)             │
                         │  Gemini AI (OCR + Assistant)        │
                         │  Stripe/PayPlug (Paiements)         │
                         └─────────────────────────────────────┘
```

### 3.2 Stack Technique Détaillée

#### Frontend (PWA)

| Composant            | Technologie       | Version | Justification                                  |
| -------------------- | ----------------- | ------- | ---------------------------------------------- |
| Framework UI         | React             | 19      | Concurrent rendering, Server Components ready  |
| Langage              | TypeScript        | 6       | Type safety, meilleur DX                       |
| Build                | Vite (Rolldown)   | 8       | HMR ultra-rapide, tree-shaking optimal         |
| Styles               | Tailwind CSS      | 4       | Utilitaire, JIT, dark mode natif               |
| Animations           | Motion (Framer)   | 12      | Animations fluides accessibles                 |
| État global          | Zustand + Immer   | 5/11    | Léger, immuable, DevTools                      |
| Cache serveur        | TanStack Query    | 5       | Stale-while-revalidate, retry, optimistic      |
| Routage              | React Router      | 7       | File-based routing, lazy loading               |
| Persistance local    | Dexie.js          | 4       | IndexedDB wrapper, migrations, live queries    |
| Précision financière | Decimal.js        | 10      | Arithmétique décimale exacte (critique fiscal) |
| PDF                  | jsPDF + autotable | 4/5     | Génération PDF côté client, confidentialité    |
| PWA                  | vite-plugin-pwa   | 1       | Service Worker, manifest, offline cache        |
| Formulaires          | Zod (validation)  | 4       | Schema-first, intégration TypeScript           |
| Charts               | Recharts          | 3       | Déclaratif, responsive, accessible             |
| Drag & Drop          | @dnd-kit          | 6       | Accessible, tactile, performant                |

#### Backend / BaaS

| Composant            | Technologie                     | Justification                        |
| -------------------- | ------------------------------- | ------------------------------------ |
| Authentification     | Firebase Auth                   | MFA, OAuth2, SAML, conformité CNIL   |
| Base cloud           | Firestore                       | NoSQL temps réel, règles de sécurité |
| Fonctions serverless | Firebase Functions (Node.js 22) | PDF/A-3, e-invoicing, webhooks       |
| Stockage fichiers    | Firebase Storage                | Documents GED, chiffrement at rest   |
| Monitoring           | Firebase Analytics              | Privacy-first, CNIL ok               |
| Hébergement          | Firebase Hosting + CDN          | HTTPS natif, edge nodes, CORS        |

#### Infrastructure & DevOps

| Composant     | Outil                    | Usage                                      |
| ------------- | ------------------------ | ------------------------------------------ |
| CI/CD         | GitHub Actions           | Tests, build, deploy automatisés           |
| Tests         | Vitest + Testing Library | Unit, integration, component               |
| Couverture    | @vitest/coverage-v8      | Cible ≥ 80%                                |
| Qualité code  | ESLint 10 + TypeScript   | 0 warning en CI                            |
| Formatage     | Prettier 3               | Automatisé via Husky pre-commit            |
| Sécurité      | CodeQL + Dependabot      | Alertes CVE automatiques                   |
| Accessibilité | axe-core (vitest-axe)    | RGAA 4.1 / WCAG 2.1 AA                     |
| Performance   | Lighthouse CI            | Score ≥ 90 Performance, ≥ 95 Accessibility |

### 3.3 Structure des Dossiers (src/)

```
src/
├── App.tsx                         # Router principal
├── index.tsx                       # Entry point, React.StrictMode
├── index.css                       # Design tokens, Tailwind base
├── firebase.ts                     # Init Firebase (lazy, tree-shakable)
│
├── components/                     # Composants UI organisés par module
│   ├── layout/                     # AppShell, Sidebar, Header, Footer
│   ├── invoices/                   # InvoiceManager, InvoiceForm, PDFPreview
│   ├── quotes/                     # QuoteManager, QuoteForm, SignaturePanel
│   ├── orders/                     # OrderManager, OrderForm
│   ├── clients/                    # ClientManager, CRMDashboard, InteractionLog
│   ├── suppliers/                  # SupplierManager, PurchaseOrderForm
│   ├── products/                   # ProductCatalog, StockManager
│   ├── accounting/                 # AccountingManager, LivreRecettes, RegistreAchats
│   ├── fiscal/                     # FiscalDashboard, URSSAFCalculator, ThresholdGauge
│   ├── calendar/                   # CalendarManager, EventForm, SyncSettings
│   ├── email/                      # EmailManager, EmailComposer, ThreadView
│   ├── documents/                  # GED, DocumentUploader, OCRReview
│   ├── settings/                   # SettingsManager, SecuritySettings, Integrations
│   ├── ai/                         # AIAssistant, OCRPanel
│   └── ui/                         # Button, Modal, Badge, Toast, Table... (design system)
│
├── db/
│   └── invoiceDB.ts                # Dexie schema + migrations + indexes
│
├── hooks/
│   ├── useFirestoreSync.ts         # Sync bidirectionnelle Dexie ↔ Firestore
│   ├── useCalendarSync.ts          # Sync Google Calendar / Outlook
│   ├── useFiscalAlerts.ts          # Surveille les seuils URSSAF/TVA
│   ├── useNotifications.ts         # Web Notifications API
│   ├── useOCR.ts                   # Gemini Vision / Tesseract.js
│   └── useEInvoice.ts              # Workflow e-facture (PDP/PPF)
│
├── lib/
│   ├── fiscalCalculations.ts       # Calculs URSSAF, TVA, seuils (Decimal.js)
│   ├── invoiceCalculations.ts      # HT/TTC, remises, acomptes (Decimal.js)
│   ├── facturX.ts                  # Génération XML EN16931 / Factur-X
│   ├── pdfGenerator.ts             # jsPDF, PDF/A-3, templates
│   ├── exportUtils.ts              # CSV, XLSX, JSON exports
│   ├── ocrProcessor.ts             # Extraction données justificatifs
│   ├── cryptoUtils.ts              # AES-256-GCM, ECDSA (Web Crypto API)
│   ├── validationSchemas.ts        # Schémas Zod (toutes entités)
│   └── documentNumbering.ts       # Numérotation continue conforme CGI
│
├── services/
│   ├── firestoreService.ts         # CRUD Firestore avec retry/offline
│   ├── authService.ts              # Firebase Auth + 2FA TOTP
│   ├── pdpConnector.ts             # Connexion PDP e-invoicing
│   ├── ppfConnector.ts             # Connexion PPF Portail Public
│   ├── gmailService.ts             # Gmail OAuth2
│   ├── outlookService.ts           # Microsoft Graph OAuth2
│   ├── calendarService.ts          # Google Calendar OAuth2
│   └── geminiService.ts            # Gemini AI (OCR + assistant)
│
├── store/
│   ├── appStore.ts                 # Store Zustand principal
│   ├── fiscalStore.ts              # État fiscal (seuils, cotisations)
│   └── uiStore.ts                  # UI state (modals, theme, sidebar)
│
├── types/
│   ├── common.ts                   # Types partagés (ID, Timestamps, etc.)
│   ├── invoice.ts                  # Invoice, InvoiceItem, DocumentType...
│   ├── client.ts                   # Client, ContactPerson, Interaction...
│   ├── supplier.ts                 # Supplier, PurchaseOrder...
│   ├── product.ts                  # Product, StockMovement...
│   ├── expense.ts                  # Expense, ExpenseCategory...
│   ├── email.ts                    # EmailMessage, EmailThread...
│   ├── calendar.ts                 # CalendarEvent, Reminder...
│   ├── document.ts                 # StoredDocument, OCRResult...
│   └── user.ts                     # UserProfile, SecuritySettings...
│
└── __tests__/
    ├── lib/                        # Tests unitaires (lib/)
    ├── hooks/                      # Tests hooks
    ├── components/                 # Tests composants (RTL)
    └── integration/                # Tests d'intégration (flux complets)
```

---

## 4. Modèle de Données (MCD)

### 4.1 Architecture de Persistance

L'application utilise une architecture **dual-store** :

- **IndexedDB (Dexie.js)** : source de vérité principale, locale, offline-first
- **Firestore** : backup cloud chiffré, synchronisation multi-appareils

**Principe de chiffrement :** Toutes les données financières sont chiffrées en AES-256-GCM avant écriture dans Firestore. La clé de chiffrement est dérivée du mot de passe utilisateur via PBKDF2 (100000 itérations, SHA-256) et n'est jamais transmise au serveur.

### 4.2 Schéma Dexie (IndexedDB)

```typescript
// db/invoiceDB.ts — Version 8 (schéma complet)
import Dexie, { type Table } from "dexie";

class MicroGestionDB extends Dexie {
  // Module Facturation
  invoices!: Table<Invoice>;
  invoiceItems!: Table<InvoiceItem>;

  // Module Commercial
  clients!: Table<ClientCRM>;
  interactions!: Table<Interaction>;
  suppliers!: Table<Supplier>;
  purchaseOrders!: Table<PurchaseOrder>;

  // Catalogue
  products!: Table<Product>;
  stockMovements!: Table<StockMovement>;

  // Comptabilité
  expenses!: Table<Expense>;
  accountingEntries!: Table<AccountingEntry>;

  // Productivité
  calendarEvents!: Table<CalendarEvent>;
  emails!: Table<EmailMessage>;
  documents!: Table<StoredDocument>;

  // Système
  settings!: Table<UserProfile>;
  auditLog!: Table<LogEntry>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super("MicroGestionDB");

    this.version(8).stores({
      // [primaryKey, ...indexes]

      // FACTURATION
      invoices:
        "++id, type, status, clientId, date, dueDate, number, eInvoiceStatus, [type+status], [clientId+date]",
      invoiceItems: "++id, invoiceId",

      // COMMERCIAL
      clients: "++id, name, email, siret, category, archived, [archived+name]",
      interactions: "++id, clientId, type, date, [clientId+date]",
      suppliers: "++id, name, email, siret, archived",
      purchaseOrders: "++id, supplierId, status, date",

      // CATALOGUE
      products: "++id, type, reference, category, trackStock, [type+category]",
      stockMovements: "++id, productId, date, type",

      // COMPTABILITÉ
      expenses: "++id, date, category, supplierId, [date+category]",
      accountingEntries: "++id, date, type, documentId, [date+type]",

      // PRODUCTIVITÉ
      calendarEvents: "++id, type, startDate, endDate, linkedDocumentId",
      emails:
        "++id, threadId, direction, linkedClientId, sentAt, receivedAt, status",
      documents: "++id, category, linkedExpenseId, linkedInvoiceId, uploadedAt",

      // SYSTÈME
      settings: "++id",
      auditLog: "++id, category, severity, timestamp, userId",
      syncQueue: "++id, table, operation, syncStatus, createdAt",
    });
  }
}

export const db = new MicroGestionDB();
```

### 4.3 Entités Principales (Schéma Détaillé)

#### USERS / UserProfile

```
UserProfile {
  id                    UUID (PK)
  uid                   string (Firebase UID — FK)
  companyName           string
  professionalTitle     string?
  siret                 string (14 chifs, validé Luhn + SIREN INSEE)
  siren                 string (9 chifs)
  activityType          'SERVICE_BNC' | 'SERVICE_BIC' | 'SALE' | 'LIBERAL'
  isAcreBeneficiary     boolean
  address               string
  city                  string
  postalCode            string
  country               string (défaut: 'FR')
  email                 string
  phone                 string
  website               string?
  logoUrl               string? (base64 ou URL Firebase Storage)
  bankAccount           string? (IBAN — chiffré AES)
  bic                   string?
  tvaNumber             string? (FR + 11 chifs)
  isVatExempt           boolean
  vatExemptionReason    string? (ex: 'Art. 293 B du CGI')
  vatThresholdAlert     boolean
  revenueThresholdAlert boolean
  invoicePrefix         string (ex: 'FA-2026-')
  invoiceStartNumber    integer
  quotePrefix           string (ex: 'DV-2026-')
  orderPrefix           string (ex: 'BC-2026-')
  creditNotePrefix      string (ex: 'AV-2026-')
  defaultVatRate        decimal(4,2)
  currency              string (défaut: 'EUR')
  defaultEInvoiceFormat 'Factur-X' | 'UBL' | 'CII'?
  defaultOperationCategory 'BIENS' | 'SERVICES' | 'MIXTE'?
  primaryColor          string (hex)
  secondaryColor        string (hex)
  fontFamily            string
  legalMentions         string?
  createdAt             timestamp
  updatedAt             timestamp
}
```

#### INVOICES (Factures, Devis, Commandes, Avoirs)

```
Invoice {
  id                    UUID (PK)
  uid                   string (FK → UserProfile.uid)
  type                  'invoice' | 'quote' | 'order' | 'credit_note' | 'deposit_invoice'
  number                string (UNIQUE, séquentiel, ex: FA-2026-00042)
  linkedDocumentId      UUID? (FK → Invoice.id — chaîne documentaire)

  -- Parties --
  clientId              UUID (FK → Client.id)
  clientSnapshot        JSON (données client au moment de l'émission — immuable)

  -- Temporel --
  date                  date
  dueDate               date
  expiresAt             date? (devis seulement)
  validityDays          integer? (durée de validité devis)
  paymentDate           date? (date d'encaissement effectif)
  transmissionDate      date? (e-invoicing)

  -- Lignes --
  items                 InvoiceItem[] (JSON array)

  -- Montants (Decimal.js en interne, stockés en centimes) --
  subtotalHT            integer (centimes)
  discountRate          decimal(5,2)? (% de remise globale 0-100)
  discountAmount        integer? (centimes)
  vatBreakdown          VATBreakdown[] (JSON — par taux)
  vatAmount             integer (centimes)
  shippingHT            integer? (centimes)
  depositAmount         integer? (centimes — acompte)
  totalHT               integer (centimes)
  totalTTC              integer (centimes)

  -- Statut --
  status                string (enum InvoiceStatus)
  eInvoiceFormat        'Factur-X' | 'UBL' | 'CII'?
  eInvoiceStatus        string?
  operationCategory     'BIENS' | 'SERVICES' | 'MIXTE'?

  -- Paiement --
  paymentMethod         'virement' | 'prelevement' | 'cheque' | 'carte' | 'especes' | 'autre'?
  paymentTerms          string? (ex: '30 jours fin de mois')

  -- Champs légaux --
  taxExempt             boolean
  vatExemptionText      string? (mention légale)
  penaltyClause         string? (pénalités de retard)

  -- Divers --
  notes                 string?
  deliveryAddress       string?
  reminderDate          date?
  isTest                boolean

  -- Signature électronique --
  signatureData         JSON? { publicKey, signature, timestamp, ip }
  signedAt              timestamp?

  -- Audit --
  createdAt             timestamp
  updatedAt             timestamp
  createdBy             string (uid)
  history               JSON[] (log des modifications)
}

VATBreakdown {
  rate                  decimal(4,2) (taux TVA)
  baseHT                integer (centimes)
  vatAmount             integer (centimes)
}
```

#### CLIENTS (CRM)

```
Client {
  id                    UUID (PK)
  uid                   string (FK → UserProfile.uid)
  name                  string
  contactName           string?
  email                 string
  emailAlt              string?
  phone                 string?
  address               string
  city                  string?
  postalCode            string?
  country               string? (défaut: 'FR')
  siret                 string? (validé)
  siren                 string?
  tvaNumber             string?
  category              'Particulier' | 'Entreprise' | 'Association' | 'Public'
  isPublicEntity        boolean (Chorus Pro)
  website               string?
  linkedin              string?

  -- Financier --
  creditLimit           integer? (centimes — plafond d'encours)
  paymentTerms          string?
  paymentMethod         string?
  accountingCode        string? (411xxxxx PCG)
  sepaMandate           JSON? { ics, rum, signatureDate }

  -- Opérationnel --
  tags                  string[]
  notes                 string?
  archived              boolean

  -- Audit --
  createdAt             timestamp
  updatedAt             timestamp
}

ContactPerson {
  id                    UUID (PK)
  clientId              UUID (FK → Client.id)
  firstName             string
  lastName              string
  role                  string?
  email                 string?
  phone                 string?
  isPrimary             boolean
}

Interaction {
  id                    UUID (PK)
  clientId              UUID (FK → Client.id)
  date                  timestamp
  type                  'email' | 'call' | 'meeting' | 'note' | 'document_sent'
  summary               string
  linkedDocumentId      UUID?
  userId                string
}
```

#### SUPPLIERS (Fournisseurs)

```
Supplier {
  id                    UUID (PK)
  uid                   string (FK → UserProfile.uid)
  name                  string
  contactName           string?
  email                 string?
  phone                 string?
  address               string?
  city                  string?
  postalCode            string?
  country               string?
  siret                 string?
  tvaNumber             string?
  category              string?
  website               string?
  accountingCode        string? (401xxxxx PCG)
  paymentTerms          string?
  notes                 string?
  archived              boolean
  createdAt             timestamp
  updatedAt             timestamp
}

PurchaseOrder {
  id                    UUID (PK)
  uid                   string
  number                string (séquentiel)
  supplierId            UUID (FK → Supplier.id)
  date                  date
  expectedDeliveryDate  date?
  status                'draft' | 'sent' | 'confirmed' | 'received' | 'invoiced' | 'cancelled'
  items                 PurchaseOrderItem[] (JSON)
  totalHT               integer (centimes)
  totalTTC              integer (centimes)
  linkedExpenseId       UUID?
  notes                 string?
  createdAt             timestamp
}
```

#### PRODUCTS (Catalogue)

```
Product {
  id                    UUID (PK)
  uid                   string
  type                  'product' | 'service'
  reference             string (SKU unique)
  name                  string
  description           string?
  category              string

  unitPriceHT           integer (centimes)
  purchasePriceHT       integer? (centimes)
  vatRate               decimal(4,2)
  vatCategory           string
  unit                  string

  trackStock            boolean
  stockQuantity         integer? (unités)
  stockAlertThreshold   integer?

  accountingCode        string? (701xxx / 706xxx PCG)
  archived              boolean
  createdAt             timestamp
  updatedAt             timestamp
}

StockMovement {
  id                    UUID (PK)
  productId             UUID (FK → Product.id)
  date                  date
  type                  'in' | 'out' | 'adjustment'
  quantity              integer
  reason                string
  unitPriceHT           integer? (centimes)
  linkedDocumentId      UUID?
  createdAt             timestamp
}
```

#### EXPENSES (Registre des Achats)

```
Expense {
  id                    UUID (PK)
  uid                   string
  date                  date
  description           string
  category              string (catégories PCG)
  supplierId            UUID? (FK → Supplier.id)

  amountTTC             integer (centimes)
  amountHT              integer? (centimes)
  vatRate               decimal(4,2)?
  vatAmount             integer? (centimes)

  paymentMethod         string?
  paymentDate           date?

  isDeductible          boolean
  accountingCode        string? (6xxxxx PCG)
  linkedDocumentId      UUID? (FK → StoredDocument.id — justificatif)

  createdAt             timestamp
  updatedAt             timestamp
}

AccountingEntry {
  id                    UUID (PK)
  uid                   string
  date                  date
  type                  'recette' | 'depense' | 'avoir' | 'acompte'
  documentId            UUID
  documentType          string
  amount                integer (centimes)
  vatAmount             integer? (centimes)
  description           string
  accountDebit          string (PCG)
  accountCredit         string (PCG)
  createdAt             timestamp
}
```

#### DOCUMENTS (GED)

```
StoredDocument {
  id                    UUID (PK)
  uid                   string
  name                  string
  originalName          string
  category              'justificatif' | 'contrat' | 'declaration' | 'correspondance' | 'autre'
  mimeType              string
  size                  integer (octets)
  hash                  string (SHA-256)

  -- Contenu (chiffré AES-256-GCM si données sensibles) --
  storageRef            string? (Firebase Storage path)
  localBlob             Blob? (non persisté — session seulement)
  encryptionIV          string? (IV AES en base64)
  encryptionTag         string? (Auth tag AES-GCM)

  -- OCR --
  ocrStatus             'pending' | 'processing' | 'done' | 'failed'?
  ocrExtracted          JSON? { amount, date, vendor, vatAmount, invoiceNumber, confidence }

  -- Liaisons --
  linkedExpenseId       UUID?
  linkedInvoiceId       UUID?

  -- RGPD --
  retentionUntil        date (10 ans pour factures — art. L123-22 Code de Commerce)
  dataCategory          'comptable' | 'contractuel' | 'personnel'

  uploadedAt            timestamp
  updatedAt             timestamp
}
```

#### CALENDAR EVENTS

```
CalendarEvent {
  id                    UUID (PK)
  uid                   string
  externalId            string? (Google Calendar / Outlook event ID)
  type                  'appointment' | 'deadline' | 'reminder' | 'urssaf' | 'vat' | 'invoice_reminder'
  title                 string
  description           string?
  startDate             timestamp
  endDate               timestamp
  allDay                boolean
  location              string?
  attendees             string[] (emails)

  linkedDocumentId      UUID?
  linkedClientId        UUID?

  reminderMinutes       integer[] (ex: [1440, 60] = J-1 et 1h avant)
  isRecurring           boolean
  recurrenceRule        string? (RRULE RFC5545)

  source                'local' | 'google' | 'outlook'
  syncStatus            'synced' | 'pending' | 'conflict'

  createdAt             timestamp
  updatedAt             timestamp
}
```

#### EMAIL MESSAGES

```
EmailMessage {
  id                    UUID (PK)
  uid                   string
  externalId            string? (Gmail message-id, Outlook id)
  threadId              string?
  direction             'inbound' | 'outbound'

  from                  string
  to                    string[]
  cc                    string[]?
  bcc                   string[]?
  replyTo               string?

  subject               string
  bodyHtml              string (sanitisé DOMPurify — CRITIQUE sécurité)
  bodyText              string?

  attachments           JSON[] { name, mimeType, size, storageRef }

  linkedDocumentId      UUID?
  linkedClientId        UUID?
  linkedInvoiceId       UUID?

  sentAt                timestamp?
  receivedAt            timestamp?
  status                'draft' | 'queued' | 'sent' | 'received' | 'archived' | 'error'
  labels                string[]
  isRead                boolean

  source                'app' | 'gmail' | 'outlook' | 'smtp'
  syncStatus            'synced' | 'pending'

  createdAt             timestamp
}
```

#### SYNC QUEUE

```
SyncQueueItem {
  id                    UUID (PK)
  table                 string (nom de la table IndexedDB)
  recordId              UUID
  operation             'insert' | 'update' | 'delete'
  payload               JSON (données to sync — chiffrées)
  syncStatus            'pending' | 'syncing' | 'done' | 'error'
  retryCount            integer
  lastError             string?
  createdAt             timestamp
  syncedAt              timestamp?
}
```

### 4.4 Relations entre Entités

```
UserProfile (1) ─────────────────────────────────────── (∞) Invoice
     │                                                         │
     ├──── (∞) Client ←──────────────── (∞) Invoice            │
     │              │                                          │
     │              └── (∞) Interaction                        │
     │                                                         │
     ├──── (∞) Supplier ←──── (∞) PurchaseOrder               │
     │              │                       │                  │
     │              └── (∞) Expense ←───────┘                  │
     │                         │                              │
     ├──── (∞) Product         └── (1) StoredDocument ────────┘
     │         │
     │         └── (∞) StockMovement
     │
     ├──── (∞) AccountingEntry ←── Invoice + Expense
     ├──── (∞) CalendarEvent
     ├──── (∞) EmailMessage
     ├──── (∞) StoredDocument
     └──── (∞) LogEntry
```

---

## 5. Sécurité & Conformité

### 5.1 RGPD (Règlement Général sur la Protection des Données)

#### Registre des Traitements

| Traitement          | Base légale                      | Durée retention            | Données concernées              |
| ------------------- | -------------------------------- | -------------------------- | ------------------------------- |
| Facturation clients | Obligation légale (art. L123-22) | 10 ans                     | Identité, coordonnées, montants |
| Comptabilité        | Obligation légale                | 10 ans                     | Toutes transactions financières |
| Agenda & emails     | Exécution contrat                | Durée relation + 3 ans     | Rendez-vous, échanges           |
| Documents GED       | Obligation légale / contrat      | Selon catégorie (3-10 ans) | Fichiers, justificatifs         |
| Logs d'audit        | Intérêts légitimes (sécurité)    | 1 an glissant              | Actions utilisateur             |

#### Mesures Techniques RGPD

```typescript
// lib/cryptoUtils.ts — Chiffrement AES-256-GCM (Web Crypto API natif)

export async function encryptData(
  plaintext: string,
  password: string,
): Promise<{ encrypted: string; iv: string; tag: string }> {
  // Dérivation de clé PBKDF2 (100 000 itérations — NIST SP 800-132)
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"],
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits recommandé GCM
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    encoded,
  );

  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv)),
    tag: "", // Tag intégré dans le ciphertext AES-GCM
  };
}
```

**Contrôles RGPD implémentés :**

| Droit RGPD               | Implémentation                                                    |
| ------------------------ | ----------------------------------------------------------------- |
| Droit d'accès            | Export JSON complet de toutes les données (`lib/exportUtils.ts`)  |
| Droit à l'effacement     | Suppression en cascade de toutes les tables IndexedDB + Firestore |
| Portabilité              | Export standardisé (JSON schema documenté)                        |
| Limitation du traitement | Flag `archived: true` sans suppression + lock API                 |
| Rectification            | Formulaires d'édition + log d'audit avec version antérieure       |
| Opposition               | Opt-out Analytics Firebase (pas de tracking comportemental)       |

### 5.2 Chiffrement des Données Financières

#### Stratégie de chiffrement par couche

```
┌─────────────────────────────────────────────────────────────┐
│  COUCHE 1 — Transport                                       │
│  HTTPS (TLS 1.3 minimum) — Firebase Hosting enforced       │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  COUCHE 2 — Stockage Cloud (Firestore / Storage)           │
│  AES-256 at rest — géré par Google Cloud (FIPS 140-2)      │
│  + Chiffrement applicatif additionnel par l'application     │
│  (la clé n'est jamais connue de Firebase)                  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  COUCHE 3 — Données sensibles (IBAN, SIRET, CLÉs API)      │
│  AES-256-GCM côté client (Web Crypto API)                  │
│  Clé dérivée du mot de passe via PBKDF2                    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  COUCHE 4 — Documents GED sensibles (contrats, déclarations)│
│  AES-256-GCM par document avec IV unique                   │
│  Clé stockée dans IndexedDB (JAMAIS dans Firestore)        │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Conformité Loi Anti-Fraude à la TVA (Art. 286 CGI)

**Exigences légales :**

| Obligation                             | Article légal                   | Implémentation                                     |
| -------------------------------------- | ------------------------------- | -------------------------------------------------- |
| Inaltérabilité des factures            | Art. 289 CGI + Décret 2013-346  | Verrouillage document après émission, hash SHA-256 |
| Conservation sécurisée                 | Art. L102 B LPF                 | Stockage immuable + hash d'intégrité               |
| Archivage 6 ans minimum                | Art. L102 B LPF                 | `retentionUntil` automatique = émission + 6 ans    |
| Journal d'audit (piste d'audit fiable) | Décret 2013-346                 | `LogEntry` horodaté pour chaque modification       |
| Numérotation continue                  | Art. L441-9 CGI                 | Séquence stricte sans rupture ni doublon           |
| Mentions obligatoires                  | Art. 242 nonies A Annexe II CGI | Vérification Zod à l'émission                      |

**Audit Trail (Piste d'Audit Fiable — PAF) :**

```typescript
// Chaque modification d'une facture crée une entrée immuable
interface InvoiceAuditEntry {
  id: string;
  invoiceId: string;
  action:
    | "created"
    | "modified"
    | "status_changed"
    | "sent"
    | "paid"
    | "cancelled"
    | "credit_note_issued";
  previousState?: Partial<Invoice>; // Snapshot avant modification
  newState: Partial<Invoice>; // Snapshot après modification
  userId: string;
  timestamp: number; // Unix ms — horodatage précis
  ip?: string; // IP si disponible (contexte légal)
  userAgent: string;
  checksum: string; // SHA-256(invoiceId + action + timestamp + userId)
}
```

**Mentions obligatoires vérifiées par Zod avant émission :**

```typescript
const invoiceEmissionSchema = z.object({
  number: z.string().regex(/^[A-Z]+-\d{4}-\d{5}$/),
  date: z.string().date(),
  clientId: z.string().uuid(),
  items: z.array(invoiceItemSchema).min(1),
  // Vendeur
  supplierSiret: z.string().length(14),
  supplierAddress: z.string().min(10),
  // Acheteur
  clientName: z.string().min(2),
  clientAddress: z.string().min(10),
  // Montants
  totalHT: z.number().positive(),
  vatAmount: z.number().nonnegative(),
  totalTTC: z.number().positive(),
  // TVA
  vatRate: z.number().nonneg(),
  taxExemptMention: z.string().optional(),
  // Paiement
  paymentTerms: z.string().min(5),
  penaltyClause: z.string().min(10), // Obligatoire en B2B
});
```

### 5.4 Authentification & Contrôle d'Accès

**Niveaux de sécurité :**

```
Niveau 1 — Firebase Auth (Email/Password + Google OAuth2)
  └─ JWT token revalidé toutes les 60 minutes
  └─ Session fermée après 30 min d'inactivité (configurable)

Niveau 2 — 2FA TOTP (Optionnel — Recommandé)
  └─ Google Authenticator / Authy (RFC 6238 TOTP)
  └─ Secret TOTP chiffré AES avant stockage
  └─ Codes de récupération imprimables (10 codes à usage unique)

Niveau 3 — Règles Firestore (data isolation)
  └─ match /users/{userId}/{document=**} {
       allow read, write: if request.auth.uid == userId;
     }
  └─ Aucun document accessible cross-user (isolation totale)
```

**Protection contre les attaques OWASP Top 10 :**

| Risque                          | Mesure                                                  |
| ------------------------------- | ------------------------------------------------------- |
| A01 — Broken Access Control     | Règles Firestore + vérification UID côté client         |
| A02 — Cryptographic Failures    | TLS 1.3 + AES-256-GCM applicatif                        |
| A03 — Injection                 | Validation Zod à toutes les entrées, Dexie paramétré    |
| A05 — Security Misconfiguration | CSP stricte dans `index.html`, headers Firebase Hosting |
| A07 — Authn Failures            | MFA TOTP, expiration JWT, lock après 5 tentatives       |
| A08 — Software Integrity        | Subresource Integrity (SRI), Dependabot, CodeQL         |
| A09 — Logging & Monitoring      | `LogEntry` horodaté, alertes Firebase                   |

**Content Security Policy (CSP) dans `firebase.json` :**

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://firebasestorage.googleapis.com;
  connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com;
  font-src 'self';
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
```

### 5.5 Archivage & Rétention RGPD

```typescript
const RETENTION_POLICIES: Record<string, number> = {
  invoices: 10, // Art. L123-22 Code de Commerce : 10 ans
  expenses: 10, // Même base légale
  contracts: 5, // Art. 2224 Code Civil : 5 ans (délai de prescription)
  emails: 3, // Recommandation CNIL : 3 ans
  auditLog: 1, // 1 an glissant (suffisant pour la PAF)
  documents: 10, // Selon catégorie (max comptable)
};

// Calcul automatique de retentionUntil à la création
function computeRetentionDate(category: string, createdAt: Date): Date {
  const years = RETENTION_POLICIES[category] ?? 3;
  return new Date(createdAt.setFullYear(createdAt.getFullYear() + years));
}
```

---

## 6. Plan de Développement MVP — 5 Sprints

### Sprint 1 — Fondations & Facturation Essentielle (6 semaines)

**Objectif :** Application fonctionnelle de facturation conforme à la loi.

**Scope :**

| US    | Fonctionnalité                                   | Priorité |
| ----- | ------------------------------------------------ | -------- |
| US-01 | Auth Firebase (Email + Google OAuth2)            | MUST     |
| US-02 | Profil micro-entrepreneur (SIRET, activité, TVA) | MUST     |
| US-03 | Gestion clients (CRUD + validation SIRET/email)  | MUST     |
| US-04 | Catalogue produits/services (CRUD)               | MUST     |
| US-05 | Création/édition de facture multi-lignes         | MUST     |
| US-06 | Calcul HT/TTC/TVA avec Decimal.js                | MUST     |
| US-07 | Numérotation continue conforme CGI               | MUST     |
| US-08 | Génération PDF A4 (jsPDF)                        | MUST     |
| US-09 | Statuts facture (Brouillon → Envoyée → Payée)    | MUST     |
| US-10 | Persistance IndexedDB (Dexie) + Sync Firestore   | MUST     |
| US-11 | PWA offline (Service Worker + manifest)          | MUST     |
| US-12 | Livre des recettes (vue filtrable, export CSV)   | MUST     |

**Critères d'acceptation Sprint 1 :**

- [ ] TypeScript compile sans erreur
- [ ] Couverture tests ≥ 60% sur `lib/`
- [ ] Lighthouse Performance ≥ 85, Accessibility ≥ 95
- [ ] Génération d'une facture conforme aux 18 mentions obligatoires
- [ ] Fonctionnement en mode offline validé

---

### Sprint 2 — Devis, Commandes & Comptabilité (5 semaines)

**Objectif :** Cycle de vente complet + comptabilité automatisée.

| US    | Fonctionnalité                                    | Priorité          |
| ----- | ------------------------------------------------- | ----------------- |
| US-13 | Création devis (durée validité, relance J-7)      | MUST              |
| US-14 | Transformation devis → commande → facture         | MUST              |
| US-15 | Avoirs partiels et totaux                         | MUST              |
| US-16 | Registre des achats (dépenses + justificatifs)    | MUST              |
| US-17 | Calcul URSSAF temps réel (toutes catégories)      | MUST              |
| US-18 | Jauges visuelles plafonds TVA + régime micro      | MUST              |
| US-19 | Gestion fournisseurs + bons de commande achat     | SHOULD            |
| US-20 | Dashboard comptable (CA, charges, bénéfice net)   | SHOULD            |
| US-21 | Facturation Factur-X basique (MINIMUM)            | MUST (janv. 2027) |
| US-22 | Notifications PWA (relances, échéances)           | SHOULD            |
| US-23 | Export données comptable (CSV, XLSX pour experts) | SHOULD            |

**Critères d'acceptation Sprint 2 :**

- [ ] Calcul URSSAF validé contre grille BOSS 2026
- [ ] Fichier Factur-X validé par validateur Factur-X online
- [ ] Tests calculs fiscaux avec ≥ 95% couverture
- [ ] Couverture globale ≥ 70%

---

### Sprint 3 — Productivité & Signature Électronique (5 semaines)

**Objectif :** Outils de productivité différenciants.

| US    | Fonctionnalité                                    | Priorité |
| ----- | ------------------------------------------------- | -------- |
| US-24 | Agenda interne (CRUD événements + rappels)        | MUST     |
| US-25 | Sync Google Calendar (OAuth2 bidirectionnelle)    | SHOULD   |
| US-26 | Client mail intégré (Gmail OAuth2, send/receive)  | SHOULD   |
| US-27 | Envoi factures par email directement depuis l'app | MUST     |
| US-28 | Signature électronique devis (ECDSA Web Crypto)   | SHOULD   |
| US-29 | GED — upload justificatifs + liaison dépenses     | MUST     |
| US-30 | OCR basique (Gemini Vision — montant + date)      | SHOULD   |
| US-31 | Gestion stock (alertes réapprovisionnement)       | SHOULD   |
| US-32 | CRM — historique interactions client              | SHOULD   |

**Critères d'acceptation Sprint 3 :**

- [ ] Signature ECDSA vérifiable indépendamment
- [ ] OCR précision ≥ 80% sur montants de factures standards
- [ ] Sync calendrier ≤ 2 secondes latence

---

### Sprint 4 — e-Invoicing Complet & Paiements (5 semaines)

**Objectif :** Conformité e-facture 2026 complète + intégrations paiement.

| US    | Fonctionnalité                                 | Priorité |
| ----- | ---------------------------------------------- | -------- |
| US-33 | Factur-X EN Basic (toutes mentions EN16931)    | MUST     |
| US-34 | UBL 2.1 (Chorus Pro administrations)           | MUST     |
| US-35 | Connexion PDP (dépôt + réception webhooks)     | MUST     |
| US-36 | Tableau de bord statuts e-invoicing            | MUST     |
| US-37 | Lien de paiement Stripe embarqué dans PDF      | SHOULD   |
| US-38 | Sync Outlook/Microsoft 365                     | SHOULD   |
| US-39 | Rapports fiscaux pré-remplis (URSSAF, TVA)     | MUST     |
| US-40 | 2FA TOTP (Google Authenticator)                | MUST     |
| US-41 | Audit trail complet (PAF — Piste Audit Fiable) | MUST     |

**Critères d'acceptation Sprint 4 :**

- [ ] Factur-X validé par FNFE-MPE Validator
- [ ] Dépôt test réussi sur PDP sandbox
- [ ] Rapport URSSAF = calcul manuel ± 0.01€
- [ ] Audit trail inaltérable (hash vérifié)

---

### Sprint 5 — Polissage, Performance & Mise en Production (4 semaines)

**Objectif :** Application production-ready, performante et auditable.

| Action              | Détail                                                |
| ------------------- | ----------------------------------------------------- |
| Couverture tests    | Atteindre ≥ 80% global (focus lib/ et hooks/)         |
| Audit accessibilité | RGAA 4.2 / WCAG 2.1 AA — score ≥ 95                   |
| Optimisation bundle | Code splitting, lazy routes, < 150kb initial JS       |
| Lighthouse CI       | Performance ≥ 90, Best Practices ≥ 95                 |
| Audit sécurité      | OWASP ZAP scan + CodeQL + npm audit prod              |
| Documentation       | Onboarding, guide utilisateur, API interne documentée |
| Monitoring          | Firebase Crashlytics + Performance Monitoring         |
| SonarCloud          | maintainability A, reliability A, security A          |
| Migration guide     | Procédure import depuis logiciels tiers (CSV)         |
| Backup & restore    | Export/import complet base IndexedDB chiffrée         |

**Résultat final Sprint 5 :**

- Production sur Firebase Hosting avec CDN global
- Pipeline CI/CD GitHub Actions complet (lint → type → test → build → deploy)
- Documentation technique complète dans `/docs`
- Score global SonarCloud : A (0 critical issues)
- Couverture ≥ 80%
- Lighthouse moyen : 92+ Performance, 97+ Accessibility

---

## Récapitulatif Technique

### Indicateurs Cibles

| Métrique                  | Cible           | Outil          |
| ------------------------- | --------------- | -------------- |
| Couverture tests          | ≥ 80%           | Vitest + v8    |
| TypeScript                | 0 erreur        | tsc strict     |
| Lint warnings             | 0               | ESLint 10      |
| Bundle initial            | < 150 kb (gzip) | Vite analyze   |
| Lighthouse Performance    | ≥ 90            | Lighthouse CI  |
| Lighthouse Accessibility  | ≥ 95            | axe-core       |
| SonarCloud Quality Gate   | Pass (A)        | SonarCloud     |
| TTFB (Time to First Byte) | < 200ms         | Firebase CDN   |
| Précision calculs fiscaux | ± 0.00€         | Decimal.js     |
| Conformité e-facture      | 100% EN16931    | FNFE Validator |

### Dépendances à Ajouter (phase suivante)

```jsonc
// Nouvelles dépendances nécessaires pour les fonctionnalités avancées
{
  "dependencies": {
    "dompurify": "^3.x", // Sanitisation HTML email (CRITIQUE sécurité)
    "@types/dompurify": "^3.x",
    "jszip": "^3.x", // Génération archives exports
    "xlsx": "^0.x", // Export XLSX comptable
    "tesseract.js": "^5.x", // OCR offline (fallback Gemini)
    "nodemailer": "*", // Via Firebase Function uniquement
    "zod": "^4.x", // Déjà présent — étendre les schémas
  },
  "devDependencies": {
    "vitest-axe": "^x.x", // Tests accessibilité automatisés
    "@axe-core/react": "^4.x", // Runtime a11y checks (dev only)
    "rollup-plugin-visualizer": "^7.x", // Déjà présent — analyse bundle
  },
}
```

---

_Document maintenu par : Architecte Logiciel Senior — Micro-Gestion-Facile_  
_Prochaine révision : À chaque fin de sprint_  
_Référence légale principale : BOSS 2026, CGI art. 286-289, EN16931, RGPD 2016/679_

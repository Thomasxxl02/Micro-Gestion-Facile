/**
 * DataTab - Gestion des données, export/import, synchronisation
 * ✅ RGPD Art.20 (Portabilité)
 * ✅ Nettoyage & gouvernance des données
 */

import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Cloud,
  Download,
  Eye,
  EyeOff,
  FileText,
  Filter,
  HardDrive,
  History as HistoryIcon,
  Lock,
  Mail,
  RefreshCw,
  Shuffle,
  Trash2,
  Upload,
  User,
  Zap,
} from "lucide-react";
import Papa from "papaparse";
import React from "react";
import { toast } from "sonner";
import { exportAsSQL, type ExportData } from "../../lib/exportUtils";
import type {
  Client,
  Expense,
  Invoice,
  Product,
  Supplier,
  UserProfile,
} from "../../types";

// ─── Structure backup chiffré ──────────────────────────────────────────────────
interface EncryptedBackup {
  encrypted: true;
  version: string;
  salt: string;
  iv: string;
  data: string;
}

// ─── Chiffrement AES-GCM (Web Crypto API) ─────────────────────────────────────
async function encryptBackup(
  jsonData: string,
  password: string,
): Promise<EncryptedBackup> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(jsonData),
  );
  const toB64 = (buf: ArrayBufferLike) =>
    btoa(String.fromCharCode(...new Uint8Array(buf)));
  return {
    encrypted: true,
    version: "1.0",

    salt: toB64(salt.buffer as ArrayBufferLike),

    iv: toB64(iv.buffer as ArrayBufferLike),
    data: toB64(encrypted),
  };
}

async function decryptBackup(
  encObj: EncryptedBackup,
  password: string,
): Promise<string> {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const fromB64 = (s: string) =>
    Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromB64(encObj.salt),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(encObj.iv) },
    key,
    fromB64(encObj.data),
  );
  return dec.decode(decrypted);
}

// ─── Similarité de chaîne (Levenshtein normalisé) ─────────────────────────────
function stringSimilarity(a: string, b: string): number {
  const la = a.toLowerCase().trim();
  const lb = b.toLowerCase().trim();
  if (la === lb) return 1;
  const m = la.length;
  const n = lb.length;
  if (m === 0 || n === 0) return 0;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        la[i - 1] === lb[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return 1 - dp[m][n] / Math.max(m, n);
}

// ─── Téléchargement côté client ───────────────────────────────────────────────
function triggerDownload(
  content: string,
  filename: string,
  mime: string,
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface DataTabProps {
  userProfile: UserProfile;
  /** Email du compte Firebase connecté (null si hors ligne) */
  connectedEmail?: string | null;
  allData: {
    invoices: Invoice[];
    clients: Client[];
    suppliers: Supplier[];
    products: Product[];
    expenses: Expense[];
  };
  setAllData: {
    setInvoices: (data: Invoice[]) => void;
    setClients: (data: Client[]) => void;
    setSuppliers: (data: Supplier[]) => void;
    setProducts: (data: Product[]) => void;
    setExpenses: (data: Expense[]) => void;
  };
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
  onGenerateSampleData: (callback: () => void) => void;
  onResetData: (callback: () => void) => void;
  isSyncing: boolean;
  lastSyncTime: number;
  onForceSync: () => Promise<void>;
  isFirebaseConnected: boolean;
  lastBackupDate?: string | null;
  activityLogs: Array<{
    id: string;
    action: string;
    category: string;
    timestamp: number;
  }>;
}

/**
 * DataTab - Onglet Données & Exports
 * Responsabilités :
 * - Résumé des données (nombre de factures, clients, etc.)
 * - Export/Import RGPD (format JSON)
 * - Nettoyage des données (doublons, produits inutilisés)
 * - Synchronisation Cloud
 */
export const DataTab: React.FC<DataTabProps> = ({
  userProfile,
  connectedEmail,
  allData,
  setAllData,
  onExport,
  onImport,
  onGenerateSampleData,
  onResetData,
  isSyncing,
  lastSyncTime,
  onForceSync,
  isFirebaseConnected,
  lastBackupDate,
  activityLogs,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /** Factures en attente de confirmation d'archivage (export JSON + suppression) */
  const [archiveConfirm, setArchiveConfirm] = React.useState<Invoice[] | null>(
    null,
  );

  /** Doublons clients en attente de confirmation de fusion */
  const [mergeConfirm, setMergeConfirm] = React.useState<{
    groups: Array<{
      keep: Client;
      duplicates: Client[];
      /** Nb de factures liées aux doublons, à réassigner au client conservé */
      invoiceCount: number;
      /** Données présentes dans les doublons mais absentes du client conservé */
      diffs: string[];
    }>;
    toKeep: Client[];
    updatedInvoices: Invoice[];
  } | null>(null);

  // ─── NOUVELLES FONCTIONNALITÉS DATA ─────────────────────────────────────────────────

  /** Taille estimée des données locales (Ko) */
  const estimatedSizeKB = React.useMemo(() => {
    const json = JSON.stringify(allData);
    return Math.round(new TextEncoder().encode(json).length / 1024);
  }, [allData]);

  /** Années disponibles dans les factures (pour l'export partiel) */
  const availableYears = React.useMemo(() => {
    const years = new Set<string>();
    allData.invoices.forEach((inv) => {
      const y = inv.date?.slice(0, 4);
      if (y) years.add(y);
    });
    return Array.from(years).sort().reverse();
  }, [allData.invoices]);

  /** Alerte auto : factures de plus de 10 ans détectées au chargement de l'onglet */
  const [oldInvoicesAlert, setOldInvoicesAlert] = React.useState<
    Invoice[] | null
  >(null);
  React.useEffect(() => {
    const ref = new Date();
    ref.setFullYear(ref.getFullYear() - 10);
    const old = allData.invoices.filter((inv) => new Date(inv.date) < ref);
    if (old.length > 0) setOldInvoicesAlert(old);
    // exécuté une fois au chargement de l'onglet
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Journal d'audit — ouvert/fermé */
  const [isAuditLogOpen, setIsAuditLogOpen] = React.useState(false);

  /** Fusion doublons produits */
  const [productMergeConfirm, setProductMergeConfirm] = React.useState<{
    groups: Array<{
      keep: Product;
      duplicates: Product[];
      invoiceCount: number;
      similarity: number;
    }>;
    toKeep: Product[];
    updatedInvoices: Invoice[];
  } | null>(null);

  /** Prévisualisation avant import */
  const [importPreview, setImportPreview] = React.useState<{
    file: File;
    raw: Record<string, unknown>;
  } | null>(null);

  /** Export partiel */
  const [isPartialExportOpen, setIsPartialExportOpen] = React.useState(false);
  const [partialYear, setPartialYear] = React.useState<string>("all");
  const [partialType, setPartialType] = React.useState<
    "all" | "invoices" | "clients" | "products"
  >("all");
  const [partialFormat, setPartialFormat] = React.useState<"json" | "csv">(
    "json",
  );

  /** Chiffrement à l'export */
  const [isEncryptModalOpen, setIsEncryptModalOpen] = React.useState(false);
  const [encryptPassword, setEncryptPassword] = React.useState("");
  const [encryptPasswordConfirm, setEncryptPasswordConfirm] =
    React.useState("");
  const [encryptPwdVisible, setEncryptPwdVisible] = React.useState(false);
  const [isEncrypting, setIsEncrypting] = React.useState(false);

  /** Déchiffrement à l'import */
  const [decryptModal, setDecryptModal] = React.useState<{
    encryptedData: EncryptedBackup;
  } | null>(null);
  const [decryptPassword, setDecryptPassword] = React.useState("");
  const [decryptPwdVisible, setDecryptPwdVisible] = React.useState(false);
  const [isDecrypting, setIsDecrypting] = React.useState(false);

  const handleImportAll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Réinitialise pour pouvoir re-sélectionner le même fichier
    if (fileInputRef.current) fileInputRef.current.value = "";
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as Record<string, unknown>;
      // Détection d'un backup chiffré
      if (raw.encrypted === true && raw.salt && raw.iv && raw.data) {
        setDecryptModal({ encryptedData: raw as unknown as EncryptedBackup });
        return;
      }
      // Prévisualisation avant import
      setImportPreview({ file, raw });
    } catch {
      toast.error("Fichier invalide", {
        description: "Le fichier sélectionné n'est pas un JSON valide.",
      });
    }
  };

  const handleCleanData = (type: "clients" | "products") => {
    if (type === "clients") {
      const namesMap = new Map<string, Client>();
      const toKeep: Client[] = [];
      const duplicatesCount = { total: 0 };

      allData.clients.forEach((client) => {
        const normalized = client.name.trim().toLowerCase();
        if (namesMap.has(normalized)) {
          duplicatesCount.total++;
        } else {
          namesMap.set(normalized, client);
          toKeep.push(client);
        }
      });

      if (duplicatesCount.total === 0) {
        toast.info("Aucun client en doublon détecté.");
        return;
      }

      setAllData.setClients(toKeep);
      toast.success(`${duplicatesCount.total} clients fusionnés`);
    } else if (type === "products") {
      const usedProductIds = new Set<string>();
      allData.invoices.forEach((inv) => {
        inv.items.forEach((item) => {
          if (item.id) {
            usedProductIds.add(item.id);
          }
        });
      });

      const unusedProducts = allData.products.filter(
        (p) => !usedProductIds.has(p.id),
      );

      if (unusedProducts.length === 0) {
        toast.info("Tous vos produits sont actuellement utilisés.");
        return;
      }

      const keptProducts = allData.products.filter((p) =>
        usedProductIds.has(p.id),
      );
      setAllData.setProducts(keptProducts);
      toast.success(`${unusedProducts.length} produits supprimés`);
    }
  };

  const cleanOldData = (type: "10years" | "drafts") => {
    const now = new Date();
    if (type === "10years") {
      const tenYearsAgo = new Date(now.setFullYear(now.getFullYear() - 10));
      const oldInvoices = allData.invoices.filter(
        (inv) => new Date(inv.date) < tenYearsAgo,
      );
      if (oldInvoices.length === 0) {
        toast.info("Aucune donnée de plus de 10 ans trouvée.");
        return;
      }

      const remaining = allData.invoices.filter(
        (inv) => new Date(inv.date) >= tenYearsAgo,
      );
      setAllData.setInvoices(remaining);
      toast.success(`${oldInvoices.length} factures archivées.`);
    } else {
      const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
      const oldDrafts = allData.invoices.filter(
        (inv) => inv.status === "draft" && new Date(inv.date) < sixMonthsAgo,
      );
      if (oldDrafts.length === 0) {
        toast.info("Aucun brouillon de plus de 6 mois trouvé.");
        return;
      }

      const remaining = allData.invoices.filter(
        (inv) => !(inv.status === "draft" && new Date(inv.date) < sixMonthsAgo),
      );
      setAllData.setInvoices(remaining);
      toast.success(`${oldDrafts.length} brouillons supprimés.`);
    }
  };

  /**
   * Étape 1 — Archive 10 ans : identifie les factures éligibles et ouvre la
   * confirmation. Aucune suppression n'a lieu avant export effectif.
   * Obligation légale : art. L110-4 Code de commerce (conservation 10 ans).
   */
  const prepareArchive = () => {
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const old = allData.invoices.filter(
      (inv) => new Date(inv.date) < tenYearsAgo,
    );
    if (old.length === 0) {
      toast.info("Aucune donnée de plus de 10 ans trouvée.");
      return;
    }
    setArchiveConfirm(old);
  };

  /**
   * Étape 2 — Archive 10 ans : télécharge le fichier JSON de conservation légale
   * PUIS retire ces factures de l'état local.
   */
  const confirmArchive = () => {
    if (!archiveConfirm) return;
    const blob = new Blob([JSON.stringify(archiveConfirm, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `factures-archivees-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    const remaining = allData.invoices.filter(
      (inv) => !archiveConfirm.includes(inv),
    );
    setAllData.setInvoices(remaining);
    toast.success(
      `${archiveConfirm.length} facture(s) exportées et retirées de l'application.`,
    );
    setArchiveConfirm(null);
  };

  /**
   * Étape 1 — Fusion doublons : calcule les groupes, les différences de champs
   * et le nombre de factures liées avant d'afficher la confirmation.
   */
  const prepareMerge = () => {
    const namesMap = new Map<string, Client[]>();
    allData.clients.forEach((client) => {
      const key = client.name.trim().toLowerCase();
      const group = namesMap.get(key) ?? [];
      group.push(client);
      namesMap.set(key, group);
    });

    const groups: Array<{
      keep: Client;
      duplicates: Client[];
      invoiceCount: number;
      diffs: string[];
    }> = [];
    const toKeep: Client[] = [];

    for (const group of namesMap.values()) {
      if (group.length === 1) {
        toKeep.push(group[0]);
        continue;
      }
      const [keep, ...duplicates] = group;
      toKeep.push(keep);
      const invoiceCount = allData.invoices.filter((inv) =>
        duplicates.some((d) => d.id === inv.clientId),
      ).length;
      const diffs: string[] = [];
      duplicates.forEach((dup) => {
        if (dup.email && dup.email !== keep.email)
          diffs.push(`Email : ${dup.email}`);
        if (dup.address && dup.address !== keep.address)
          diffs.push(`Adresse : ${dup.address}`);
        if (dup.phone && dup.phone !== keep.phone)
          diffs.push(`Tél : ${dup.phone}`);
        if (dup.siret && dup.siret !== keep.siret)
          diffs.push(`SIRET : ${dup.siret}`);
      });
      groups.push({ keep, duplicates, invoiceCount, diffs });
    }

    if (groups.length === 0) {
      toast.info("Aucun client en doublon détecté.");
      return;
    }

    const idRemap = new Map<string, string>();
    groups.forEach((g) =>
      g.duplicates.forEach((d) => idRemap.set(d.id, g.keep.id)),
    );
    const updatedInvoices = allData.invoices.map((inv) =>
      idRemap.has(inv.clientId)
        ? { ...inv, clientId: idRemap.get(inv.clientId)! }
        : inv,
    );
    setMergeConfirm({ groups, toKeep, updatedInvoices });
  };

  /**
   * Étape 2 — Fusion doublons : réassigne les factures au client conservé
   * et supprime les doublons.
   */
  const confirmMerge = () => {
    if (!mergeConfirm) return;
    const totalDuplicates = mergeConfirm.groups.reduce(
      (acc, g) => acc + g.duplicates.length,
      0,
    );
    setAllData.setClients(mergeConfirm.toKeep);
    setAllData.setInvoices(mergeConfirm.updatedInvoices);
    toast.success(
      `${totalDuplicates} doublon(s) fusionnés. Factures réassignées.`,
    );
    setMergeConfirm(null);
  };

  const dataLogs = activityLogs.filter(
    (log) =>
      (log.category as string) === "SYSTEM" ||
      (log.category as string) === "DATA",
  );

  /** Applique un import JSON déchiffré directement via setAllData */
  const applyImportData = (raw: Record<string, unknown>) => {
    if (raw.invoices) setAllData.setInvoices(raw.invoices as Invoice[]);
    if (raw.clients) setAllData.setClients(raw.clients as Client[]);
    if (raw.suppliers) setAllData.setSuppliers(raw.suppliers as Supplier[]);
    if (raw.products) setAllData.setProducts(raw.products as Product[]);
    if (raw.expenses) setAllData.setExpenses(raw.expenses as Expense[]);
  };

  /** Confirme la prévisualisation et déclenche l'import réel */
  const confirmImport = async () => {
    if (!importPreview) return;
    try {
      await onImport(importPreview.file);
    } catch {
      toast.error("Erreur d'importation");
    } finally {
      setImportPreview(null);
    }
  };

  /** Déchiffre et importe un backup chiffré */
  const confirmDecrypt = async () => {
    if (!decryptModal || !decryptPassword) return;
    setIsDecrypting(true);
    try {
      const decrypted = await decryptBackup(
        decryptModal.encryptedData,
        decryptPassword,
      );
      const raw = JSON.parse(decrypted) as Record<string, unknown>;
      applyImportData(raw);
      toast.success("Backup déchiffré et importé avec succès");
      setDecryptModal(null);
      setDecryptPassword("");
    } catch {
      toast.error("Déchiffrement impossible", {
        description: "Mot de passe incorrect ou fichier corrompu.",
      });
    } finally {
      setIsDecrypting(false);
    }
  };

  /**
   * Détecte les produits aux noms quasi-identiques (Levenshtein > 75%)
   * et prépare la fusion avant confirmation.
   */
  const prepareProductMerge = () => {
    const THRESHOLD = 0.75;
    const products = allData.products;
    const merged = new Set<string>();
    const groups: Array<{
      keep: Product;
      duplicates: Product[];
      invoiceCount: number;
      similarity: number;
    }> = [];
    const toKeep: Product[] = [];

    for (let i = 0; i < products.length; i++) {
      if (merged.has(products[i].id)) continue;
      const group: Product[] = [products[i]];
      let maxSim = 0;
      for (let j = i + 1; j < products.length; j++) {
        if (merged.has(products[j].id)) continue;
        const sim = stringSimilarity(products[i].name, products[j].name);
        if (sim >= THRESHOLD) {
          group.push(products[j]);
          merged.add(products[j].id);
          if (sim > maxSim) maxSim = sim;
        }
      }
      merged.add(products[i].id);
      if (group.length > 1) {
        const [keep, ...duplicates] = group;
        const invoiceCount = allData.invoices.reduce(
          (acc, inv) =>
            acc +
            inv.items.filter((item) => duplicates.some((d) => d.id === item.id))
              .length,
          0,
        );
        groups.push({ keep, duplicates, invoiceCount, similarity: maxSim });
        toKeep.push(keep);
      } else {
        toKeep.push(products[i]);
      }
    }

    if (groups.length === 0) {
      toast.info("Aucun produit similaire détecté.");
      return;
    }

    const idRemap = new Map<string, string>();
    groups.forEach((g) =>
      g.duplicates.forEach((d) => idRemap.set(d.id, g.keep.id)),
    );
    const updatedInvoices = allData.invoices.map((inv) => ({
      ...inv,
      items: inv.items.map((item) =>
        item.id && idRemap.has(item.id)
          ? { ...item, id: idRemap.get(item.id) ?? item.id }
          : item,
      ),
    }));
    setProductMergeConfirm({ groups, toKeep, updatedInvoices });
  };

  /** Confirme la fusion des produits similaires */
  const confirmProductMerge = () => {
    if (!productMergeConfirm) return;
    const totalDuplicates = productMergeConfirm.groups.reduce(
      (acc, g) => acc + g.duplicates.length,
      0,
    );
    setAllData.setProducts(productMergeConfirm.toKeep);
    setAllData.setInvoices(productMergeConfirm.updatedInvoices);
    toast.success(
      `${totalDuplicates} produit(s) fusionné(s). Références mises à jour.`,
    );
    setProductMergeConfirm(null);
  };

  /** Export JSON chiffré avec AES-256-GCM + PBKDF2 */
  const handleEncryptedExport = async () => {
    if (!encryptPassword || encryptPassword !== encryptPasswordConfirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    if (encryptPassword.length < 8) {
      toast.error("Mot de passe trop court (min. 8 caractères).");
      return;
    }
    setIsEncrypting(true);
    try {
      const data = JSON.stringify({
        version: "1.0",
        exportedAt: new Date().toISOString(),
        ...allData,
      });
      const enc = await encryptBackup(data, encryptPassword);
      triggerDownload(
        JSON.stringify(enc, null, 2),
        `mgf-backup-chiffre-${new Date().toISOString().slice(0, 10)}.json`,
        "application/json",
      );
      toast.success("Backup chiffré exporté");
      setIsEncryptModalOpen(false);
      setEncryptPassword("");
      setEncryptPasswordConfirm("");
    } catch {
      toast.error("Erreur lors du chiffrement");
    } finally {
      setIsEncrypting(false);
    }
  };

  /** Export partiel : par année fiscale et/ou par type, en JSON ou CSV */
  const handlePartialExport = () => {
    const today = new Date().toISOString().slice(0, 10);
    const suffix = `${partialYear !== "all" ? partialYear : "complet"}-${today}`;

    if (partialType === "clients") {
      const csv = Papa.unparse(
        allData.clients.map((c) => ({
          Nom: c.name,
          Email: c.email ?? "",
          Téléphone: c.phone ?? "",
          Adresse: c.address ?? "",
          SIRET: c.siret ?? "",
        })),
      );
      if (partialFormat === "csv") {
        triggerDownload(csv, `clients-${suffix}.csv`, "text/csv;charset=utf-8");
      } else {
        triggerDownload(
          JSON.stringify(allData.clients, null, 2),
          `clients-${suffix}.json`,
          "application/json",
        );
      }
      toast.success(`${allData.clients.length} client(s) exporté(s)`);
      setIsPartialExportOpen(false);
      return;
    }

    if (partialType === "products") {
      const csv = Papa.unparse(
        allData.products.map((p) => ({
          Nom: p.name,
          Description: p.description ?? "",
          "Prix HT": p.price,
          Type: p.type,
          Catégorie: p.category ?? "",
          SKU: p.sku ?? "",
          Unité: p.unit ?? "",
        })),
      );
      if (partialFormat === "csv") {
        triggerDownload(
          csv,
          `produits-${suffix}.csv`,
          "text/csv;charset=utf-8",
        );
      } else {
        triggerDownload(
          JSON.stringify(allData.products, null, 2),
          `produits-${suffix}.json`,
          "application/json",
        );
      }
      toast.success(`${allData.products.length} produit(s) exporté(s)`);
      setIsPartialExportOpen(false);
      return;
    }

    // Factures (filtrées par année si nécessaire)
    let invoices = allData.invoices;
    if (partialYear !== "all") {
      invoices = invoices.filter((inv) => inv.date?.startsWith(partialYear));
    }

    if (partialType === "invoices") {
      const csv = Papa.unparse(
        invoices.map((inv) => ({
          Numéro: inv.number,
          Date: inv.date,
          Client:
            allData.clients.find((c) => c.id === inv.clientId)?.name ??
            inv.clientId,
          Statut: inv.status,
          "Total HT": inv.subtotal ?? inv.total,
          "Total TTC": inv.total,
        })),
      );
      if (partialFormat === "csv") {
        triggerDownload(
          csv,
          `factures-${suffix}.csv`,
          "text/csv;charset=utf-8",
        );
      } else {
        triggerDownload(
          JSON.stringify(invoices, null, 2),
          `factures-${suffix}.json`,
          "application/json",
        );
      }
      toast.success(`${invoices.length} facture(s) exportée(s)`);
      setIsPartialExportOpen(false);
      return;
    }

    // Type "all" avec filtre année
    const partial = { ...allData, invoices };
    triggerDownload(
      JSON.stringify(partial, null, 2),
      `mgf-export-${suffix}.json`,
      "application/json",
    );
    toast.success("Export partiel effectué");
    setIsPartialExportOpen(false);
  };

  return (
    <div
      id="panel-data"
      role="tabpanel"
      aria-labelledby="tab-data"
      className="space-y-8 animate-slide-up"
    >
      {/* Résumé statistiques */}
      <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
        <h3 className="text-sm font-bold text-brand-900 dark:text-white mb-6">
          Résumé des données
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(
            [
              { label: "Factures", count: allData.invoices.length },
              { label: "Clients", count: allData.clients.length },
              { label: "Fournisseurs", count: allData.suppliers.length },
              { label: "Produits", count: allData.products.length },
              { label: "Dépenses", count: allData.expenses.length },
            ] as { label: string; count: number }[]
          ).map(({ label, count }) => (
            <div
              key={label}
              className="p-4 bg-brand-50/50 dark:bg-brand-800/30 rounded-2xl text-center"
            >
              <p className="text-2xl font-bold text-brand-900 dark:text-white">
                {count}
              </p>
              <p className="text-[10px] uppercase font-bold text-brand-400 mt-1">
                {label}
              </p>
            </div>
          ))}{" "}
        </div>

        {/* Estimation de l'espace de stockage local */}
        <div className="mt-4 pt-4 border-t border-brand-100 dark:border-brand-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-[10px] text-brand-400 font-bold uppercase">
              <HardDrive size={12} /> Stockage local estimé
            </span>
            <span
              className={`text-[10px] font-bold ${
                estimatedSizeKB > 40_960
                  ? "text-red-500"
                  : estimatedSizeKB > 20_480
                    ? "text-amber-500"
                    : "text-emerald-500"
              }`}
            >
              {estimatedSizeKB < 1024
                ? `${estimatedSizeKB} Ko`
                : `${(estimatedSizeKB / 1024).toFixed(1)} Mo`}{" "}
              / ~50 Mo
            </span>
          </div>
          <div className="w-full bg-brand-100 dark:bg-brand-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                estimatedSizeKB > 40_960
                  ? "bg-red-500"
                  : estimatedSizeKB > 20_480
                    ? "bg-amber-500"
                    : "bg-emerald-400"
              }`}
              style={{
                width: `${Math.min((estimatedSizeKB / 51_200) * 100, 100)}%`,
              }}
            />
          </div>
          {estimatedSizeKB > 40_960 && (
            <p className="text-[9px] text-red-500 mt-1 flex items-center gap-1">
              <AlertTriangle size={9} /> Stockage proche de la saturation —
              pensez à archiver.
            </p>
          )}
        </div>
      </div>

      {/* Export / Import Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={onExport}
          className="flex items-center justify-center gap-3 p-5 bg-brand-900 dark:bg-white text-white dark:text-brand-900 rounded-2xl font-bold text-sm shadow-xl shadow-brand-900/10"
        >
          <Download size={20} /> Exporter (.json)
        </button>
        <button
          onClick={() => {
            const data: ExportData = {
              version: "1.0",
              exportedAt: new Date().toISOString(),
              ...allData,
              emails: [],
              emailTemplates: [],
              calendarEvents: [],
            };
            const blob = exportAsSQL(data);
            triggerDownload(
              blob as unknown as string,
              `export-sql-${new Date().toISOString().slice(0, 10)}.sql`,
              "text/sql",
            );
          }}
          className="flex items-center justify-center gap-3 p-5 bg-white dark:bg-brand-800 border border-brand-100 text-brand-700 rounded-2xl font-bold text-sm"
        >
          <Download size={20} /> Exporter (.sql)
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-3 p-5 bg-white dark:bg-brand-800 border border-brand-100 text-brand-700 rounded-2xl font-bold text-sm"
        >
          <Upload size={20} /> Importer (.json)
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".json"
          onChange={(e) => {
            void handleImportAll(e);
          }}
          aria-label="Sélectionner un fichier de sauvegarde JSON"
        />
      </div>

      {/* Actions d'export avancées */}
      <div className="grid grid-cols-2 gap-4 -mt-2">
        <button
          onClick={() => setIsEncryptModalOpen(true)}
          className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-brand-800 border border-brand-100 dark:border-brand-700 text-brand-700 dark:text-brand-300 rounded-2xl font-bold text-xs hover:bg-brand-50 dark:hover:bg-brand-700/50 transition-colors"
        >
          <Lock size={15} /> Export chiffré
        </button>
        <button
          onClick={() => setIsPartialExportOpen((v) => !v)}
          className={`flex items-center justify-center gap-2 p-4 border rounded-2xl font-bold text-xs transition-colors ${
            isPartialExportOpen
              ? "bg-brand-900 dark:bg-white text-white dark:text-brand-900 border-transparent"
              : "bg-white dark:bg-brand-800 border-brand-100 dark:border-brand-700 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-700/50"
          }`}
        >
          <Filter size={15} /> Export partiel
        </button>
      </div>

      {/* Accordéon : export partiel */}
      {isPartialExportOpen && (
        <div className="bg-brand-50/50 dark:bg-brand-800/30 rounded-2xl border border-brand-100 dark:border-brand-700 p-5 -mt-2 space-y-3">
          <p className="text-[10px] font-bold text-brand-500 dark:text-brand-400 uppercase tracking-widest">
            Options d’export
          </p>
          {/* Type de données */}
          <div>
            <label className="text-[10px] text-brand-400 font-bold uppercase tracking-tighter block mb-2">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {(["all", "invoices", "clients", "products"] as const).map(
                (t) => (
                  <button
                    key={t}
                    onClick={() => setPartialType(t)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-colors ${
                      partialType === t
                        ? "bg-brand-900 dark:bg-white text-white dark:text-brand-900"
                        : "bg-white dark:bg-brand-700 border border-brand-200 dark:border-brand-600 text-brand-600 dark:text-brand-300"
                    }`}
                  >
                    {
                      {
                        all: "Tout",
                        invoices: "Factures",
                        clients: "Clients",
                        products: "Produits",
                      }[t]
                    }
                  </button>
                ),
              )}
            </div>
          </div>
          {/* Année fiscale (uniquement si Tout ou Factures) */}
          {(partialType === "all" || partialType === "invoices") &&
            availableYears.length > 0 && (
              <div>
                <label className="text-[10px] text-brand-400 font-bold uppercase tracking-tighter block mb-2">
                  Année fiscale
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setPartialYear("all")}
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-colors ${
                      partialYear === "all"
                        ? "bg-brand-900 dark:bg-white text-white dark:text-brand-900"
                        : "bg-white dark:bg-brand-700 border border-brand-200 dark:border-brand-600 text-brand-600 dark:text-brand-300"
                    }`}
                  >
                    Toutes
                  </button>
                  {availableYears.map((y) => (
                    <button
                      key={y}
                      onClick={() => setPartialYear(y)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-colors ${
                        partialYear === y
                          ? "bg-brand-900 dark:bg-white text-white dark:text-brand-900"
                          : "bg-white dark:bg-brand-700 border border-brand-200 dark:border-brand-600 text-brand-600 dark:text-brand-300"
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            )}
          {/* Format */}
          {partialType !== "all" && (
            <div>
              <label className="text-[10px] text-brand-400 font-bold uppercase tracking-tighter block mb-2">
                Format
              </label>
              <div className="flex gap-2">
                {(["json", "csv"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setPartialFormat(f)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase transition-colors ${
                      partialFormat === f
                        ? "bg-brand-900 dark:bg-white text-white dark:text-brand-900"
                        : "bg-white dark:bg-brand-700 border border-brand-200 dark:border-brand-600 text-brand-600 dark:text-brand-300"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={handlePartialExport}
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-900 dark:bg-white text-white dark:text-brand-900 rounded-2xl font-bold text-xs"
          >
            <Download size={14} /> Télécharger
          </button>
        </div>
      )}

      {lastBackupDate && (
        <p className="text-[11px] text-brand-400 dark:text-brand-500 text-center -mt-4">
          Dernière sauvegarde :{" "}
          <span className="font-semibold">{lastBackupDate}</span>
        </p>
      )}

      {/* Sample Data & Reset */}
      <div className="pt-4 border-t border-brand-100 dark:border-brand-800 space-y-3">
        <button
          onClick={() =>
            onGenerateSampleData(() => {
              setAllData.setClients([
                ...allData.clients,
                {
                  id: "c1",
                  name: "Acme Corp",
                  email: "contact@acme.com",
                  address: "10 Rue de la Paix, Paris",
                  category: "Entreprise",
                },
              ]);
            })
          }
          className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-brand-200 dark:border-brand-700 rounded-2xl text-brand-500 dark:text-brand-400 font-bold text-xs hover:border-brand-400 hover:text-brand-700 dark:hover:text-brand-200 transition-colors"
        >
          <Zap size={16} /> Données de Test
        </button>
        <p className="text-[11px] text-brand-400 text-center">
          Ajoute des clients, produits et factures fictives.
        </p>
        <button
          onClick={() => onResetData(() => {})}
          className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-red-200 dark:border-red-900/50 rounded-2xl text-red-500 dark:text-red-400 font-bold text-xs hover:border-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 size={16} /> Réinitialiser toutes les données
        </button>
        <p className="text-[11px] text-brand-400 text-center">
          Supprime définitivement toutes les données.
        </p>
      </div>

      {/* Cloud Synchronization */}
      <div className="bg-linear-to-br from-brand-50 to-white dark:from-brand-900/40 dark:to-brand-800/20 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-900 dark:bg-white text-white dark:text-brand-900 rounded-xl">
              <Cloud size={20} />
            </div>
            <h3 className="text-sm font-bold text-brand-900 dark:text-white font-display uppercase tracking-widest">
              Synchronisation Cloud
            </h3>
          </div>
          <div className="flex items-center gap-2 group">
            <div
              className={`w-2 h-2 rounded-full ${
                isSyncing
                  ? "bg-amber-500 animate-pulse"
                  : isFirebaseConnected
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : "bg-red-400"
              }`}
            />
            <span className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-tighter">
              {isSyncing
                ? "Synchro..."
                : isFirebaseConnected
                  ? "Connecté"
                  : "Non connecté"}
            </span>
          </div>
        </div>
        {isFirebaseConnected && connectedEmail && (
          <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
            <Mail
              size={13}
              className="text-emerald-600 dark:text-emerald-400 shrink-0"
            />
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 truncate">
              {connectedEmail}
            </p>
          </div>
        )}
        {!isFirebaseConnected && (
          <p className="mb-4 text-xs text-brand-400 dark:text-brand-500 text-center">
            Connectez-vous à un compte pour synchroniser vos données dans le
            cloud. En mode hors ligne, vos données restent stockées localement.
          </p>
        )}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-white/50 dark:bg-black/20 rounded-3xl border border-brand-100/50 dark:border-brand-700/50">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[10px] text-brand-400 font-bold uppercase mb-1">
              Dernière synchronisation
            </p>
            <p className="text-sm font-bold text-brand-900 dark:text-white">
              {isFirebaseConnected
                ? `Il y a ${Math.floor((Date.now() - lastSyncTime) / 60000)} minutes`
                : "Hors ligne — données locales uniquement"}
            </p>
          </div>
          <button
            onClick={() => {
              void onForceSync();
            }}
            disabled={isSyncing || !isFirebaseConnected}
            className="flex items-center gap-2 px-6 py-3 bg-brand-900 hover:bg-brand-800 dark:bg-white dark:text-brand-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            Forcer la synchro
          </button>
        </div>
      </div>

      {/* Data Governance */}
      <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
        <div className="flex items-center gap-3 mb-6 border-b border-brand-50 dark:border-brand-800 pb-4">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <Archive size={20} />
          </div>
          <h3 className="text-sm font-bold text-brand-900 dark:text-white font-display uppercase tracking-widest">
            Gouvernance des données
          </h3>
        </div>
        <div className="space-y-4">
          {/* Alerte auto : factures de plus de 10 ans détectées au chargement */}
          {oldInvoicesAlert && oldInvoicesAlert.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/50 rounded-2xl">
              <AlertTriangle
                size={15}
                className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
              />
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                  {oldInvoicesAlert.length} facture(s) de plus de 10 ans
                  détectée(s)
                </p>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                  Pensez à les archiver pour respecter l'obligation légale
                  (art. L110-4 C.com.).
                </p>
              </div>
              <button
                onClick={() => {
                  setOldInvoicesAlert(null);
                  prepareArchive();
                }}
                className="text-[10px] font-bold text-amber-700 dark:text-amber-300 underline shrink-0 hover:no-underline"
              >
                Archiver
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {archiveConfirm ? (
              <div className="sm:col-span-2 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl space-y-3">
                <div className="flex items-start gap-2">
                  <Archive
                    size={16}
                    className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                      {archiveConfirm.length} facture(s) de plus de 10 ans
                    </p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                      Un fichier JSON sera téléchargé pour conservation légale
                      (art.&nbsp;L110-4 C.com.), puis ces factures seront
                      retirées de l'application. Conservez ce fichier sur un
                      support sûr.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setArchiveConfirm(null)}
                    className="px-3 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-600 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmArchive}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Download size={12} /> Exporter et archiver
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={prepareArchive}
                className="p-4 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-700 rounded-2xl hover:bg-brand-100 transition-all text-left"
              >
                <p className="text-xs font-bold text-brand-900 dark:text-white">
                  Archiver (10 ans+)
                </p>
                <p className="text-[9px] text-brand-400 mt-1 uppercase tracking-tighter">
                  Conformité RGPD / Fiscale
                </p>
              </button>
            )}
            <button
              onClick={() => cleanOldData("drafts")}
              className="p-4 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-700 rounded-2xl hover:bg-brand-100 transition-all text-left"
            >
              <p className="text-xs font-bold text-brand-900 dark:text-white">
                Nettoyer Brouillons
              </p>
              <p className="text-[9px] text-brand-400 mt-1 uppercase tracking-tighter">
                Inutilisés depuis 6 mois
              </p>
            </button>
          </div>

          <div className="pt-4 mt-2 space-y-3">
            {mergeConfirm ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl space-y-3">
                <div className="flex items-start gap-2">
                  <User
                    size={16}
                    className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
                  />
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                    {mergeConfirm.groups.length} groupe(s) —{" "}
                    {mergeConfirm.groups.reduce(
                      (acc, g) => acc + g.duplicates.length,
                      0,
                    )}{" "}
                    client(s) supprimés après confirmation
                  </p>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {mergeConfirm.groups.map((g) => (
                    <div
                      key={g.keep.id}
                      className="p-2 bg-white/60 dark:bg-brand-800/40 rounded-xl text-[10px] space-y-0.5"
                    >
                      <p className="font-bold text-brand-900 dark:text-white">
                        « {g.keep.name} » — {g.duplicates.length} doublon(s)
                        conservé(s)
                      </p>
                      {g.invoiceCount > 0 && (
                        <p className="text-amber-700 dark:text-amber-400">
                          ↳ {g.invoiceCount} facture(s) réassignée(s) au client
                          conservé
                        </p>
                      )}
                      {g.diffs.length > 0 && (
                        <p className="text-red-600 dark:text-red-400">
                          ⚠ Données perdues : {g.diffs.join(" · ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setMergeConfirm(null)}
                    className="px-3 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-600 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmMerge}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors"
                  >
                    Confirmer la fusion
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={prepareMerge}
                className="w-full flex items-center justify-between p-4 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-700 rounded-2xl hover:bg-brand-100 transition-all group"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-brand-900 dark:text-white">
                    Clients en doublon
                  </p>
                  <p className="text-[10px] text-brand-400 mt-0.5">
                    Fusionner par nom identique
                  </p>
                </div>
                <ArrowRight
                  size={16}
                  className="text-brand-300 group-hover:translate-x-1 transition-transform"
                />
              </button>
            )}
            <button
              onClick={() => {
                handleCleanData("products");
              }}
              className="w-full flex items-center justify-between p-4 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-700 rounded-2xl hover:bg-brand-100 transition-all group"
            >
              <div className="text-left">
                <p className="text-sm font-bold text-brand-900 dark:text-white">
                  Produits inutilisés
                </p>
                <p className="text-[10px] text-brand-400 mt-0.5">
                  Supprimer les produits jamais facturés
                </p>
              </div>
              <ArrowRight
                size={16}
                className="text-brand-300 group-hover:translate-x-1 transition-transform"
              />
            </button>
            {productMergeConfirm ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl space-y-3">
                <div className="flex items-start gap-2">
                  <Shuffle
                    size={14}
                    className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                      {productMergeConfirm.groups.length} groupe(s) similaire(s)
                      trouvé(s)
                    </p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                      {productMergeConfirm.groups
                        .map(
                          (g) =>
                            `« ${g.duplicates.map((d) => d.name).join(", ")} » → « ${g.keep.name} »`,
                        )
                        .join(" | ")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setProductMergeConfirm(null);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-300 bg-brand-100 dark:bg-brand-800 rounded-xl hover:bg-brand-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      void confirmProductMerge();
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors"
                  >
                    Confirmer la fusion
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={prepareProductMerge}
                className="w-full flex items-center justify-between p-4 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-700 rounded-2xl hover:bg-brand-100 transition-all group"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-brand-900 dark:text-white">
                    Produits similaires
                  </p>
                  <p className="text-[10px] text-brand-400 mt-0.5">
                    Fusionner par nom quasi-identique (Levenshtein ≥75 %)
                  </p>
                </div>
                <Shuffle
                  size={16}
                  className="text-brand-300 group-hover:scale-110 transition-transform"
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Activity Logs */}
      {dataLogs.length > 0 && (
        <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
          <div className="flex items-center justify-between mb-6 border-b border-brand-50 dark:border-brand-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                <FileText size={20} />
              </div>
              <h3 className="text-sm font-bold text-brand-900 dark:text-white font-display">
                Dernières activités (Données)
              </h3>
            </div>
            {dataLogs.length > 5 && (
              <button
                onClick={() => {
                  setIsAuditLogOpen((v) => !v);
                }}
                className="flex items-center gap-1 text-[10px] font-bold text-brand-400 hover:text-brand-600 transition-colors px-2 py-1 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-800"
              >
                <HistoryIcon size={11} />
                {isAuditLogOpen
                  ? `Replier (${dataLogs.length})`
                  : `Tout voir (${dataLogs.length})`}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {(isAuditLogOpen ? dataLogs : dataLogs.slice(0, 5)).map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 p-3 bg-brand-50/30 dark:bg-brand-800/20 rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-brand-800 flex items-center justify-center text-brand-400">
                  {log.action.includes("Export") ? (
                    <Download size={14} />
                  ) : (
                    <Upload size={14} />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-brand-700 dark:text-brand-300 truncate">
                    {log.action}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-brand-400">
                      {new Date(log.timestamp).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-[9px] text-brand-300">•</span>
                    <span className="text-[9px] text-brand-400 flex items-center gap-1">
                      <User size={8} />{" "}
                      {userProfile.companyName ?? "Utilisateur"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────── Modal : prévisualisation import ───────────────────── */}
      {importPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-900 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-50 dark:bg-brand-800 rounded-xl">
                <Eye size={18} className="text-brand-600 dark:text-brand-300" />
              </div>
              <h3 className="text-base font-bold text-brand-900 dark:text-white">
                Prévisualisation de l’import
              </h3>
            </div>
            <p className="text-[11px] text-brand-500 dark:text-brand-400">
              Les données existantes seront <strong>remplacées</strong> par le
              contenu du fichier :
            </p>
            <ul className="space-y-2">
              {(
                [
                  ["Factures", importPreview.raw.invoices],
                  ["Clients", importPreview.raw.clients],
                  ["Fournisseurs", importPreview.raw.suppliers],
                  ["Produits", importPreview.raw.products],
                  ["Dépenses", importPreview.raw.expenses],
                ] as [string, unknown[]][]
              ).map(
                ([label, items]) =>
                  items && (
                    <li
                      key={label}
                      className="flex items-center justify-between text-xs px-3 py-2 bg-brand-50 dark:bg-brand-800 rounded-xl"
                    >
                      <span className="font-bold text-brand-700 dark:text-brand-200">
                        {label}
                      </span>
                      <span className="text-brand-400">
                        {(items as unknown[]).length} élément(s)
                      </span>
                    </li>
                  ),
              )}
            </ul>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  setImportPreview(null);
                }}
                className="px-4 py-2 text-xs font-bold text-brand-600 dark:text-brand-300 bg-brand-100 dark:bg-brand-800 rounded-xl hover:bg-brand-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  void confirmImport();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors"
              >
                Confirmer l’import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────── Modal : export chiffré AES-256 ─────────────────────── */}
      {isEncryptModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-900 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-50 dark:bg-brand-800 rounded-xl">
                <Lock
                  size={18}
                  className="text-brand-600 dark:text-brand-300"
                />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-900 dark:text-white">
                  Chiffrer le backup (AES-256)
                </h3>
                <p className="text-[10px] text-brand-400 mt-0.5">
                  Dérivation PBKDF2 · 100 000 itérations
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={encryptPwdVisible ? "text" : "password"}
                  value={encryptPassword}
                  onChange={(e) => {
                    setEncryptPassword(e.target.value);
                  }}
                  placeholder="Mot de passe"
                  className="w-full text-sm px-4 py-3 pr-10 rounded-2xl bg-brand-50 dark:bg-brand-800 border border-brand-200 dark:border-brand-700 text-brand-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    setEncryptPwdVisible((v) => !v);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600"
                >
                  {encryptPwdVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <input
                type={encryptPwdVisible ? "text" : "password"}
                value={encryptPasswordConfirm}
                onChange={(e) => {
                  setEncryptPasswordConfirm(e.target.value);
                }}
                placeholder="Confirmer le mot de passe"
                className="w-full text-sm px-4 py-3 rounded-2xl bg-brand-50 dark:bg-brand-800 border border-brand-200 dark:border-brand-700 text-brand-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-400"
              />
              {encryptPassword &&
                encryptPasswordConfirm &&
                encryptPassword !== encryptPasswordConfirm && (
                  <p className="text-[11px] text-red-500">
                    Les mots de passe ne correspondent pas.
                  </p>
                )}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsEncryptModalOpen(false);
                  setEncryptPassword("");
                  setEncryptPasswordConfirm("");
                }}
                className="px-4 py-2 text-xs font-bold text-brand-600 dark:text-brand-300 bg-brand-100 dark:bg-brand-800 rounded-xl hover:bg-brand-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  void handleEncryptedExport();
                }}
                disabled={
                  isEncrypting ||
                  !encryptPassword ||
                  encryptPassword !== encryptPasswordConfirm
                }
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isEncrypting ? (
                  "Chiffrement…"
                ) : (
                  <>
                    <Lock size={13} /> Exporter chiffré
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────── Modal : import déchiffrement ──────────────────────── */}
      {decryptModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-900 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
                <Lock
                  size={18}
                  className="text-amber-600 dark:text-amber-400"
                />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-900 dark:text-white">
                  Backup chiffré détecté
                </h3>
                <p className="text-[10px] text-brand-400 mt-0.5">
                  Entrez le mot de passe pour déchiffrer et importer
                </p>
              </div>
            </div>
            <div className="relative">
              <input
                type={decryptPwdVisible ? "text" : "password"}
                value={decryptPassword}
                onChange={(e) => {
                  setDecryptPassword(e.target.value);
                }}
                placeholder="Mot de passe"
                className="w-full text-sm px-4 py-3 pr-10 rounded-2xl bg-brand-50 dark:bg-brand-800 border border-brand-200 dark:border-brand-700 text-brand-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-400"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setDecryptPwdVisible((v) => !v);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600"
              >
                {decryptPwdVisible ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDecryptModal(null);
                  setDecryptPassword("");
                }}
                className="px-4 py-2 text-xs font-bold text-brand-600 dark:text-brand-300 bg-brand-100 dark:bg-brand-800 rounded-xl hover:bg-brand-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  void confirmDecrypt();
                }}
                disabled={isDecrypting || !decryptPassword}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDecrypting ? (
                  "Déchiffrement…"
                ) : (
                  <>
                    <Lock size={13} /> Déchiffrer et importer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTab;

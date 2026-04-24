import JSZip from "jszip";
import type {
  CalendarEvent,
  Client,
  Email,
  EmailTemplate,
  Expense,
  Invoice,
  Product,
  Supplier,
  UserProfile,
} from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Version courante du format d'export. Incrémenter à chaque rupture de schéma. */
export const CURRENT_EXPORT_VERSION = "1.0";

export interface ExportData {
  version: string;
  exportedAt: string;
  userProfile?: UserProfile;
  invoices: Invoice[];
  clients: Client[];
  suppliers: Supplier[];
  products: Product[];
  expenses: Expense[];
  emails: Email[];
  emailTemplates: EmailTemplate[];
  calendarEvents: CalendarEvent[];
}

// ─── Fonctions utilitaires ────────────────────────────────────────────────────

/**
 * Génère un package ZIP conforme RGPD contenant toutes les données utilisateur
 * @param data Données complètes à exporter
 * @returns Blob ZIP
 */
export async function generateRGPDZip(data: ExportData): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder(
    `rgpd-export-${new Date().toISOString().slice(0, 10)}`,
  );

  if (!folder) throw new Error("Erreur de création du dossier ZIP");

  // 1. JSON complet (Machine readable)
  folder.file("data-complete.json", JSON.stringify(data, null, 2));

  // 2. CSV individuels (Excel readable)
  folder.file("clients.csv", exportAsCSV("clients", data.clients));
  folder.file("invoices.csv", exportAsCSV("invoices", data.invoices));
  folder.file("expenses.csv", exportAsCSV("expenses", data.expenses));
  folder.file("products.csv", exportAsCSV("products", data.products));
  folder.file("suppliers.csv", exportAsCSV("suppliers", data.suppliers));

  // 3. Notice d'information
  const readme = `EXPORT RGPD - MICRO-GESTION FACILE
Généré le : ${new Date().toLocaleString("fr-FR")}

Ce fichier contient l'intégralité de vos données personnelles et professionnelles
stockées dans l'application, conformément au Droit à la Portabilité (Art. 20 du RGPD).

Contenu :
- data-complete.json : Format technique pour import dans un autre logiciel.
- *.csv : Fichiers lisibles via Excel ou Tableur.
`;
  folder.file("README.txt", readme);

  return await zip.generateAsync({ type: "blob" });
}

export function generateFilename(
  type: string,
  format: "json" | "csv" | "zip",
): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  return `micro-gestion-${type}-${date}.${format}`;
}

export async function exportAsJSON(data: Partial<ExportData>): Promise<Blob> {
  const payload: Partial<ExportData> = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    ...data,
  };
  const json = JSON.stringify(payload, null, 2);
  return new Blob([json], { type: "application/json" });
}

export function exportAsCSV(collectionKey: string, rows: unknown[]): Blob {
  if (rows.length === 0) return new Blob([""], { type: "text/csv" });

  const headers = Object.keys(rows[0] as Record<string, unknown>).join(";");
  const lines = (rows as Record<string, unknown>[]).map((row) =>
    Object.values(row)
      .map((v) => {
        const s = String(v ?? "");
        return s.includes(";") || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      })
      .join(";"),
  );

  const csv = [headers, ...lines].join("\n");
  return new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }); // BOM pour Excel
}

/**
 * Génère un script SQL compatible SQLite/PostgreSQL pour exporter les données
 */
export function exportAsSQL(data: ExportData): Blob {
  let sql = `-- EXPORT SQL - MICRO-GESTION FACILE\n`;
  sql += `-- Généré le : ${new Date().toLocaleString("fr-FR")}\n\n`;

  // Helper pour échapper les chaînes SQL
  const esc = (val: unknown) => {
    if (val === null || val === undefined) return "NULL";
    if (typeof val === "boolean") return val ? "1" : "0";
    if (typeof val === "number") return val.toString();
    return `'${String(val).replace(/'/g, "''")}'`;
  };

  const collections: (keyof ExportData)[] = [
    "clients",
    "invoices",
    "suppliers",
    "products",
    "expenses",
  ];

  collections.forEach((key) => {
    const rows = data[key] as unknown as Record<string, unknown>[];
    if (!rows || rows.length === 0) return;

    sql += `\n-- Table ${key}\n`;
    const columns = Object.keys(rows[0] as Record<string, unknown>);

    rows.forEach((row) => {
      const values = columns
        .map((col) => esc((row as Record<string, unknown>)[col]))
        .join(", ");
      sql += `INSERT INTO ${key} (${columns.join(", ")}) VALUES (${values});\n`;
    });
  });

  return new Blob([sql], { type: "text/sql" });
}

export function downloadFile(
  blob: Blob,
  filename: string,
  _mimeType?: string,
): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseImportJSON(
  file: File,
): Promise<Partial<ExportData>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(
          e.target?.result as string,
        ) as Partial<ExportData>;
        resolve(data);
      } catch {
        reject(new Error("Fichier JSON invalide."));
      }
    };
    reader.onerror = () => reject(new Error("Erreur de lecture du fichier."));
    reader.readAsText(file);
  });
}

// ─── Validation à l'import ────────────────────────────────────────────────────

export interface ImportValidationResult {
  isValid: boolean;
  /** false si la version du fichier est incompatible avec l'application */
  isVersionCompatible: boolean;
  detectedVersion?: string;
  /** Messages à afficher à l'utilisateur (avertissements non bloquants) */
  warnings: string[];
}

/**
 * Valide le contenu d'un fichier importé :
 * - Présence et compatibilité du champ `version`
 * - Présence d'au moins un champ de données connu
 *
 * Cette fonction NE modifie pas les données ; elle ne fait que les inspecter.
 */
export function validateImportData(data: unknown): ImportValidationResult {
  const warnings: string[] = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      isValid: false,
      isVersionCompatible: false,
      warnings: ["Le fichier est vide ou malformé."],
    };
  }

  const obj = data as Record<string, unknown>;
  const detectedVersion =
    typeof obj.version === "string" ? obj.version : undefined;

  if (!detectedVersion) {
    warnings.push(
      "Ce fichier ne contient pas de numéro de version. Il peut provenir d'une version ancienne de l'application.",
    );
  }

  // Compatibilité : toute version "1.x" est acceptée
  const majorCurrent = CURRENT_EXPORT_VERSION.split(".")[0];
  const majorDetected = detectedVersion?.split(".")[0];
  const isVersionCompatible = !majorDetected || majorDetected === majorCurrent;

  if (detectedVersion && !isVersionCompatible) {
    warnings.push(
      `Version incompatible : fichier v${detectedVersion}, application v${CURRENT_EXPORT_VERSION}. Certaines données peuvent ne pas s'importer correctement.`,
    );
  }

  const knownFields = [
    "userProfile",
    "invoices",
    "clients",
    "products",
    "suppliers",
    "expenses",
  ];
  const hasAnyKnownField = knownFields.some((f) => f in obj);

  if (!hasAnyKnownField) {
    return {
      isValid: false,
      isVersionCompatible,
      detectedVersion,
      warnings: [
        ...warnings,
        "Format non reconnu : aucune donnée connue dans ce fichier.",
      ],
    };
  }

  return { isValid: true, isVersionCompatible, detectedVersion, warnings };
}

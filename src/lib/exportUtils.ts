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

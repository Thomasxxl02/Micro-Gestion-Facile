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

export function generateFilename(type: string, format: "json" | "csv"): string {
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

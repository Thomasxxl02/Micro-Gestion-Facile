/**
 * Utilitaires d'export de données
 * Support: JSON, CSV, avec chiffrement E2E optionnel
 * Conformité: RGPD Art. 20 (droit à la portabilité)
 */

import { Decimal } from 'decimal.js';
import {
  type UserProfile,
  type Invoice,
  type Client,
  type Supplier,
  type Product,
  type Expense,
  type Email,
  type EmailTemplate,
  type CalendarEvent,
} from '../types';

export interface ExportOptions {
  format: 'json' | 'csv';
  includeMetadata?: boolean;
  encrypt?: boolean;
  password?: string;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  userProfile: UserProfile;
  invoices: Invoice[];
  clients: Client[];
  suppliers: Supplier[];
  products: Product[];
  expenses: Expense[];
  emails: Email[];
  emailTemplates: EmailTemplate[];
  calendarEvents: CalendarEvent[];
}

const defaultUserProfile: UserProfile = {
  companyName: '',
  siret: '',
  address: '',
  email: '',
  phone: '',
};

/**
 * Exporter todas les données au format JSON
 * Contient métadonnées + tous les documents
 */
export const exportAsJSON = async (data: Partial<ExportData>): Promise<string> => {
  const exportPayload: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    userProfile: data.userProfile || defaultUserProfile,
    invoices: data.invoices || [],
    clients: data.clients || [],
    suppliers: data.suppliers || [],
    products: data.products || [],
    expenses: data.expenses || [],
    emails: data.emails || [],
    emailTemplates: data.emailTemplates || [],
    calendarEvents: data.calendarEvents || [],
  };

  // Converter Decimal to string for JSON serialization
  const sanitized = sanitizeForJSON(exportPayload);

  return JSON.stringify(sanitized, null, 2);
};

/**
 * Sanitize Decimal values et autres objets non-sérialisables
 */
const sanitizeForJSON = (obj: unknown): unknown => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (obj instanceof Decimal) {
    return obj.toString();
  }
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeForJSON);
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeForJSON(value);
    }
    return sanitized;
  }

  return obj;
};

/**
 * Exporter collections au format CSV
 * Applicable pour: invoices, clients, suppliers, products, expenses
 */
export const exportAsCSV = (
  collection: string,
  data: unknown[],
  customHeaders?: Record<string, string>
): string => {
  if (!data || data.length === 0) {
    return `# ${collection}: No data to export`;
  }

  // Auto-detect headers from first object
  const firstItem = data[0] as Record<string, unknown>;
  const headers = Object.keys(firstItem);
  const csvHeaders = headers
    .map((h) => customHeaders?.[h] || h)
    .map(escapeCsvField)
    .join(',');

  // Convert rows
  const csvRows = data.map((item) => {
    const row = item as Record<string, unknown>;
    return headers
      .map((h) => {
        const value = row[h];
        if (value instanceof Decimal) {
          return escapeCsvField(value.toString());
        }
        if (value instanceof Date) {
          return escapeCsvField(value.toISOString());
        }
        if (value === null || value === undefined) {
          return '""';
        }
        if (typeof value === 'object') {
          return escapeCsvField(JSON.stringify(value));
        }
        return escapeCsvField(String(value));
      })
      .join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
};

/**
 * Escape CSV field (entourer de guillemets si nécessaire)
 */
const escapeCsvField = (field: string): string => {
  const field_str = String(field);
  if (field_str.includes(',') || field_str.includes('"') || field_str.includes('\n')) {
    return '"' + field_str.replaceAll('"', '""') + '"';
  }
  return field_str;
};

/**
 * Télécharger fichier client-side
 */
export const downloadFile = (
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/**
 * Générer filename avec timestamp
 */
export const generateFilename = (
  collection: string,
  format: 'json' | 'csv',
  encrypted = false
): string => {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const ext = format === 'json' ? 'json' : 'csv';
  const encryptedExt = encrypted ? '.enc' : '';
  return `micro-gestion-${collection}-${timestamp}.${ext}${encryptedExt}`;
};

/**
 * Valider schéma JSON export (vérifier intégrité)
 */
export const validateExportSchema = (
  data: Record<string, unknown>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.version) {
    errors.push('Missing version field');
  }
  if (!data.exportedAt) {
    errors.push('Missing exportedAt field');
  }
  if (!Array.isArray(data.invoices)) {
    errors.push('invoices must be array');
  }
  if (!Array.isArray(data.clients)) {
    errors.push('clients must be array');
  }

  // Validate invoice structure sample
  if (Array.isArray(data.invoices) && data.invoices.length > 0) {
    const inv = data.invoices[0] as Record<string, unknown>;
    if (!inv.id || !inv.number || !inv.totalHT) {
      errors.push('Invalid invoice structure');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Estimer taille données (for UX feedback)
 */
export const estimateExportSize = (data: Partial<ExportData>): { bytes: number; mb: string } => {
  const jsonString = JSON.stringify(sanitizeForJSON(data));
  const bytes = new TextEncoder().encode(jsonString).length;
  const mb = (bytes / 1024 / 1024).toFixed(2);
  return { bytes, mb };
};

/**
 * Compter documents par collection
 */
export const countDocuments = (data: Partial<ExportData>): Record<string, number> => {
  return {
    invoices: data.invoices?.length || 0,
    clients: data.clients?.length || 0,
    suppliers: data.suppliers?.length || 0,
    products: data.products?.length || 0,
    expenses: data.expenses?.length || 0,
    emails: data.emails?.length || 0,
    emailTemplates: data.emailTemplates?.length || 0,
    calendarEvents: data.calendarEvents?.length || 0,
  };
};

/**
 * Parser JSON for import (avec validation)
 */
export const parseImportJSON = (
  json: string
): { valid: boolean; data?: ExportData; error?: string } => {
  try {
    const data = JSON.parse(json);
    const validation = validateExportSchema(data);
    if (!validation.valid) {
      return { valid: false, error: validation.errors.join(', ') };
    }
    return { valid: true, data };
  } catch (e) {
    return { valid: false, error: `Invalid JSON: ${(e as Error).message}` };
  }
};

/**
 * Fusionner données export avec données existantes
 * Stratégies: 'overwrite' | 'rename' | 'merge'
 */
export const mergeImportData = (
  existing: Partial<ExportData>,
  imported: Partial<ExportData>,
  strategy: 'overwrite' | 'rename' | 'merge' = 'merge'
): Partial<ExportData> => {
  switch (strategy) {
    case 'overwrite':
      return imported;

    case 'rename':
      // Rename imported items with suffix
      return {
        ...existing,
        invoices: [
          ...(existing.invoices || []),
          ...(imported.invoices || []).map((inv: Invoice) => ({
            ...inv,
            number: `${inv.number}-IMPORTED`,
          })),
        ],
        // Similar for other collections...
      };

    case 'merge':
    default: {
      // Deduplicate by ID, imported takes precedence
      const invoiceMap = new Map<string, Invoice>(
        (existing.invoices || []).map((i) => [i.id, i])
      );
      (imported.invoices || []).forEach((i) => invoiceMap.set(i.id, i));

      const clientMap = new Map<string, Client>(
        (existing.clients || []).map((c) => [c.id, c])
      );
      (imported.clients || []).forEach((c) => clientMap.set(c.id, c));

      return {
        ...existing,
        invoices: Array.from(invoiceMap.values()),
        clients: Array.from(clientMap.values()),
        // Similar for other collections...
      };
    }
  }
};

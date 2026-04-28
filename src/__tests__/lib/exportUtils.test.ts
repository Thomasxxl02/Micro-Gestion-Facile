/**
 * Tests — src/lib/exportUtils.ts
 */
import { describe, expect, it } from "vitest";
import {
  exportAsCSV,
  exportAsJSON,
  exportAsSQL,
  generateFilename,
  generateRGPDZip,
  CURRENT_EXPORT_VERSION,
} from "../../lib/exportUtils";
import type { ExportData } from "../../lib/exportUtils";

const makeExportData = (overrides: Partial<ExportData> = {}): ExportData => ({
  version: CURRENT_EXPORT_VERSION,
  exportedAt: new Date().toISOString(),
  invoices: [],
  clients: [],
  suppliers: [],
  products: [],
  expenses: [],
  emails: [],
  emailTemplates: [],
  calendarEvents: [],
  ...overrides,
});

describe("exportUtils", () => {
  describe("CURRENT_EXPORT_VERSION", () => {
    it("est une chaîne non vide", () => {
      expect(typeof CURRENT_EXPORT_VERSION).toBe("string");
      expect(CURRENT_EXPORT_VERSION.length).toBeGreaterThan(0);
    });
  });

  describe("generateFilename", () => {
    it("génère un nom de fichier avec le type et le format", () => {
      const name = generateFilename("invoices", "json");
      expect(name).toMatch(/^micro-gestion-invoices-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it("génère un nom de fichier CSV", () => {
      const name = generateFilename("clients", "csv");
      expect(name).toMatch(/\.csv$/);
    });

    it("génère un nom de fichier ZIP", () => {
      const name = generateFilename("all", "zip");
      expect(name).toMatch(/\.zip$/);
    });
  });

  describe("exportAsCSV", () => {
    it("retourne un Blob vide pour un tableau vide", async () => {
      const blob = exportAsCSV("clients", []);
      expect(blob).toBeInstanceOf(Blob);
      const text = await blob.text();
      expect(text).toBe("");
    });

    it("génère des en-têtes CSV à partir des clés de l'objet", async () => {
      const data = [{ name: "Alice", email: "alice@test.com" }];
      const blob = exportAsCSV("clients", data);
      const text = await blob.text();
      expect(text).toContain("name");
      expect(text).toContain("email");
    });

    it("génère une ligne pour chaque objet", async () => {
      const data = [
        { name: "Alice", amount: 100 },
        { name: "Bob", amount: 200 },
      ];
      const blob = exportAsCSV("test", data);
      const text = await blob.text();
      const lines = text.trim().split("\n");
      // 1 header + 2 data lines
      expect(lines).toHaveLength(3);
    });

    it("échappe les valeurs contenant des points-virgules", async () => {
      const data = [{ description: "Service; consulting" }];
      const blob = exportAsCSV("test", data);
      const text = await blob.text();
      expect(text).toContain('"Service; consulting"');
    });

    it("échappe les valeurs contenant des sauts de ligne", async () => {
      const data = [{ description: "Line1\nLine2" }];
      const blob = exportAsCSV("test", data);
      const text = await blob.text();
      expect(text).toContain('"Line1\nLine2"');
    });

    it("utilise ; comme séparateur", async () => {
      const data = [{ a: "1", b: "2" }];
      const blob = exportAsCSV("test", data);
      const text = await blob.text();
      // Header line should have ;
      expect(text).toContain("a;b");
    });

    it("inclut le BOM UTF-8 pour la compatibilité Excel", async () => {
      const data = [{ name: "Test" }];
      const blob = exportAsCSV("test", data);
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      // BOM UTF-8: EF BB BF (0xEF, 0xBB, 0xBF)
      expect(bytes[0]).toBe(0xef);
      expect(bytes[1]).toBe(0xbb);
      expect(bytes[2]).toBe(0xbf);
    });
  });

  describe("exportAsJSON", () => {
    it("retourne un Blob JSON valide", async () => {
      const data = makeExportData({ clients: [] });
      const blob = await exportAsJSON(data);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("application/json");
    });

    it("le JSON contient une version et exportedAt", async () => {
      const blob = await exportAsJSON({});
      const text = await blob.text();
      const parsed = JSON.parse(text);
      expect(parsed).toHaveProperty("version");
      expect(parsed).toHaveProperty("exportedAt");
    });

    it("inclut les données passées en paramètre", async () => {
      const clients = [{ id: "c1", name: "Alice" }];
      const blob = await exportAsJSON({ clients } as Partial<ExportData>);
      const text = await blob.text();
      const parsed = JSON.parse(text);
      expect(parsed.clients).toEqual(clients);
    });
  });

  describe("exportAsSQL", () => {
    it("retourne un Blob SQL", async () => {
      const data = makeExportData();
      const blob = exportAsSQL(data);
      expect(blob).toBeInstanceOf(Blob);
      const text = await blob.text();
      expect(text).toContain("EXPORT SQL");
    });

    it("génère des INSERT pour les clients", async () => {
      const data = makeExportData({
        clients: [{ id: "c1", name: "Alice" }] as ExportData["clients"],
      });
      const blob = exportAsSQL(data);
      const text = await blob.text();
      expect(text).toContain("INSERT INTO clients");
      expect(text).toContain("Alice");
    });

    it("gère les valeurs null et booléennes", async () => {
      const data = makeExportData({
        clients: [{ id: "c1", name: null, active: true }] as unknown as ExportData["clients"],
      });
      const blob = exportAsSQL(data);
      const text = await blob.text();
      expect(text).toContain("NULL");
      expect(text).toContain("1"); // true → 1
    });

    it("échappe les apostrophes dans les valeurs SQL", async () => {
      const data = makeExportData({
        clients: [{ id: "c1", name: "O'Brien" }] as ExportData["clients"],
      });
      const blob = exportAsSQL(data);
      const text = await blob.text();
      expect(text).toContain("O''Brien");
    });
  });

  describe("generateRGPDZip", () => {
    it("retourne un Blob ZIP non vide", async () => {
      const blob = await generateRGPDZip(makeExportData());
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it("le type MIME est application/zip", async () => {
      const blob = await generateRGPDZip(makeExportData());
      // JSZip generates zip blobs
      expect(blob.size).toBeGreaterThan(0);
    });
  });
});

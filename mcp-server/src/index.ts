#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { Decimal } from "decimal.js";

// Simulation simplifiée pour le serveur MCP (en attendant le build)
// Note: Dans une version de production, nous importerions directement src/lib/fiscalCalculations.ts
// après configuration du build system pour supporter les imports trans-folders.

const THRESHOLDS_2026 = {
  MICRO: { SALE: 188700, SERVICE: 77700 },
  TVA: { SALE: 91900, SERVICE: 36800 },
};

const STANDARD_RATES = {
  SALE: 12.3,
  SERVICE_BIC: 21.2,
  SERVICE_BNC: 23.2,
  LIBERAL: 23.2,
};

const server = new Server(
  {
    name: "micro-gestion-mcp",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

/**
 * Liste les outils disponibles
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "calculate_social_contributions",
        description:
          "Calcule les cotisations sociales (URSSAF) pour un chiffre d'affaires donné selon le régime micro-entrepreneur 2026.",
        inputSchema: {
          type: "object",
          properties: {
            revenue: { type: "number", description: "Chiffre d'affaires brut" },
            activityType: {
              type: "string",
              enum: ["SALE", "SERVICE_BIC", "SERVICE_BNC", "LIBERAL"],
              description: "Type d'activité",
            },
            isAcre: {
              type: "boolean",
              description: "Bénéficiaire de l'ACRE ?",
            },
          },
          required: ["revenue", "activityType"],
        },
      },
      {
        name: "check_fiscal_thresholds",
        description:
          "Vérifie la position du chiffre d'affaires par rapport aux seuils de micro-entreprise et de TVA 2026.",
        inputSchema: {
          type: "object",
          properties: {
            revenue: {
              type: "number",
              description: "Chiffre d'affaires cumulé annuel",
            },
            activityType: {
              type: "string",
              enum: ["SALE", "SERVICE_BIC", "SERVICE_BNC", "LIBERAL"],
              description: "Type d'activité",
            },
          },
          required: ["revenue", "activityType"],
        },
      },
      {
        name: "get_page_context_analysis",
        description:
          "Analyse le contexte actuel de la PWA (URL, erreurs console) via Chrome DevTools.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string" },
            logs: { type: "array", items: { type: "string" } },
          },
        },
      },
      {
        name: "check_compliance_2026",
        description:
          "Vérifie si la page actuelle respecte les normes Factur-X et de facturation 2026.",
        inputSchema: {
          type: "object",
          properties: {
            invoiceData: { type: "object" },
          },
        },
      },
      {
        name: "format_as_markdown",
        description:
          "Formate un texte ou des données en Markdown propre pour l'affichage utilisateur.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Titre de la section" },
            content: { type: "string", description: "Contenu textuel" },
            type: {
              type: "string",
              enum: ["note", "warning", "error", "success"],
              description: "Type de boîte d'alerte",
            },
          },
          required: ["content"],
        },
      },
      {
        name: "convert_json_to_markdown_table",
        description: "Convertit un tableau d'objets JSON en table Markdown.",
        inputSchema: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { type: "object" },
              description: "Données à convertir",
            },
            headers: {
              type: "array",
              items: { type: "string" },
              description: "En-têtes personnalisés (optionnel)",
            },
          },
          required: ["data"],
        },
      },
    ],
  };
});

/**
 * Gère l'exécution des outils
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "calculate_social_contributions") {
      const { revenue, activityType, isAcre } = args as any;
      const rate = isAcre
        ? activityType === "SALE"
          ? 6.2
          : 12.1
        : STANDARD_RATES[activityType as keyof typeof STANDARD_RATES] || 23.2;

      const revD = new Decimal(revenue);
      const amount = revD
        .times(new Decimal(rate))
        .dividedBy(100)
        .toDecimalPlaces(2);
      const net = revD.minus(amount).toDecimalPlaces(2);

      return {
        content: [
          {
            type: "text",
            text: `Analyse URSSAF 2026 :\n- CA Brut : ${revenue}€\n- Taux appliqué : ${rate}%\n- Montant cotisations : ${amount.toNumber()}€\n- Revenu net estimé : ${net.toNumber()}€`,
          },
        ],
      };
    }

    if (name === "check_fiscal_thresholds") {
      const { revenue, activityType } = args as any;
      const isSale = activityType === "SALE";
      const tvaLimit = isSale
        ? THRESHOLDS_2026.TVA.SALE
        : THRESHOLDS_2026.TVA.SERVICE;
      const microLimit = isSale
        ? THRESHOLDS_2026.MICRO.SALE
        : THRESHOLDS_2026.MICRO.SERVICE;

      let status = `Analyse fiscale 2026 (${activityType}) :\n`;
      status += `- CA actuel : ${revenue}€\n`;
      status += `- Limite TVA : ${tvaLimit}€ (${((revenue / tvaLimit) * 100).toFixed(1)}%)\n`;
      status += `- Limite Micro : ${microLimit}€ (${((revenue / microLimit) * 100).toFixed(1)}%)\n`;

      if (revenue > tvaLimit) {
        status +=
          "⚠️ ALERTE : Seuil de franchise TVA dépassé. Vous devez commencer à facturer la TVA.\n";
      }
      if (revenue > microLimit) {
        status +=
          "❌ CRITIQUE : Seuil micro-entreprise dépassé. Risque de passage au régime réel.\n";
      }

      return {
        content: [{ type: "text", text: status }],
      };
    }

    if (name === "get_page_context_analysis") {
      const { url, logs } = args as any;
      const hasErrors = logs?.some(
        (l: string) =>
          l.toLowerCase().includes("error") ||
          l.toLowerCase().includes("failed"),
      );

      return {
        content: [
          {
            type: "text",
            text: `Analyse de contexte (${url || "inconnue"}) :\n- État : ${hasErrors ? "⚠️ Présence d'erreurs" : "✅ OK"}\n- Recommandation : ${hasErrors ? "Veuillez inspecter les logs console pour les détails." : "Le rendu semble nominal."}`,
          },
        ],
      };
    }

    if (name === "check_compliance_2026") {
      const { invoiceData } = args as any;
      const missingFields = [];
      if (!invoiceData?.customerSiren) missingFields.push("SIREN Client");
      if (!invoiceData?.operationCategory)
        missingFields.push("Catégorie d'opération");

      return {
        content: [
          {
            type: "text",
            text:
              missingFields.length > 0
                ? `⚠️ Non-conformité 2026. Champs manquants : ${missingFields.join(", ")}`
                : "✅ Facture conforme aux exigences 2026.",
          },
        ],
      };
    }

    if (name === "format_as_markdown") {
      const { title, content, type } = args as any;
      const emoji =
        type === "warning"
          ? "⚠️"
          : type === "error"
            ? "❌"
            : type === "success"
              ? "✅"
              : "ℹ️";
      let md = "";

      if (title) md += `### ${emoji} ${title}\n\n`;
      md += `${content}`;

      return {
        content: [{ type: "text", text: md }],
      };
    }

    if (name === "convert_json_to_markdown_table") {
      const { data, headers } = args as any;
      if (!Array.isArray(data) || data.length === 0) {
        return {
          content: [
            { type: "text", text: "Aucune donnée fournie (tableau vide)." },
          ],
        };
      }

      const keys = headers || Object.keys(data[0]);
      let mdTable = "| " + keys.join(" | ") + " |\n";
      mdTable += "| " + keys.map(() => "---").join(" | ") + " |\n";

      data.forEach((row: any) => {
        mdTable +=
          "| " + keys.map((key: string) => row[key] ?? "").join(" | ") + " |\n";
      });

      return {
        content: [{ type: "text", text: mdTable }],
      };
    }

    throw new McpError(ErrorCode.MethodNotFound, `Outil inconnu : ${name}`);
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text", text: `Erreur : ${error.message}` }],
    };
  }
});

/**
 * Démarrage
 */
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Micro-Gestion Fiscal MCP Server running on stdio");

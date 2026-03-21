import { http, HttpResponse } from 'msw';

const mockItem = {
  description: 'Consulting IT',
  quantity: 3,
  unitPrice: 500,
  unit: 'jour',
  subject: 'Facture N°123',
  body: 'Corps de l email',
  isCompliant: true,
  issues: ['Issue'],
  suggestions: ['Ok'],
  predictedBalance: 5000,
  riskLevel: 'low',
  date: '2026-03-20',
  amount: 1500,
  vatAmount: 0,
  vatRate: 0,
  supplierName: 'Fournisseur'
};

const mockAssistantResponse = "Bonjour ! Je suis votre assistant de gestion. Comment puis-je vous aider aujourd'hui ?";

export const handlers = [
  // On intercepte TOUTES les requêtes JSON de Gemini
  // Utilisation d'un regex simple plutôt que path-to-regexp pour éviter les erreurs de parsing d'URL complexes
  http.post(/^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/.*:generateContent$/, async ({ request }) => {
    const body = await request.json() as any;
    const isJsonRequest = body?.generationConfig?.responseMimeType === 'application/json';

    return HttpResponse.json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: isJsonRequest ? JSON.stringify([mockItem]) : mockAssistantResponse
              }
            ]
          }
        }
      ],
    });
  }),
];

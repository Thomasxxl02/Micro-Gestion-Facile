import { describe, it, expect } from 'vitest';
import { EmailService } from '../../services/emailService';
import { UserProfile } from '../../types';

describe('EmailService', () => {
  it('should interpolate variables correctly', () => {
    const text = "Bonjour {{client_name}}, votre facture {{invoice_number}} est disponible.";
    const variables = {
      client_name: "Jean Dupont",
      invoice_number: "FAC-2026-001"
    };
    
    const result = EmailService.interpolate(text, variables);
    expect(result).toBe("Bonjour Jean Dupont, votre facture FAC-2026-001 est disponible.");
  });

  it('should handle missing variables by keeping the tag', () => {
    const text = "Facture {{invoice_number}} pour {{unknown_tag}}";
    const variables = {
      invoice_number: "FAC-001"
    };
    
    const result = EmailService.interpolate(text, variables);
    expect(result).toBe("Facture FAC-001 pour {{unknown_tag}}");
  });

  it('should prepare invoice variables correctly', () => {
    const invoice = {
      id: "inv-123",
      number: "FAC-999",
      date: "2026-04-29",
      dueDate: "2026-05-29",
      total: 1500,
      type: "invoice" as const,
      clientId: "client-1",
      items: [],
      status: "sent" as const
    };
    const client = { id: "client-1", name: "Client Test", email: "client@test.com", address: "123 Rue Test" };
    const userProfile: Partial<UserProfile> = {
      companyName: "Ma Boite",
      currency: "€",
      professionalTitle: "Expert"
    };

    const vars = EmailService.getInvoiceVariables(invoice, client, userProfile as UserProfile);
    
    expect(vars.client_name).toBe("Client Test");
    expect(vars.invoice_number).toBe("FAC-999");
    expect(vars.total).toBe("1500 €");
    expect(vars.company_name).toBe("Ma Boite");
  });
});

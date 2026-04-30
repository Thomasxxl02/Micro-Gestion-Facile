export interface Email {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  status: "sent" | "failed" | "draft" | "scheduled";
  type: "invoice" | "quote" | "reminder" | "custom";
  relatedId?: string;
  attachments?: string[]; // IDs ou URLs des fichiers joints (PDF Facture, etc.)
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: "invoice" | "quote" | "reminder" | "custom" | "reminder_j7" | "reminder_j30";
  isSystem?: boolean; // Template par défaut non supprimable
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string; // Stocké de manière sécurisée ou via jeton d'application
  };
  fromEmail: string;
  fromName: string;
}

export interface EmailSettings {
  provider: "generic" | "smtp" | "gmail" | "outlook" | "brevo";
  smtpConfig?: SmtpConfig;
  apiConfig?: {
    apiKey?: string;
    region?: string;
  };
  signature: string; // Signature HTML/Riche
  templates: EmailTemplate[];
  autoReminderEmails: boolean; // Activer l'envoi auto des relances
}


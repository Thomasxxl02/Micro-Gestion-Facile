export interface Email {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  status: "sent" | "failed" | "draft";
  type: "invoice" | "quote" | "reminder" | "custom";
  relatedId?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: "invoice" | "quote" | "reminder" | "custom";
}

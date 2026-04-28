/**
 * Repository pour les e-mails et modèles d'e-mail
 *
 * Centralise tous les accès Dexie pour les entités Email et EmailTemplate.
 * Ref schéma : emails '&id, relatedId, type, status, sentAt'
 *              emailTemplates '&id, type, name'
 */

import type { Email, EmailTemplate } from "../../types";
import { db } from "../invoiceDB";

export const emailRepository = {
  /** Tous les e-mails envoyés */
  findAll: (): Promise<Email[]> => db.emails.toArray(),

  /** E-mail par identifiant */
  findById: (id: string): Promise<Email | undefined> => db.emails.get(id),

  /** E-mails liés à un document (facture, devis…) via relatedId */
  findByRelated: (relatedId: string): Promise<Email[]> =>
    db.emails.where("relatedId").equals(relatedId).toArray(),

  /** E-mails par type (ex: 'invoice', 'reminder') */
  findByType: (type: string): Promise<Email[]> =>
    db.emails.where("type").equals(type).toArray(),

  /** E-mails par statut (ex: 'sent', 'failed', 'draft') */
  findByStatus: (status: string): Promise<Email[]> =>
    db.emails.where("status").equals(status).toArray(),

  /** Persiste (insert ou update) un e-mail */
  save: (email: Email): Promise<string> => db.emails.put(email),

  /** Persiste plusieurs e-mails en une seule transaction */
  saveBulk: (emails: Email[]): Promise<string> => db.emails.bulkPut(emails),

  /** Supprime un e-mail par identifiant */
  delete: (id: string): Promise<void> => db.emails.delete(id),

  /** Nombre total d'e-mails */
  count: (): Promise<number> => db.emails.count(),
};

export const emailTemplateRepository = {
  /** Tous les modèles d'e-mail */
  findAll: (): Promise<EmailTemplate[]> => db.emailTemplates.toArray(),

  /** Modèle par identifiant */
  findById: (id: string): Promise<EmailTemplate | undefined> =>
    db.emailTemplates.get(id),

  /** Modèles par type de document (index type) */
  findByType: (type: string): Promise<EmailTemplate[]> =>
    db.emailTemplates.where("type").equals(type).toArray(),

  /** Persiste (insert ou update) un modèle */
  save: (template: EmailTemplate): Promise<string> =>
    db.emailTemplates.put(template),

  /** Persiste plusieurs modèles en une seule transaction */
  saveBulk: (templates: EmailTemplate[]): Promise<string> =>
    db.emailTemplates.bulkPut(templates),

  /** Supprime un modèle par identifiant */
  delete: (id: string): Promise<void> => db.emailTemplates.delete(id),
};

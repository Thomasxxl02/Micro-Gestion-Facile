import { Email, EmailSettings, UserProfile, Invoice, Client } from "../types";

/**
 * Service pour la gestion des emails.
 * Dans une PWA sans backend propre, l'envoi direct SMTP est limité (sécurité/CORS).
 * On simule l'interface qui pourra être connectée à des APIs comme Brevo, Gmail API ou un relai SMTP sécurisé.
 */
export class EmailService {
  private static readonly LOGS_KEY = "email_logs";

  /**
   * Récupère l'historique des emails envoyés depuis le stockage local
   */
  static getLogs(): Email[] {
    const logsJson = localStorage.getItem(this.LOGS_KEY);
    if (!logsJson) return [];
    try {
      return JSON.parse(logsJson);
    } catch (e) {
      console.error("Erreur lors de la lecture des logs email", e);
      return [];
    }
  }

  /**
   * Ajoute un log d'email
   */
  static addLog(email: Email): void {
    const logs = this.getLogs();
    const newLogs = [email, ...logs].slice(0, 100); // Garder les 100 derniers
    localStorage.setItem(this.LOGS_KEY, JSON.stringify(newLogs));
  }

  /**
   * Remplace les variables dynamiques dans un texte
   */
  static interpolate(text: string, variables: Record<string, string>): string {
    return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      return variables[trimmedKey] || match;
    });
  }

  /**
   * Prépare les variables pour l'interpolation
   */
  static getInvoiceVariables(
    invoice: Invoice,
    client: Client,
    userProfile: UserProfile,
  ): Record<string, string> {
    return {
      client_name: client.name,
      invoice_number: invoice.number,
      invoice_date: new Date(invoice.date).toLocaleDateString(),
      due_date: new Date(invoice.dueDate).toLocaleDateString(),
      total: `${invoice.total} ${userProfile.currency ?? "€"}`,
      company_name: userProfile.companyName,
      professional_title: userProfile.professionalTitle ?? "",
    };
  }

  /**
   * Simule l'envoi d'un email
   */
  static async sendEmail(
    settings: EmailSettings,
    emailData: Partial<Email>,
    _userProfile: UserProfile,
  ): Promise<{ success: boolean; error?: string }> {
    console.warn("Tentative d'envoi d'email via provider:", settings.provider);
    console.warn("Email info:", emailData);

    const newEmail: Email = {
      id: crypto.randomUUID(),
      to: emailData.to || "",
      subject: emailData.subject || "",
      body: emailData.body || "",
      sentAt: new Date().toISOString(),
      status: "sent",
      type: emailData.type || "custom",
      relatedId: emailData.relatedId,
      attachments: emailData.attachments,
    };

    // Simulation d'un délai réseau
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Ici on implémenterait la logique réelle selon le provider
    // ex: fetch('https://api.brevo.com/v3/smtp/email', ...)

    // Pour la démo/PWA client-side seule, on peut aussi ouvrir le client mail par défaut (mailto:)
    // si aucun serveur n'est configuré
    if (settings.provider === "generic") {
      const mailtoUrl = `mailto:${newEmail.to}?subject=${encodeURIComponent(newEmail.subject ?? "")}&body=${encodeURIComponent(newEmail.body ?? "")}`;
      window.open(mailtoUrl);
      this.addLog(newEmail);
      return { success: true };
    }

    // Simulation de succès pour SMTP/API configuré
    const isSuccess = Math.random() > 0.1; // 90% de succès pour la simulation
    if (!isSuccess) {
      newEmail.status = "failed";
    }

    this.addLog(newEmail);

    return isSuccess
      ? { success: true }
      : { success: false, error: "Erreur de connexion au serveur SMTP" };
  }
}


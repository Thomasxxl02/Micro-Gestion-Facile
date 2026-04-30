import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Server, 
  FileText, 
  Signature, 
  AlertCircle,
  History,
  Send,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { UserProfile, EmailSettings, EmailTemplate, Email } from "../../types";
import { EmailService } from "../../services/emailService";

interface EmailNotificationsTabProps {
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
}

export const EmailNotificationsTab: React.FC<EmailNotificationsTabProps> = ({
  userProfile,
  updateUserProfile,
}) => {
  const settings: EmailSettings = userProfile.emailSettings || {
    provider: "generic",
    signature: "",
    templates: [],
    autoReminderEmails: false,
  };

  const [activeTab, setActiveTab] = useState<"server" | "logs" | "templates" | "signature">("server");
  const [_editingTemplate, _setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [emailLogs, setEmailLogs] = useState<Email[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (activeTab === "logs") {
      setEmailLogs(EmailService.getLogs());
    }
  }, [activeTab]);

  const saveSettings = (newSettings: Partial<EmailSettings>) => {
    updateUserProfile({
      emailSettings: { ...settings, ...newSettings }
    });
  };

  const handleTestEmail = async () => {
    if (!userProfile.email) {
      toast.error("Veuillez renseigner votre email dans votre profil");
      return;
    }

    setIsTesting(true);
    try {
      const result = await EmailService.sendEmail(settings, {
        to: userProfile.email,
        subject: "Email de test - Micro Gestion Facile",
        body: "Ceci est un email de test pour valider votre configuration.",
        type: "custom"
      }, userProfile);

      if (result.success) {
        toast.success("Email de test envoyé avec succès !");
        setEmailLogs(EmailService.getLogs());
      } else {
        toast.error(result.error || "Échec de l'envoi du test");
      }
    } catch (_error) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setIsTesting(false);
    }
  };

  const _handleTemplateSave = (template: EmailTemplate) => {
    const newTemplates = settings.templates.some(t => t.id === template.id)
      ? settings.templates.map(t => t.id === template.id ? template : t)
      : [...settings.templates, template];
    
    saveSettings({ templates: newTemplates });
    _setEditingTemplate(null);
    toast.success("Modèle enregistré");
  };

  const _deleteTemplate = (id: string) => {
    const template = settings.templates.find(t => t.id === id);
    if (template?.isSystem) {
      toast.error("Impossible de supprimer un modèle système");
      return;
    }
    saveSettings({
      templates: settings.templates.filter(t => t.id !== id)
    });
    toast.success("Modèle supprimé");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 dark:border-slate-700">
        {[
          { id: "server", label: "Configuration", icon: Server },
          { id: "logs", label: "Historique", icon: History },
          { id: "templates", label: "Modèles", icon: FileText },
          { id: "signature", label: "Signature", icon: Signature },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id 
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" 
                : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "server" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Mail className="text-indigo-600" size={20} />
                Fournisseur de service email
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { id: "generic", name: "Client Mail (Mailto)", icon: Mail },
                  { id: "smtp", name: "Serveur SMTP", icon: Server },
                  { id: "brevo", name: "Brevo API", icon: Send },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                        saveSettings({ provider: p.id as any });
                        toast.success(`Mode ${p.name} activé`);
                    }}
                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border transition-all ${
                      settings.provider === p.id 
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20" 
                        : "border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                    }`}
                  >
                    <p.icon className={settings.provider === p.id ? "text-indigo-600" : "text-slate-400"} size={24} />
                    <span className="font-medium text-slate-700 dark:text-slate-200">{p.name}</span>
                    {settings.provider === p.id && <CheckCircle2 className="text-indigo-600" size={18} />}
                  </button>
                ))}
              </div>

              {settings.provider === "smtp" && (
                <div className="mt-6 space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Hôte SMTP</label>
                        <input 
                        type="text" 
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-900"
                        defaultValue={settings.smtpConfig?.host || ""}
                        onBlur={(e) => saveSettings({ smtpConfig: { ...settings.smtpConfig!, host: e.target.value } })}
                        placeholder="smtp.gmail.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Port</label>
                        <input 
                        type="number" 
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-900"
                        defaultValue={settings.smtpConfig?.port || 587}
                        onBlur={(e) => saveSettings({ smtpConfig: { ...settings.smtpConfig!, port: parseInt(e.target.value) } })}
                        placeholder="587"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Utilisateur / Email</label>
                        <input 
                        type="text" 
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-900"
                        defaultValue={settings.smtpConfig?.auth.user || ""}
                        onBlur={(e) => saveSettings({ smtpConfig: { ...settings.smtpConfig!, auth: { ...settings.smtpConfig!.auth, user: e.target.value } } })}
                        placeholder="john@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Mot de passe / App Password</label>
                        <input 
                        type="password" 
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-900"
                        defaultValue={settings.smtpConfig?.auth.pass || ""}
                        onBlur={(e) => saveSettings({ smtpConfig: { ...settings.smtpConfig!, auth: { ...settings.smtpConfig!.auth, pass: e.target.value } } })}
                        placeholder="••••••••••••"
                        />
                    </div>
                  </div>
                </div>
              )}

              {settings.provider === "brevo" && (
                <div className="mt-6 space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                   <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Clé API Brevo (v3)</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-900"
                      defaultValue={settings.apiConfig?.apiKey || ""}
                      onBlur={(e) => saveSettings({ apiConfig: { ...settings.apiConfig, apiKey: e.target.value } })}
                      placeholder="xkeysib-..."
                    />
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                <div className="text-sm text-indigo-800 dark:text-indigo-300">
                  <p className="font-semibold text-base mb-1">Tester la connexion</p>
                  <p className="opacity-80">Envoi d'un email à : <span className="font-mono">{userProfile.email || "profil non renseigné"}</span></p>
                </div>
                <button
                  onClick={handleTestEmail}
                  disabled={isTesting || !userProfile.email}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all font-medium disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  {isTesting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  <span>Tester l'envoi</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <h3 className="font-semibold flex items-center gap-2">
                        <History size={18} className="text-indigo-600" />
                        Historique des 100 derniers envois
                    </h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Date</th>
                                <th className="px-6 py-3 font-semibold">Destinataire</th>
                                <th className="px-6 py-3 font-semibold">Objet</th>
                                <th className="px-6 py-3 font-semibold">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {emailLogs.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                    <div className="flex flex-col items-center gap-2">
                                        <Mail size={32} className="opacity-20" />
                                        <p>Aucun email envoyé pour le moment.</p>
                                    </div>
                                </td>
                            </tr>
                            ) : (
                            emailLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                                        {new Date(log.sentAt).toLocaleDateString()} {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">{log.to}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 truncate max-w-50">{log.subject}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                        log.status === "sent" 
                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" 
                                            : log.status === "failed"
                                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                        }`}>
                                        {log.status === "sent" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                        {log.status === "sent" ? "Distribué" : log.status === "failed" ? "Échec" : "En attente"}
                                        </span>
                                    </td>
                                </tr>
                            ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}

        {(activeTab === "templates" || activeTab === "signature") && (
            <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                 Fonctionnalité de gestion des modèles et signatures.
            </div>
        )}
      </div>
    </div>
  );
};

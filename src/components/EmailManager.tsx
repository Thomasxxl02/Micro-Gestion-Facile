import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  Eye,
  FileText,
  History,
  Mail,
  Plus,
  Search,
  Send,
  Trash2,
  User,
  Wand2,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { draftEmail } from '../services/geminiService';
import type { Client, Email, EmailTemplate, Invoice, UserProfile } from '../types';

interface EmailManagerProps {
  emails: Email[];
  setEmails: (emails: Email[]) => void;
  templates: EmailTemplate[];
  setTemplates: (templates: EmailTemplate[]) => void;
  clients: Client[];
  invoices: Invoice[];
  userProfile: UserProfile;
  onSaveEmail?: (email: Email) => void;
  onDeleteEmail?: (id: string) => void;
  onSaveTemplate?: (template: EmailTemplate) => void;
  onDeleteTemplate?: (id: string) => void;
}

const EmailManager: React.FC<EmailManagerProps> = ({
  emails,
  setEmails,
  templates,
  setTemplates,
  clients,
  invoices,
  userProfile,
  onSaveEmail,
  onDeleteEmail,
  onSaveTemplate,
  onDeleteTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'compose' | 'templates'>('history');
  const [searchTerm, setSearchTerm] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  // Compose State
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: '',
    type: 'custom' as Email['type'],
    relatedId: '',
    clientId: '',
    invoiceId: '',
  });

  // Template Form State
  const [templateFormData, setTemplateFormData] = useState<Partial<EmailTemplate>>({
    name: '',
    subject: '',
    body: '',
    type: 'custom',
  });

  const filteredEmails = useMemo(() => {
    return emails
      .filter(
        (e) =>
          e.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.subject.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }, [emails, searchTerm]);

  const handleAIDraft = async () => {
    const client = clients.find((c) => c.id === composeData.clientId);
    const invoice = invoices.find((i) => i.id === composeData.invoiceId);

    if (!client) {
      alert('Veuillez sélectionner un client pour générer un brouillon.');
      return;
    }

    setIsDrafting(true);
    try {
      const draft = await draftEmail({
        clientName: client.name,
        invoiceNumber: invoice?.number,
        total: invoice?.total.toString(),
        purpose:
          composeData.type === 'reminder'
            ? 'Relance de facture impayée'
            : composeData.type === 'invoice'
              ? 'Envoi de facture'
              : composeData.type === 'quote'
                ? 'Envoi de devis'
                : 'Communication diverse',
        tone: 'formal',
        companyName: userProfile.companyName,
      });

      setComposeData({
        ...composeData,
        subject: draft.subject,
        body: draft.body,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(composeData.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmail: Email = {
      id: Date.now().toString(),
      to: composeData.to,
      subject: composeData.subject,
      body: composeData.body,
      sentAt: new Date().toISOString(),
      status: 'sent',
      type: composeData.type,
      relatedId: composeData.relatedId,
    };
    setEmails([...emails, newEmail]);
    if (onSaveEmail) {
      onSaveEmail(newEmail);
    }
    setIsComposeOpen(false);
    setComposeData({
      to: '',
      subject: '',
      body: '',
      type: 'custom',
      relatedId: '',
      clientId: '',
      invoiceId: '',
    });
    setActiveTab('history');
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplateId) {
      const updatedTemplate = {
        ...templates.find((t) => t.id === editingTemplateId),
        ...templateFormData,
      } as EmailTemplate;
      setTemplates(templates.map((t) => (t.id === editingTemplateId ? updatedTemplate : t)));
      if (onSaveTemplate) {
        onSaveTemplate(updatedTemplate);
      }
    } else {
      const newTemplate: EmailTemplate = {
        id: Date.now().toString(),
        name: templateFormData.name || 'Nouveau Template',
        subject: templateFormData.subject || '',
        body: templateFormData.body || '',
        type: templateFormData.type || 'custom',
      };
      setTemplates([...templates, newTemplate]);
      if (onSaveTemplate) {
        onSaveTemplate(newTemplate);
      }
    }
    setEditingTemplateId(null);
    setTemplateFormData({ name: '', subject: '', body: '', type: 'custom' });
  };

  const applyTemplate = (template: EmailTemplate) => {
    let body = template.body;
    let subject = template.subject;

    const client = clients.find((c) => c.id === composeData.clientId);
    const invoice = invoices.find((i) => i.id === composeData.invoiceId);

    // Basic variable replacement
    const replacements: Record<string, string> = {
      '{{company_name}}': userProfile.companyName,
      '{{client_name}}': client?.name || 'Client',
      '{{invoice_number}}': invoice?.number || 'N/A',
      '{{total}}': invoice ? `${invoice.total.toFixed(2)}€` : '0.00€',
      '{{due_date}}': invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A',
    };

    Object.entries(replacements).forEach(([key, value]) => {
      body = body.replaceAll(key, value);
      subject = subject.replaceAll(key, value);
    });

    setComposeData({
      ...composeData,
      subject,
      body,
      type: template.type,
    });
  };

  const deleteEmail = (id: string) => {
    if (confirm("Supprimer cet email de l'historique ?")) {
      setEmails(emails.filter((e) => e.id !== id));
      if (onDeleteEmail) {
        onDeleteEmail(id);
      }
    }
  };

  const deleteTemplate = (id: string) => {
    if (confirm('Supprimer ce template ?')) {
      setTemplates(templates.filter((t) => t.id !== id));
      if (onDeleteTemplate) {
        onDeleteTemplate(id);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Emails & Communications</h1>
          <p className="text-brand-500">Gérez vos envois de factures, devis et relances.</p>
        </div>
        <button
          onClick={() => {
            setComposeData({
              to: '',
              subject: '',
              body: '',
              type: 'custom',
              relatedId: '',
              clientId: '',
              invoiceId: '',
            });
            setActiveTab('compose');
          }}
          className="bg-brand-900 hover:bg-brand-800 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-brand-900/20 font-medium"
        >
          <Plus size={18} />
          Nouveau Message
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-brand-100 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-brand-900 text-white shadow-md' : 'text-brand-500 hover:text-brand-700'}`}
        >
          <History size={16} />
          Historique
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'templates' ? 'bg-brand-900 text-white shadow-md' : 'text-brand-500 hover:text-brand-700'}`}
        >
          <FileText size={16} />
          Templates
        </button>
        <button
          onClick={() => setActiveTab('compose')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'compose' ? 'bg-brand-900 text-white shadow-md' : 'text-brand-500 hover:text-brand-700'}`}
        >
          <Mail size={16} />
          Composer
        </button>
      </div>

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un email..."
              className="w-full pl-10 pr-4 py-3 border border-brand-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 bg-white shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white border border-brand-100 rounded-4xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-900 text-white">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                    Destinataire
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Sujet</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {filteredEmails.map((email) => {
                  const client = clients.find((c) => c.email === email.to);
                  return (
                    <tr key={email.id} className="hover:bg-brand-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-brand-900">
                          {client ? client.name : email.to}
                        </div>
                        <div className="text-[10px] text-brand-400 uppercase font-bold flex items-center gap-2">
                          {email.type}
                          {client && (
                            <span className="text-brand-300 font-normal lowercase italic">
                              ({email.to})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-brand-600 truncate max-w-xs">
                        {email.subject}
                      </td>
                      <td className="px-6 py-4 text-sm text-brand-500">
                        {new Date(email.sentAt).toLocaleDateString()}{' '}
                        {new Date(email.sentAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            email.status === 'sent'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {email.status === 'sent' ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <AlertCircle size={12} />
                          )}
                          {email.status === 'sent' ? 'Envoyé' : 'Échec'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deleteEmail(email.id)}
                          aria-label={`Supprimer l'email \u00e0 ${email.to}`}
                          className="p-2 text-brand-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredEmails.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-brand-400 italic">
                      Aucun email envoyé pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add Template Card */}
          <button
            onClick={() => {
              setEditingTemplateId(null);
              setTemplateFormData({ name: '', subject: '', body: '', type: 'custom' });
              setIsComposeOpen(true); // Reusing compose modal for template creation
            }}
            className="border-2 border-dashed border-brand-200 rounded-4xl p-8 flex flex-col items-center justify-center gap-4 text-brand-400 hover:text-brand-600 hover:border-brand-400 hover:bg-brand-50 transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={32} />
            </div>
            <span className="font-bold uppercase tracking-wider text-xs">Nouveau Template</span>
          </button>

          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-brand-100 rounded-4xl p-6 shadow-sm hover:shadow-md transition-all group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
                  <FileText size={24} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingTemplateId(template.id);
                      setTemplateFormData(template);
                      setIsComposeOpen(true);
                    }}
                    aria-label={`Modifier le template "${template.name}"`}
                    className="p-2 text-brand-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                  >
                    <Edit2 size={16} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    aria-label={`Supprimer le template "${template.name}"`}
                    className="p-2 text-brand-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <h4 className="font-bold text-brand-900 mb-1">{template.name}</h4>
              <p className="text-[10px] text-brand-400 uppercase font-bold mb-3">{template.type}</p>
              <div className="text-sm text-brand-600 line-clamp-3 mb-4 bg-brand-50/50 p-3 rounded-xl italic">
                {template.subject}
              </div>
              <button
                onClick={() => {
                  applyTemplate(template);
                  setActiveTab('compose');
                }}
                className="w-full py-2.5 bg-brand-50 text-brand-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-900 hover:text-white transition-all"
              >
                Utiliser ce template
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white border border-brand-100 rounded-4xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-brand-900 flex items-center gap-2">
                <Mail className="text-brand-500" size={20} />
                Nouveau Message
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleAIDraft}
                  disabled={isDrafting || !composeData.clientId}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-50 text-accent-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent-100 transition-all disabled:opacity-50"
                >
                  {isDrafting ? <Clock className="animate-spin" size={14} /> : <Wand2 size={14} />}
                  Aide à la rédaction
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  aria-label={
                    showPreview ? "Retour \u00e0 l'\u00e9dition" : 'Aper\u00e7u du message'
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${showPreview ? 'bg-brand-900 text-white' : 'bg-brand-50 text-brand-600 hover:bg-brand-100'}`}
                >
                  <Eye size={14} aria-hidden="true" />
                  {showPreview ? 'Éditer' : 'Aperçu'}
                </button>
              </div>
            </div>

            {showPreview ? (
              <div className="space-y-6 animate-fade-in">
                <div className="p-6 bg-brand-50 rounded-2xl border border-brand-100">
                  <div className="mb-4 pb-4 border-b border-brand-200">
                    <div className="text-xs font-bold text-brand-400 uppercase mb-1">À:</div>
                    <div className="text-brand-900 font-medium">
                      {composeData.to || '(Non spécifié)'}
                    </div>
                  </div>
                  <div className="mb-4 pb-4 border-b border-brand-200">
                    <div className="text-xs font-bold text-brand-400 uppercase mb-1">Sujet:</div>
                    <div className="text-brand-900 font-bold">
                      {composeData.subject || '(Sans objet)'}
                    </div>
                  </div>
                  <div className="text-brand-800 whitespace-pre-wrap leading-relaxed min-h-50">
                    {composeData.body || '(Message vide)'}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    aria-label="Retour \u00e0 l'\u00e9dition de l'aper\u00e7u"
                    className="px-6 py-3 text-brand-600 font-bold text-xs uppercase tracking-widest hover:bg-brand-50 rounded-2xl"
                  >
                    Retour à l&apos;édition
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="email-client"
                      className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-2"
                    >
                      Client
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400"
                        size={16}
                      />
                      <select
                        id="email-client"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-brand-50 border border-brand-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none"
                        value={composeData.clientId}
                        onChange={(e) => {
                          const client = clients.find((c) => c.id === e.target.value);
                          setComposeData({
                            ...composeData,
                            clientId: e.target.value,
                            to: client?.email || '',
                          });
                        }}
                        title="Sélectionner un client"
                      >
                        <option value="">Sélectionner un client...</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="email-document"
                      className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-2"
                    >
                      Document Lié (Optionnel)
                    </label>
                    <div className="relative">
                      <FileText
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400"
                        size={16}
                      />
                      <select
                        id="email-document"
                        className="w-full pl-10 pr-4 py-3 bg-brand-50 border border-brand-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none"
                        value={composeData.invoiceId}
                        onChange={(e) =>
                          setComposeData({
                            ...composeData,
                            invoiceId: e.target.value,
                            relatedId: e.target.value,
                          })
                        }
                        title="Sélectionner un document lié"
                      >
                        <option value="">Aucun document...</option>
                        {invoices
                          .filter((i) => i.clientId === composeData.clientId)
                          .map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.number} - {i.total.toFixed(2)}€
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">
                      Destinataire
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full p-3 bg-brand-50 border border-brand-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                      value={composeData.to}
                      onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                      placeholder="client@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">
                      Type d&apos;email
                    </label>
                    <select
                      className="w-full p-3 bg-brand-50 border border-brand-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none"
                      value={composeData.type}
                      onChange={(e) =>
                        setComposeData({ ...composeData, type: e.target.value as Email['type'] })
                      }
                      title="Sélectionner le type d'email"
                    >
                      <option value="custom">Communication Libre</option>
                      <option value="invoice">Envoi de Facture</option>
                      <option value="quote">Envoi de Devis</option>
                      <option value="reminder">Relance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">
                    Sujet
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 bg-brand-50 border border-brand-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-bold"
                    value={composeData.subject}
                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                    placeholder="Objet de votre message"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider">
                      Message
                    </label>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="text-[10px] font-bold text-brand-400 hover:text-brand-600 flex items-center gap-1 transition-colors"
                    >
                      {copied ? (
                        <Check size={12} className="text-emerald-500" />
                      ) : (
                        <Copy size={12} />
                      )}
                      {copied ? 'Copié !' : 'Copier le corps'}
                    </button>
                  </div>
                  <textarea
                    rows={10}
                    required
                    className="w-full p-4 bg-brand-50 border border-brand-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none font-medium"
                    value={composeData.body}
                    onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                    placeholder="Écrivez votre message ici..."
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-[10px] text-brand-400 font-bold uppercase py-1">
                      Variables:
                    </span>
                    {[
                      '{{company_name}}',
                      '{{client_name}}',
                      '{{invoice_number}}',
                      '{{total}}',
                      '{{due_date}}',
                    ].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          setComposeData({ ...composeData, body: composeData.body + v })
                        }
                        className="text-[10px] bg-brand-100 text-brand-600 px-3 py-1 rounded-lg hover:bg-brand-200 transition-all font-bold"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="px-8 py-3 text-brand-600 font-bold text-sm uppercase tracking-widest hover:bg-brand-50 rounded-2xl transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-brand-900 text-white px-10 py-3 rounded-2xl flex items-center gap-2 hover:bg-brand-800 transition-all shadow-lg shadow-brand-900/20 font-bold text-sm uppercase tracking-widest"
                  >
                    <Send size={18} />
                    Envoyer
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-brand-50 border border-brand-100 rounded-4xl p-6">
              <h4 className="text-sm font-bold text-brand-900 mb-4 flex items-center gap-2">
                <FileText className="text-brand-400" size={18} />
                Templates Disponibles
              </h4>
              <div className="space-y-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className="w-full p-4 bg-white border border-brand-100 rounded-2xl text-left hover:border-brand-300 hover:shadow-sm transition-all group"
                  >
                    <div className="text-xs font-bold text-brand-900 group-hover:text-brand-600">
                      {t.name}
                    </div>
                    <div className="text-[10px] text-brand-400 uppercase font-bold mt-1">
                      {t.type}
                    </div>
                  </button>
                ))}
                {templates.length === 0 && (
                  <div className="text-center py-8 text-brand-400 text-xs italic">
                    Aucun template enregistré.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-accent-50 border border-accent-100 rounded-4xl p-6">
              <h4 className="text-sm font-bold text-accent-900 mb-2 flex items-center gap-2">
                <Wand2 size={18} />
                Astuce IA
              </h4>
              <p className="text-xs text-accent-700 leading-relaxed">
                Utilisez l&apos;aide à la rédaction pour générer des relances polies mais fermes, ou
                des messages d&apos;accompagnement personnalisés pour vos factures.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal (Reusing Compose UI logic for simplicity) */}
      {isComposeOpen && activeTab === 'templates' && (
        <div className="fixed inset-0 bg-brand-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-4xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-brand-100 flex justify-between items-center bg-brand-50/50">
              <h3 className="text-xl font-bold text-brand-900">
                {editingTemplateId ? 'Modifier le Template' : 'Nouveau Template'}
              </h3>
              <button
                onClick={() => setIsComposeOpen(false)}
                aria-label="Fermer"
                className="p-2 hover:bg-brand-200 rounded-full text-brand-500 transition-colors"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleSaveTemplate} className="p-8 space-y-6">
              <div>
                <label
                  htmlFor="template-name"
                  className="block text-sm font-semibold text-brand-700 mb-2"
                >
                  Nom du Template
                </label>
                <input
                  id="template-name"
                  type="text"
                  required
                  className="w-full p-3 bg-brand-50 border border-brand-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  value={templateFormData.name}
                  onChange={(e) =>
                    setTemplateFormData({ ...templateFormData, name: e.target.value })
                  }
                  placeholder="Ex: Relance Facture"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-700 mb-2">
                  Sujet par défaut
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-3 bg-brand-50 border border-brand-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  value={templateFormData.subject}
                  onChange={(e) =>
                    setTemplateFormData({ ...templateFormData, subject: e.target.value })
                  }
                  placeholder="Objet de l'email"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-700 mb-2">
                  Corps du message
                </label>
                <textarea
                  rows={6}
                  required
                  className="w-full p-4 bg-brand-50 border border-brand-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
                  value={templateFormData.body}
                  onChange={(e) =>
                    setTemplateFormData({ ...templateFormData, body: e.target.value })
                  }
                  placeholder="Contenu du message..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-6 py-2.5 text-brand-600 font-bold text-xs uppercase tracking-widest hover:bg-brand-50 rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-brand-900 text-white px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-800 transition-all shadow-lg shadow-brand-900/20"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailManager;


import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceItem, InvoiceStatus, Client, UserProfile, DocumentType, Product } from '../types';
import { Plus, Trash2, Printer, Wand2, ArrowLeft, FileText, Repeat, FileCheck, ShoppingBag, Receipt, Link as LinkIcon, ArrowRightCircle, Download, Calendar, ChevronDown, ChevronUp, CheckSquare, Square, Eye, ThumbsUp, ThumbsDown, ExternalLink, Bell, Edit3, AlertCircle, Percent, Truck, Coins, Calculator, Package, Copy, Mail, X, Search, Zap, ShieldCheck, Clock } from 'lucide-react';
import { suggestInvoiceDescription, generateInvoiceItemsFromPrompt } from '../services/geminiService';

interface InvoiceManagerProps {
  invoices: Invoice[];
  setInvoices: (invoices: Invoice[]) => void;
  clients: Client[];
  userProfile: UserProfile;
  products: Product[];
  onSave?: (invoice: Invoice) => void;
  onDelete?: (id: string) => void;
}

const InvoiceManager: React.FC<InvoiceManagerProps> = ({ invoices, setInvoices, clients, userProfile, products, onSave, onDelete }) => {
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [activeTab, setActiveTab] = useState<DocumentType>('invoice');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // New State for Live Preview in Create Mode
  const [showLivePreview, setShowLivePreview] = useState(false);

  // --- ETATS FILTRES & TRI ---
  const [filters, setFilters] = useState({
    dateStart: '',
    dateEnd: '',
    status: '',
    clientId: ''
  });
  
  const [sortConfig, setSortConfig] = useState<{ key: 'number' | 'date' | 'client' | 'total'; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc'
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCustomStatus, setIsCustomStatus] = useState(false);

  // --- ETAT NOUVEAU DOCUMENT ---
  const [newDocData, setNewDocData] = useState<Partial<Invoice>>({
    items: [],
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + (userProfile.preferences?.defaultDueDateDays || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    type: 'invoice',
    linkedDocumentId: undefined,
    discount: 0,
    shipping: 0,
    deposit: 0,
    taxExempt: userProfile.defaultVatRate === 0,
    eInvoiceFormat: 'Factur-X',
    operationCategory: 'SERVICES'
  });
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isMagicFillOpen, setIsMagicFillOpen] = useState(false);
  const [magicFillPrompt, setMagicFillPrompt] = useState('');
  const [isMagicFilling, setIsMagicFilling] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);

  // --- LOGIQUE METIER & CALCULS ---

  // Calcul dynamique des totaux pour le formulaire de création
  const formTotals = useMemo(() => {
    const items = newDocData.items || [];
    const isExempt = newDocData.taxExempt;
    
    // Subtotal HT (Hors Taxes)
    const subtotalHT = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    
    // Remise
    const discountAmount = subtotalHT * ((newDocData.discount || 0) / 100);
    const subtotalAfterDiscount = subtotalHT - discountAmount;
    
    // TVA
    let vatAmount = 0;
    if (!isExempt) {
      vatAmount = items.reduce((acc, item) => {
        const itemTotal = (item.quantity * item.unitPrice);
        const itemDiscount = itemTotal * ((newDocData.discount || 0) / 100);
        const itemVat = (itemTotal - itemDiscount) * ((item.vatRate || userProfile.defaultVatRate || 0) / 100);
        return acc + itemVat;
      }, 0);
      
      // TVA sur les frais de port (au taux par défaut)
      if (newDocData.shipping) {
        vatAmount += newDocData.shipping * ((userProfile.defaultVatRate || 0) / 100);
      }
    }

    const totalTTC = subtotalAfterDiscount + (newDocData.shipping || 0) + vatAmount;
    const balanceDue = Math.max(0, totalTTC - (newDocData.deposit || 0));

    return {
        subtotalHT,
        discountAmount,
        vatAmount,
        total: totalTTC,
        balanceDue
    };
  }, [newDocData.items, newDocData.discount, newDocData.shipping, newDocData.deposit, newDocData.taxExempt, userProfile.defaultVatRate]);

  // --- LOGIQUE TRI/FILTRE ---

  const availableStatuses = useMemo(() => {
    const currentStatuses = new Set(invoices.map(i => i.status));
    Object.values(InvoiceStatus).forEach(s => currentStatuses.add(s));
    return Array.from(currentStatuses);
  }, [invoices]);

  const handleSort = (key: 'number' | 'date' | 'client' | 'total') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedDocuments = useMemo(() => {
    let docs = invoices.filter(doc => (doc.type || 'invoice') === activeTab);

    if (filters.dateStart) docs = docs.filter(doc => doc.date >= filters.dateStart);
    if (filters.dateEnd) docs = docs.filter(doc => doc.date <= filters.dateEnd);
    if (filters.status) docs = docs.filter(doc => doc.status === filters.status);
    if (filters.clientId) docs = docs.filter(doc => doc.clientId === filters.clientId);

    return docs.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortConfig.key) {
        case 'number': valA = a.number; valB = b.number; break;
        case 'date': valA = new Date(a.date).getTime(); valB = new Date(b.date).getTime(); break;
        case 'client':
          valA = clients.find(c => c.id === a.clientId)?.name || '';
          valB = clients.find(c => c.id === b.clientId)?.name || '';
          break;
        case 'total': valA = a.total; valB = b.total; break;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [invoices, activeTab, filters, sortConfig, clients]);

  const stats = useMemo(() => {
    const docs = invoices.filter(doc => (doc.type || 'invoice') === activeTab);
    const total = docs.reduce((acc, doc) => acc + doc.total, 0);
    const count = docs.length;
    
    let pending = 0;
    let paid = 0;
    let overdue = 0;
    const today = new Date().toISOString().split('T')[0];

    docs.forEach(doc => {
      if (doc.status === InvoiceStatus.PAID || doc.status === InvoiceStatus.ACCEPTED) {
        paid += doc.total;
      } else if (doc.status === InvoiceStatus.REJECTED) {
        // ignore
      } else {
        pending += doc.total;
        if (doc.dueDate < today) {
          overdue += doc.total;
        }
      }
    });

    return { total, count, pending, paid, overdue };
  }, [invoices, activeTab]);

  // --- BULK SELECTION ---

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedDocuments.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredAndSortedDocuments.map(d => d.id)));
  };

  const handleBulkStatusChange = (newStatus: string) => {
    if (confirm(`Modifier le statut de ${selectedIds.size} document(s) en "${newStatus}" ?`)) {
      const updatedInvoices = invoices.map(doc => {
        if (selectedIds.has(doc.id)) {
          const updated = { ...doc, status: newStatus };
          if (onSave) onSave(updated);
          return updated;
        }
        return doc;
      });
      setInvoices(updatedInvoices);
      setSelectedIds(new Set());
    }
  };

  // --- HELPERS ---

  const getNextNumber = (type: DocumentType) => {
    const currentYear = new Date().getFullYear();
    const docsThisYear = invoices.filter(i => 
      (i.type || 'invoice') === type && 
      i.date.startsWith(currentYear.toString())
    ).length + 1;
    
    let prefix = 'FACT';
    if (type === 'quote') prefix = 'DEVIS';
    if (type === 'order') prefix = 'COMM';
    if (type === 'credit_note') prefix = 'AVOIR';

    return `${prefix}-${currentYear}-${docsThisYear.toString().padStart(3, '0')}`;
  };

  const getThemeColor = (type: DocumentType) => {
    switch(type) {
      case 'invoice': return 'brand';
      case 'quote': return 'brand';
      case 'order': return 'brand';
      case 'credit_note': return 'brand';
      default: return 'brand';
    }
  };

  const getDocumentLabel = (type: DocumentType) => {
    switch(type) {
      case 'invoice': return 'Facture';
      case 'quote': return 'Devis';
      case 'order': return 'Commande';
      case 'credit_note': return 'Avoir';
      default: return 'Document';
    }
  };

  // Helper to create a temporary invoice object for preview
  const getPreviewInvoice = (): Invoice => {
      const type = newDocData.type || activeTab;
      return {
          id: 'preview',
          type: type,
          number: getNextNumber(type),
          clientId: selectedClientId,
          date: newDocData.date || new Date().toISOString(),
          dueDate: newDocData.dueDate || new Date().toISOString(),
          items: newDocData.items || [],
          status: InvoiceStatus.DRAFT,
          total: formTotals.total,
          discount: newDocData.discount,
          shipping: newDocData.shipping,
          deposit: newDocData.deposit,
          notes: newDocData.notes,
          linkedDocumentId: newDocData.linkedDocumentId,
          reminderDate: undefined
      };
  };

  const openLinkedDocument = (linkedId: string) => {
    const target = invoices.find(i => i.id === linkedId);
    if (target) {
        if ((target.type || 'invoice') !== activeTab) {
           setActiveTab(target.type || 'invoice');
        }
        setSelectedInvoice(target);
        setView('detail');
    }
  };

  // --- ACTIONS ---

  const handleDuplicate = (invoice: Invoice) => {
    if (!confirm("Dupliquer ce document ?")) return;
    
    // Create new items array with new IDs
    const newItems = invoice.items.map(item => ({ ...item, id: Date.now().toString() + Math.random().toString().slice(2) }));
    
    setNewDocData({
        items: newItems,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: invoice.type,
        discount: invoice.discount,
        shipping: invoice.shipping,
        notes: invoice.notes,
        deposit: 0 // Reset deposit for new document
    });
    setSelectedClientId(invoice.clientId);
    setActiveTab(invoice.type);
    setShowLivePreview(false);
    setView('create');
  };

  const handleEmail = (invoice: Invoice) => {
      const client = clients.find(c => c.id === invoice.clientId);
      if (!client?.email) {
          alert("Le client n'a pas d'adresse email renseignée.");
          return;
      }
      
      const docLabel = getDocumentLabel(invoice.type);
      const subject = `${docLabel} N° ${invoice.number} - ${userProfile.companyName}`;
      const body = `Bonjour ${client.name},\n\nVeuillez trouver ci-joint le document ${invoice.number} daté du ${new Date(invoice.date).toLocaleDateString()}.\n\nCordialement,\n${userProfile.companyName}`;
      
      window.location.href = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Update status if it's draft
      if (invoice.status === InvoiceStatus.DRAFT) {
          if (confirm("Marquer le document comme 'Envoyé' ?")) {
              updateStatus(invoice.id, InvoiceStatus.SENT);
          }
      }
  };

  const exportCurrentViewCSV = () => {
    const headers = ['Numéro', 'Date (AAAA-MM-JJ)', 'Client', 'Statut', 'Sous-Total HT', 'Remise', 'Total TTC'];
    const rows = filteredAndSortedDocuments.map(doc => {
        const clientName = clients.find(c => c.id === doc.clientId)?.name || 'Client Inconnu';
        const formattedDate = new Date(doc.date).toISOString().split('T')[0];
        
        // Recalcul simple pour export si champs pas présents
        const subtotal = doc.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
        const discountVal = subtotal * ((doc.discount || 0) / 100);

        return [
            doc.number,
            formattedDate,
            `"${clientName.replace(/"/g, '""')}"`,
            `"${doc.status}"`,
            subtotal.toFixed(2),
            discountVal.toFixed(2),
            doc.total.toFixed(2)
        ].join(',');
    });

    let filename = 'documents';
    if (activeTab === 'invoice') filename = 'factures';
    else if (activeTab === 'quote') filename = 'devis';
    else if (activeTab === 'order') filename = 'commandes';
    else if (activeTab === 'credit_note') filename = 'avoirs';

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getExportLabel = () => {
      switch(activeTab) {
          case 'invoice': return 'Export Factures';
          case 'quote': return 'Export Devis';
          case 'order': return 'Export Commandes';
          case 'credit_note': return 'Export Avoirs';
          default: return 'Export CSV';
      }
  };

  // --- FORM ITEM MANIPULATION ---

  const addItem = () => {
    const items = newDocData.items || [];
    setNewDocData({
      ...newDocData,
      items: [...items, { 
        id: Date.now().toString(), 
        description: '', 
        quantity: 1, 
        unitPrice: 0, 
        unit: '',
        vatRate: userProfile.defaultVatRate || 0
      }]
    });
  };

  const addProductItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.type === 'product' && product.stock !== undefined && product.stock <= 0) {
      if (!confirm(`Attention : Le produit "${product.name}" est en rupture de stock. Voulez-vous quand même l'ajouter ?`)) {
        return;
      }
    }
    
    const items = newDocData.items || [];
    setNewDocData({
      ...newDocData,
      items: [...items, { 
        id: Date.now().toString(), 
        description: product.name, 
        quantity: 1, 
        unitPrice: product.price,
        unit: product.unit,
        vatRate: userProfile.defaultVatRate || 0
      }]
    });
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    const items = newDocData.items?.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ) || [];
    setNewDocData({ ...newDocData, items });
  };

  const removeItem = (id: string) => {
    const items = newDocData.items?.filter(item => item.id !== id) || [];
    setNewDocData({ ...newDocData, items });
  };

  const handleGenerateDescription = async (itemId: string, currentDesc: string) => {
    if (!selectedClientId) {
      alert("Veuillez sélectionner un client d'abord.");
      return;
    }
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;

    setIsGeneratingDesc(true);
    const suggestion = await suggestInvoiceDescription(client.name, currentDesc || "Service général");
    setIsGeneratingDesc(false);
    
    updateItem(itemId, 'description', suggestion);
  };

  const handleMagicFill = async () => {
    if (!magicFillPrompt.trim()) return;
    setIsMagicFilling(true);
    const items = await generateInvoiceItemsFromPrompt(magicFillPrompt);
    setIsMagicFilling(false);
    
    if (items && items.length > 0) {
      const formattedItems = items.map((item: any) => ({
        ...item,
        id: Date.now().toString() + Math.random(),
        vatRate: userProfile.defaultVatRate || 0
      }));
      setNewDocData({
        ...newDocData,
        items: [...(newDocData.items || []), ...formattedItems]
      });
      setIsMagicFillOpen(false);
      setMagicFillPrompt('');
    } else {
      alert("Désolé, je n'ai pas pu interpréter votre demande. Essayez d'être plus précis.");
    }
  };

  const saveDocument = () => {
    if (!selectedClientId || !newDocData.date || !newDocData.items?.length) {
      alert("Veuillez remplir tous les champs obligatoires (client, date, articles).");
      return;
    }

    const type = newDocData.type || activeTab;

    const document: Invoice = {
      id: Date.now().toString(),
      type: type,
      number: getNextNumber(type),
      clientId: selectedClientId,
      linkedDocumentId: newDocData.linkedDocumentId,
      date: newDocData.date!,
      dueDate: newDocData.dueDate!,
      items: newDocData.items as InvoiceItem[],
      status: InvoiceStatus.DRAFT,
      total: formTotals.total, // Total TTC final
      discount: newDocData.discount || 0,
      shipping: newDocData.shipping || 0,
      deposit: newDocData.deposit || 0,
      vatAmount: formTotals.vatAmount,
      taxExempt: newDocData.taxExempt,
      notes: newDocData.notes,
      eInvoiceFormat: newDocData.eInvoiceFormat as any,
      eInvoiceStatus: InvoiceStatus.DRAFT,
      operationCategory: newDocData.operationCategory as any
    };

    setInvoices([document, ...invoices]);
    if (onSave) onSave(document);
    setView('list');
    setNewDocData({
      items: [],
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: activeTab,
      linkedDocumentId: undefined,
      discount: 0, 
      shipping: 0,
      deposit: 0,
      taxExempt: userProfile.defaultVatRate === 0
    });
    setSelectedClientId('');
  };

  // --- TRANSFORMATION LOGIC ---

  const convertQuoteToInvoice = (quote: Invoice) => {
    if (!confirm("Convertir ce devis en facture ?")) return;

    let updatedInvoices = invoices;
    if (quote.status !== InvoiceStatus.ACCEPTED) {
         updatedInvoices = invoices.map(i => 
            i.id === quote.id ? { ...i, status: InvoiceStatus.ACCEPTED } : i
        );
    }

    const newInvoice: Invoice = {
        ...quote,
        id: Date.now().toString(),
        type: 'invoice',
        linkedDocumentId: quote.id,
        number: getNextNumber('invoice'),
        date: new Date().toISOString().split('T')[0],
        status: InvoiceStatus.DRAFT,
        notes: `Facture suite au devis ${quote.number}`
    };

    setInvoices([newInvoice, ...updatedInvoices]);
    setActiveTab('invoice');
    setSelectedInvoice(newInvoice);
  };

  const convertOrderToInvoice = (order: Invoice) => {
     if (!confirm("Facturer cette commande ?")) return;
     
     const newInvoice: Invoice = {
         ...order,
         id: Date.now().toString(),
         type: 'invoice',
         linkedDocumentId: order.id,
         number: getNextNumber('invoice'),
         date: new Date().toISOString().split('T')[0],
         status: InvoiceStatus.DRAFT,
         notes: `Facture pour la commande ${order.number}`
     };
     setInvoices([newInvoice, ...invoices]);
     setActiveTab('invoice');
     setSelectedInvoice(newInvoice);
  };

  const createCreditNoteFromInvoice = (invoice: Invoice) => {
    if (!confirm("Créer un avoir pour cette facture ?")) return;

    setNewDocData({
        items: invoice.items.map(i => ({...i})),
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        type: 'credit_note',
        linkedDocumentId: invoice.id,
        discount: invoice.discount,
        notes: `Avoir sur facture ${invoice.number}`
    });
    setSelectedClientId(invoice.clientId);
    setActiveTab('credit_note');
    setView('create');
  };

  const updateStatus = (id: string, status: string) => {
    if (status === 'CUSTOM_INPUT') {
      setIsCustomStatus(true);
      return;
    }
    const inv = invoices.find(i => i.id === id);
    if (inv) {
        const updated = { ...inv, status };
        setInvoices(invoices.map(i => i.id === id ? updated : i));
        if (onSave) onSave(updated);
        if (selectedInvoice && selectedInvoice.id === id) {
            setSelectedInvoice(updated);
        }
    }
    setIsCustomStatus(false);
  };

  const updateReminder = (id: string, date: string) => {
    const inv = invoices.find(i => i.id === id);
    if (inv) {
        const updated = { ...inv, reminderDate: date };
        setInvoices(invoices.map(i => i.id === id ? updated : i));
        if (onSave) onSave(updated);
        if (selectedInvoice && selectedInvoice.id === id) {
            setSelectedInvoice(updated);
        }
    }
  }

  const deleteDocument = (id: string) => {
     if(confirm("Supprimer ce document définitivement ?")) {
       setInvoices(invoices.filter(inv => inv.id !== id));
       if (onDelete) onDelete(id);
       if (selectedInvoice?.id === id) setView('list');
     }
  }

  const handleTransmitPPF = (invoice: Invoice) => {
    if (!confirm(`Transmettre la facture ${invoice.number} au Portail Public de Facturation (PPF) au format ${invoice.eInvoiceFormat || 'Factur-X'} ?`)) return;
    
    // Simulation de transmission
    setTimeout(() => {
        const updatedInvoice = {
            ...invoice,
            eInvoiceStatus: InvoiceStatus.DEPOSITED,
            transmissionDate: new Date().toISOString()
        };
        setInvoices(invoices.map(inv => inv.id === invoice.id ? updatedInvoice : inv));
        if (selectedInvoice?.id === invoice.id) {
            setSelectedInvoice(updatedInvoice);
        }
        alert(`Facture ${invoice.number} transmise avec succès au PPF.`);
    }, 1500);
  };

  const startCreate = () => {
      setNewDocData({
        items: [],
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: activeTab,
        linkedDocumentId: undefined,
        discount: 0,
        shipping: 0,
        deposit: 0
      });
      setSelectedClientId('');
      setShowLivePreview(false);
      setView('create');
  }

  // --- STYLES HELPER ---
  const themeColor = getThemeColor(activeTab);

  // --- RENDER PAPER COMPONENT ---
  const InvoicePaper = ({ invoice, isPreview }: { invoice: Invoice, isPreview?: boolean }) => {
    const client = clients.find(c => c.id === invoice.clientId);
    const docType = invoice.type || 'invoice';
    const docTheme = getThemeColor(docType);
    const linkedDoc = invoice.linkedDocumentId ? invoices.find(i => i.id === invoice.linkedDocumentId) : null;

    let title = 'FACTURE';
    let icon = <FileText size={24} />;
    
    if (docType === 'quote') { title = 'DEVIS'; icon = <FileCheck size={24} />; }
    if (docType === 'order') { title = 'COMMANDE'; icon = <ShoppingBag size={24} />; }
    if (docType === 'credit_note') { title = 'AVOIR'; icon = <Receipt size={24} />; }

    // Calculations
    const subtotalHT = invoice.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
    const discountVal = subtotalHT * ((invoice.discount || 0) / 100);
    const subtotalAfterDiscount = subtotalHT - discountVal;
    
    // VAT Calculation for the paper
    let vatAmount = invoice.vatAmount || 0;
    if (invoice.vatAmount === undefined && !invoice.taxExempt) {
        // Fallback calculation if not stored
        vatAmount = invoice.items.reduce((acc, item) => {
            const itemTotal = (item.quantity * item.unitPrice);
            const itemDiscount = itemTotal * ((invoice.discount || 0) / 100);
            const itemVat = (itemTotal - itemDiscount) * ((item.vatRate || userProfile.defaultVatRate || 0) / 100);
            return acc + itemVat;
        }, 0);
        if (invoice.shipping) {
            vatAmount += invoice.shipping * ((userProfile.defaultVatRate || 0) / 100);
        }
    }

    const totalTTC = subtotalAfterDiscount + (invoice.shipping || 0) + vatAmount;
    const balanceDue = totalTTC - (invoice.deposit || 0);

    return (
        <div 
            className="bg-white p-12 shadow-2xl shadow-brand-200/50 rounded-xl min-h-[1000px] relative mx-auto print:shadow-none print:w-full print:m-0 border border-brand-100" 
            id="invoice-preview"
            style={{ maxWidth: '210mm' }}
        >
           {isPreview && (
               <div className="absolute top-0 right-0 left-0 bg-brand-900 text-white text-center py-1 text-[10px] font-bold uppercase tracking-[0.2em] no-print rounded-t-xl">
                   Mode Aperçu
               </div>
           )}

           {/* Visual Link Banner */}
           {linkedDoc && (
             <div 
                className="bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-8 flex items-center justify-between cursor-pointer hover:bg-brand-100 transition-all print:hidden no-print"
                onClick={() => !isPreview && openLinkedDocument(linkedDoc.id)}
             >
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl text-brand-600 shadow-sm">
                        <LinkIcon size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-brand-900 uppercase tracking-wider">Document lié : {linkedDoc.type === 'quote' ? 'Devis' : linkedDoc.type === 'order' ? 'Commande' : 'Facture'} #{linkedDoc.number}</p>
                        <p className="text-[10px] text-brand-500 font-medium">Cliquez pour voir le document original</p>
                    </div>
                </div>
                {!isPreview && <ArrowRightCircle size={18} className="text-brand-300" />}
             </div>
           )}

           <div className="flex justify-between items-start mb-16">
            <div>
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-14 h-14 bg-brand-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-900/10">
                    {icon}
                 </div>
                 <h1 className="text-2xl font-bold text-brand-900 tracking-tight uppercase font-display">{userProfile.companyName}</h1>
               </div>
               <div className="text-sm text-brand-500 leading-relaxed font-medium">
                <p>{userProfile.address}</p>
                <p>{userProfile.email} • {userProfile.phone}</p>
                <p className="mt-2 font-mono text-[10px] text-brand-400 uppercase tracking-wider">SIRET: {userProfile.siret}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-5xl font-bold text-brand-900 mb-2 tracking-tighter font-display">{title}</h2>
              <p className="text-brand-500 font-mono font-bold text-lg tracking-wider">#{invoice.number}</p>
              
              <div className="mt-10 text-right bg-brand-50/50 p-6 rounded-3xl border border-brand-100 inline-block min-w-[240px]">
                <h3 className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] mb-3">Client</h3>
                <p className="font-bold text-brand-900 text-lg font-display">{client?.name}</p>
                {client?.contactName && <p className="text-sm text-brand-600 font-semibold">{client.contactName}</p>}
                <p className="text-sm text-brand-500 whitespace-pre-line mt-2 leading-relaxed">{client?.address}</p>
                <div className="mt-4 space-y-1">
                    {client?.siret && <p className="text-[10px] text-brand-400 font-mono uppercase tracking-wider">SIRET: {client.siret}</p>}
                    {client?.tvaNumber && <p className="text-[10px] text-brand-400 font-mono uppercase tracking-wider">TVA: {client.tvaNumber}</p>}
                    {client?.website && <p className="text-[10px] text-brand-600 font-mono font-bold">{client.website.replace(/^https?:\/\//, '')}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-16 mb-12 border-y border-brand-100 py-8">
             <div>
                <span className="block text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] mb-2">Date d'émission</span>
                <span className="font-bold text-brand-900 text-lg font-display">{new Date(invoice.date).toLocaleDateString('fr-FR')}</span>
             </div>
             <div>
                <span className="block text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] mb-2">{docType === 'quote' ? 'Validité' : 'Échéance'}</span>
                <span className="font-bold text-brand-900 text-lg font-display">{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</span>
             </div>
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-brand-900 text-left text-[10px] font-bold text-brand-900 uppercase tracking-[0.2em]">
                <th className="py-4">Description</th>
                <th className="py-4 text-right">Qté</th>
                <th className="py-4 text-right">Prix Unitaire</th>
                {!invoice.taxExempt && <th className="py-4 text-right">TVA</th>}
                <th className="py-4 text-right">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50 text-sm">
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-6 text-brand-800 font-semibold leading-relaxed">{item.description}</td>
                  <td className="py-6 text-right text-brand-500 font-medium">{item.quantity} {item.unit}</td>
                  <td className="py-6 text-right text-brand-500 font-medium">{item.unitPrice.toFixed(2)} €</td>
                  {!invoice.taxExempt && <td className="py-6 text-right text-brand-500 font-medium">{item.vatRate || userProfile.defaultVatRate || 0}%</td>}
                  <td className="py-6 text-right font-bold text-brand-900 font-display">{(item.quantity * item.unitPrice).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-16">
            <div className="w-1/2">
                <div className="space-y-4 pb-6 border-b border-brand-100">
                    <div className="flex justify-between text-sm">
                        <span className="text-brand-500 font-medium">Sous-Total HT</span>
                        <span className="font-bold text-brand-900">{subtotalHT.toFixed(2)} €</span>
                    </div>
                    {(invoice.discount || 0) > 0 && (
                        <div className="flex justify-between text-sm text-accent-600">
                            <span className="font-bold uppercase tracking-wider text-[10px]">Remise ({invoice.discount}%)</span>
                            <span className="font-bold">- {discountVal.toFixed(2)} €</span>
                        </div>
                    )}
                    {(invoice.shipping || 0) > 0 && (
                         <div className="flex justify-between text-sm">
                            <span className="text-brand-500 font-medium">Frais de port</span>
                            <span className="font-bold text-brand-900">+ {invoice.shipping?.toFixed(2)} €</span>
                        </div>
                    )}
                    {invoice.taxExempt ? (
                        <div className="flex justify-between text-[10px] text-brand-400 italic">
                            <span>TVA non applicable, art. 293 B du CGI</span>
                            <span>0.00 €</span>
                        </div>
                    ) : (
                        <div className="flex justify-between text-sm">
                            <span className="text-brand-500 font-medium">TVA</span>
                            <span className="font-bold text-brand-900">{vatAmount.toFixed(2)} €</span>
                        </div>
                    )}
                </div>
                
                <div className="pt-6">
                    <div className="flex justify-between items-end mb-2">
                         <span className="text-brand-900 font-bold text-xl font-display uppercase tracking-tight">Total TTC</span>
                         <span className="text-brand-900 font-bold text-3xl font-display">{totalTTC.toFixed(2)} €</span>
                    </div>
                    
                    {(invoice.deposit || 0) > 0 && (
                        <div className="bg-brand-50 p-5 rounded-2xl border border-brand-100 mt-6">
                            <div className="flex justify-between text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-2">
                                <span>Acompte {docType === 'quote' ? 'demandé' : 'déjà réglé'}</span>
                                <span className="font-mono">- {invoice.deposit?.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between font-bold text-xl text-brand-900 border-t border-brand-200 pt-3 font-display">
                                <span>Reste à payer</span>
                                <span>{balanceDue.toFixed(2)} €</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </div>

          <div className="mt-auto pt-12">
             {invoice.eInvoiceStatus && (
                 <div className="mb-6 flex items-center justify-between p-4 bg-brand-50 rounded-2xl border border-brand-100 no-print">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-white rounded-xl text-accent-600 shadow-sm">
                             <Zap size={16} />
                         </div>
                         <div>
                             <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Statut E-Facture 2026</p>
                             <p className="text-xs font-bold text-brand-900">{invoice.eInvoiceStatus}</p>
                         </div>
                     </div>
                     {invoice.transmissionDate && (
                         <div className="text-right">
                             <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Transmis le</p>
                             <p className="text-xs font-bold text-brand-900">{new Date(invoice.transmissionDate).toLocaleString('fr-FR')}</p>
                         </div>
                     )}
                 </div>
             )}
             {invoice.notes && (
                 <div className="mb-12 bg-brand-50/50 p-6 rounded-3xl text-sm text-brand-600 text-left border border-brand-100 relative">
                     <span className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] block mb-3">Notes & Conditions</span>
                     <p className="leading-relaxed">{invoice.notes}</p>
                 </div>
             )}
            <div className="mt-12 pt-10 border-t border-brand-100 grid grid-cols-2 gap-12 text-[9px] text-brand-400 leading-relaxed font-medium uppercase tracking-wider">
                <div>
                    <h4 className="font-bold text-brand-900 mb-3 tracking-[0.2em]">Informations de Paiement</h4>
                    <div className="space-y-1.5 font-mono">
                        <p>IBAN: {userProfile.bankAccount || 'Non renseigné'}</p>
                        <p>BIC: {userProfile.bic || 'Non renseigné'}</p>
                        <p className="mt-4 text-brand-500 font-sans font-bold italic">Règlement par virement bancaire à réception.</p>
                    </div>
                </div>
                <div className="text-right">
                    <h4 className="font-bold text-brand-900 mb-3 tracking-[0.2em]">Mentions Légales</h4>
                    <div className="space-y-1.5">
                        {invoice.taxExempt && <p className="font-bold text-brand-600 italic">TVA non applicable, art. 293 B du CGI</p>}
                        <p>Dispensé d'immatriculation au RCS et au RM.</p>
                        <p>Pénalités de retard : 3 fois le taux d'intérêt légal.</p>
                        <p>Indemnité forfaitaire pour frais de recouvrement : 40 €.</p>
                        {userProfile.legalMentions && <p className="mt-4 text-brand-500 italic lowercase first-letter:uppercase">{userProfile.legalMentions}</p>}
                    </div>
                </div>
            </div>
            <div className="mt-12 text-center text-[8px] text-brand-300 font-bold uppercase tracking-[0.3em] border-t border-brand-50 pt-4">
                {userProfile.companyName} • SIRET {userProfile.siret} • {userProfile.address}
            </div>
          </div>
        </div>
    );
  };

  // --- RENDERERS ---

  if (view === 'create') {
    const selectedClient = clients.find(c => c.id === selectedClientId);

    return (
      <div className="max-w-6xl mx-auto animate-slide-in pb-20 relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('list')} className="p-2.5 hover:bg-brand-200 text-brand-500 rounded-xl transition-all">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-brand-900 font-display">Éditeur : {getDocumentLabel(activeTab)}</h2>
              <p className="text-brand-500 text-sm">Créez votre document en quelques clics.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne Gauche : Config & Client */}
            <div className="lg:col-span-2 space-y-6">
                 {/* Card Client & Dates */}
                <div className="bg-(--card-bg) rounded-[2rem] shadow-sm border border-(--card-border) p-8">
                    {newDocData.linkedDocumentId && (
                        <div className="mb-6 inline-flex items-center gap-2 bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-400 px-3 py-1.5 rounded-full text-xs font-semibold">
                            <LinkIcon size={12} />
                            Lié au document ID: {invoices.find(i => i.id === newDocData.linkedDocumentId)?.number || 'Inconnu'}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-2">Client</label>
                            <select 
                                className={`w-full p-3 bg-(--input-bg) border border-(--input-border) rounded-xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-semibold text-(--text-main)`}
                                value={selectedClientId}
                                onChange={(e) => {
                                    const clientId = e.target.value;
                                    setSelectedClientId(clientId);
                                    
                                    // Update due date based on client payment terms
                                    const client = clients.find(c => c.id === clientId);
                                    if (client?.paymentTerms) {
                                        let days = 30;
                                        if (client.paymentTerms === 'À réception') days = 0;
                                        else if (client.paymentTerms === '15 jours') days = 15;
                                        else if (client.paymentTerms === '30 jours') days = 30;
                                        else if (client.paymentTerms === '30 jours fin de mois') days = 30; // Simplified
                                        else if (client.paymentTerms === '45 jours') days = 45;
                                        else if (client.paymentTerms === '60 jours') days = 60;
                                        
                                        const newDueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                        setNewDocData(prev => ({ ...prev, dueDate: newDueDate }));
                                    }
                                }}
                                disabled={!!newDocData.linkedDocumentId}
                            >
                                <option value="">Sélectionner un client...</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {selectedClient && (
                                <div className="mt-4 p-4 bg-(--bg-main) rounded-xl border border-(--card-border) text-sm">
                                    <p className="font-bold text-(--text-main) font-display">{selectedClient.name}</p>
                                    <p className="text-(--text-muted) whitespace-pre-line mt-1">{selectedClient.address}</p>
                                    {selectedClient.siret && <p className="text-xs text-(--text-muted) mt-2 font-mono">SIRET: {selectedClient.siret}</p>}
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-2">Date d'émission</label>
                                <input 
                                type="date" 
                                className={`w-full p-3 bg-(--input-bg) border border-(--input-border) rounded-xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all text-(--text-main) font-medium`}
                                value={newDocData.date}
                                onChange={(e) => setNewDocData({...newDocData, date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-2">Date d'échéance</label>
                                <input 
                                type="date" 
                                className={`w-full p-3 bg-(--input-bg) border border-(--input-border) rounded-xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all text-(--text-main) font-medium`}
                                value={newDocData.dueDate}
                                onChange={(e) => setNewDocData({...newDocData, dueDate: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card Items */}
                <div className="bg-(--card-bg) rounded-[2rem] shadow-sm border border-(--card-border) p-8">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-(--text-main) font-display">Prestations & Produits</h3>
                     </div>

                     <div className="space-y-4">
                        {newDocData.items?.map((item, index) => (
                            <div key={item.id} className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-(--bg-main)/50 p-4 rounded-xl border border-(--card-border) group hover:border-accent-200 transition-colors">
                                <span className="bg-(--card-bg) w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-(--text-muted) border border-(--card-border) shadow-sm shrink-0">
                                    {index + 1}
                                </span>
                                <div className="flex-1 w-full relative">
                                    <input 
                                        type="text" 
                                        placeholder="Description..."
                                        className="w-full bg-transparent border-b border-(--card-border) focus:border-brand-900 outline-none py-1 text-(--text-main) font-medium placeholder:text-(--text-muted)"
                                        value={item.description}
                                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                    />
                                     <button 
                                        onClick={() => handleGenerateDescription(item.id, item.description)}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 text-accent-400 hover:text-accent-600 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Améliorer avec IA"
                                    >
                                        <Wand2 size={14} className={isGeneratingDesc ? "animate-spin" : ""} />
                                    </button>
                                </div>
                                <div className="flex gap-4 w-full md:w-auto">
                                    <div className="flex flex-col w-20">
                                        <label className="text-[10px] uppercase font-bold text-(--text-muted)">Qté</label>
                                        <input 
                                            type="number" min="0" step="0.5"
                                            className="bg-(--card-bg) border border-(--card-border) rounded-lg p-1.5 text-right outline-none focus:border-brand-900 text-(--text-main) font-bold"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="flex flex-col w-16">
                                        <label className="text-[10px] uppercase font-bold text-(--text-muted)">Unité</label>
                                        <input 
                                            type="text"
                                            placeholder="u"
                                            className="bg-(--card-bg) border border-(--card-border) rounded-lg p-1.5 text-center outline-none focus:border-brand-900 text-(--text-main) font-medium"
                                            value={item.unit || ''}
                                            onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col w-24">
                                        <label className="text-[10px] uppercase font-bold text-(--text-muted)">Prix Uni.</label>
                                        <input 
                                            type="number" min="0" step="0.01"
                                            className="bg-(--card-bg) border border-(--card-border) rounded-lg p-1.5 text-right outline-none focus:border-brand-900 text-(--text-main) font-bold"
                                            value={item.unitPrice}
                                            onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    {!newDocData.taxExempt && (
                                        <div className="flex flex-col w-16">
                                            <label className="text-[10px] uppercase font-bold text-(--text-muted)">TVA %</label>
                                            <input 
                                                type="number" min="0" max="100" step="0.1"
                                                className="bg-(--card-bg) border border-(--card-border) rounded-lg p-1.5 text-center outline-none focus:border-brand-900 text-(--text-main) font-medium"
                                                value={item.vatRate || 0}
                                                onChange={(e) => updateItem(item.id, 'vatRate', parseFloat(e.target.value))}
                                            />
                                        </div>
                                    )}
                                    <div className="flex flex-col w-24 justify-end">
                                        <div className="text-right font-bold text-(--text-main) py-2 font-display">
                                            {(item.quantity * item.unitPrice).toFixed(2)} €
                                        </div>
                                    </div>
                                    <button onClick={() => removeItem(item.id)} className="self-end mb-2 text-(--text-muted) hover:text-red-500 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={addItem} className={`flex-1 py-3 border-2 border-dashed border-(--card-border) rounded-xl text-(--text-muted) hover:border-brand-400 hover:text-brand-600 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2`}>
                                <Plus size={18} /> Ajouter une ligne vide
                            </button>
                            
                            <div className="relative flex-1">
                                <button 
                                    onClick={() => setIsProductSearchOpen(!isProductSearchOpen)}
                                    className={`w-full py-3 pl-10 pr-4 border-2 border-dashed border-(--card-border) rounded-xl text-(--text-muted) hover:border-brand-400 hover:text-brand-600 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 bg-transparent outline-none`}
                                >
                                    <Package size={18} /> + Ajouter depuis le catalogue
                                </button>
                                
                                {isProductSearchOpen && (
                                    <div className="absolute bottom-full mb-2 left-0 right-0 bg-(--card-bg) border border-(--card-border) rounded-2xl shadow-2xl z-20 overflow-hidden animate-slide-up max-h-64 flex flex-col">
                                        <div className="p-3 border-b border-(--card-border) bg-(--bg-main)">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" size={14} />
                                                <input 
                                                    type="text" 
                                                    placeholder="Rechercher un produit..."
                                                    className="w-full pl-9 pr-3 py-2 bg-(--card-bg) border border-(--card-border) rounded-xl text-xs outline-none focus:border-brand-900"
                                                    value={productSearch}
                                                    onChange={e => setProductSearch(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="overflow-y-auto flex-1">
                                            {products
                                                .filter(p => !p.archived && p.name.toLowerCase().includes(productSearch.toLowerCase()))
                                                .map(p => (
                                                    <button 
                                                        key={p.id}
                                                        onClick={() => {
                                                            addProductItem(p.id);
                                                            setIsProductSearchOpen(false);
                                                            setProductSearch('');
                                                        }}
                                                        className="w-full p-3 text-left hover:bg-(--bg-main) border-b border-(--card-border) last:border-0 flex justify-between items-center group transition-colors"
                                                    >
                                                        <div>
                                                            <div className="text-xs font-bold text-(--text-main) group-hover:text-accent-600">{p.name}</div>
                                                            <div className="text-[10px] text-(--text-muted) uppercase font-bold">{p.category || 'Sans catégorie'}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs font-bold text-(--text-main)">{p.price.toFixed(2)}€</div>
                                                            {p.type === 'product' && <div className="text-[10px] text-(--text-muted)">Stock: {p.stock}</div>}
                                                        </div>
                                                    </button>
                                                ))
                                            }
                                            {products.length === 0 && <div className="p-4 text-center text-xs text-(--text-muted) italic">Catalogue vide</div>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Magic Fill Button */}
                        <button 
                            onClick={() => setIsMagicFillOpen(true)}
                            className="w-full py-3 bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 border border-accent-200 dark:border-accent-900/30 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-accent-100 dark:hover:bg-accent-900/40 transition-all"
                        >
                            <Wand2 size={16} /> Remplissage Magique par IA
                        </button>
                     </div>
                </div>

                <div className="bg-(--card-bg) rounded-[2rem] shadow-sm border border-(--card-border) p-8">
                    <label className="block text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-2">Notes & Conditions</label>
                    <textarea 
                        className="w-full p-4 bg-(--input-bg) border border-(--input-border) rounded-xl text-sm focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all resize-none text-(--text-main) font-medium"
                        rows={3}
                        placeholder="Conditions de paiement, mentions légales spécifiques..."
                        value={newDocData.notes || ''}
                        onChange={e => setNewDocData({...newDocData, notes: e.target.value})}
                    />
                </div>

                {/* E-Invoicing 2026 Section */}
                <div className="bg-white p-8 rounded-[2rem] border border-brand-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-brand-50 pb-4">
                        <div className="p-2 bg-accent-50 text-accent-600 rounded-xl">
                            <Zap size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-900 font-display">Facturation Électronique 2026</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">Catégorie d'opération</label>
                            <select 
                                className="w-full p-3 bg-brand-50 border border-brand-200 rounded-xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-semibold text-brand-900"
                                value={newDocData.operationCategory || 'SERVICES'}
                                onChange={(e) => setNewDocData({...newDocData, operationCategory: e.target.value as any})}
                            >
                                <option value="BIENS">Livraison de biens</option>
                                <option value="SERVICES">Prestation de services</option>
                                <option value="MIXTE">Opération mixte</option>
                            </select>
                            <p className="mt-2 text-[10px] text-brand-400 italic">Obligatoire pour la transmission PPF/PDP en 2026.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">Format d'export cible</label>
                            <select 
                                className="w-full p-3 bg-brand-50 border border-brand-200 rounded-xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-semibold text-brand-900"
                                value={newDocData.eInvoiceFormat || 'Factur-X'}
                                onChange={(e) => setNewDocData({...newDocData, eInvoiceFormat: e.target.value as any})}
                            >
                                <option value="Factur-X">Factur-X (PDF hybride)</option>
                                <option value="UBL">UBL (XML standard)</option>
                                <option value="CII">CII (Cross Industry Invoice)</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-4 bg-brand-50 rounded-2xl border border-brand-100">
                        <div className="flex items-start gap-3">
                            <ShieldCheck size={18} className="text-brand-600 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-brand-900">Conformité 2026</p>
                                <p className="text-[10px] text-brand-500 leading-relaxed">
                                    En activant ces options, vos factures incluront les métadonnées nécessaires pour être acceptées par le Portail Public de Facturation (PPF) ou votre Plateforme de Dématérialisation Partenaire (PDP).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Colonne Droite : Totaux & Validation */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-brand-900 text-white rounded-[2rem] p-8 shadow-xl shadow-brand-900/10 sticky top-6">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 font-display">
                        <Calculator size={20} className="text-accent-400" />
                        Récapitulatif
                    </h3>

                    <div className="space-y-4 mb-6 text-sm">
                        <div className="flex justify-between items-center text-brand-300">
                            <span>Sous-total HT</span>
                            <span className="font-bold font-display">{formTotals.subtotalHT.toFixed(2)} €</span>
                        </div>
                        
                        {/* Tax Exempt Toggle */}
                        <div className="flex justify-between items-center py-2 border-y border-white/5">
                            <span className="text-xs text-brand-400 font-medium italic">Exonéré de TVA (Auto-entrepreneur)</span>
                            <button 
                                onClick={() => setNewDocData({...newDocData, taxExempt: !newDocData.taxExempt})}
                                className={`w-10 h-5 rounded-full transition-all relative ${newDocData.taxExempt ? 'bg-accent-500' : 'bg-brand-700'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${newDocData.taxExempt ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Remise Input */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-brand-300">
                                <Percent size={14} />
                                <span>Remise (%)</span>
                            </div>
                            <input 
                                type="number" min="0" max="100"
                                className="w-16 bg-brand-800 border border-brand-700 rounded-lg px-2 py-1 text-right text-white outline-none focus:border-accent-500 font-bold"
                                value={newDocData.discount || ''}
                                onChange={(e) => setNewDocData({...newDocData, discount: parseFloat(e.target.value)})}
                                placeholder="0"
                            />
                        </div>
                        {formTotals.discountAmount > 0 && (
                            <div className="flex justify-end text-xs text-accent-400 font-bold">
                                - {formTotals.discountAmount.toFixed(2)} €
                            </div>
                        )}

                        {/* Shipping Input */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-brand-300">
                                <Truck size={14} />
                                <span>Frais de port</span>
                            </div>
                            <input 
                                type="number" min="0"
                                className="w-20 bg-brand-800 border border-brand-700 rounded-lg px-2 py-1 text-right text-white outline-none focus:border-accent-500 font-bold"
                                value={newDocData.shipping || ''}
                                onChange={(e) => setNewDocData({...newDocData, shipping: parseFloat(e.target.value)})}
                                placeholder="0.00"
                            />
                        </div>

                        {/* VAT Summary */}
                        {!newDocData.taxExempt && (
                            <div className="flex justify-between items-center text-brand-300 pt-2">
                                <span>Total TVA</span>
                                <span className="font-bold">{formTotals.vatAmount.toFixed(2)} €</span>
                            </div>
                        )}

                        <div className="h-px bg-white/10 my-4"></div>

                        <div className="flex justify-between items-end">
                            <span className="font-bold text-lg font-display">Total</span>
                            <span className="font-bold text-2xl tracking-tight font-display">{formTotals.total.toFixed(2)} €</span>
                        </div>

                         {/* Deposit Input */}
                         <div className="bg-white/5 p-4 rounded-xl mt-6">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2 text-brand-300 text-[10px] uppercase font-bold tracking-widest">
                                    <Coins size={12} />
                                    <span>Acompte {activeTab === 'quote' ? 'demandé' : 'versé'}</span>
                                </div>
                                <input 
                                    type="number" min="0"
                                    className="w-24 bg-brand-900 border border-brand-700 rounded-lg px-2 py-1 text-right text-white outline-none focus:border-accent-500 font-bold text-sm"
                                    value={newDocData.deposit || ''}
                                    onChange={(e) => setNewDocData({...newDocData, deposit: parseFloat(e.target.value)})}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-white/10">
                                <span className="text-accent-200 font-bold text-sm">Reste à payer</span>
                                <span className="text-accent-200 font-bold text-lg font-display">{formTotals.balanceDue.toFixed(2)} €</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={saveDocument}
                            className={`w-full bg-white text-brand-900 py-4 rounded-xl hover:bg-brand-50 font-bold shadow-lg shadow-brand-900/20 transition-all hover:scale-[1.02] active:scale-95 text-xs uppercase tracking-widest`}
                        >
                            Enregistrer
                        </button>
                        
                         {selectedClientId && (
                             <button 
                                onClick={() => setShowLivePreview(true)}
                                className="w-full bg-brand-800 text-brand-300 py-3 rounded-xl hover:bg-brand-700 font-bold transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                            >
                                <Eye size={18} /> Aperçu PDF
                            </button>
                         )}
                    </div>
                </div>
            </div>
        </div>

        {/* Live Preview Modal */}
        {showLivePreview && (
            <div className="fixed inset-0 z-50 bg-brand-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-brand-50 w-full max-w-5xl h-[90vh] rounded-[2rem] flex flex-col shadow-2xl overflow-hidden relative border border-brand-200">
                    <div className="flex justify-between items-center p-4 bg-white border-b border-brand-200">
                        <h3 className="font-bold text-brand-900 flex items-center gap-2 font-display">
                            <Eye size={20} className="text-accent-500"/> Aperçu avant enregistrement
                        </h3>
                        <button 
                            onClick={() => setShowLivePreview(false)}
                            className="p-2 hover:bg-brand-50 rounded-full text-brand-500 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-brand-100/50">
                        <InvoicePaper invoice={getPreviewInvoice()} isPreview={true} />
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  if (view === 'detail' && selectedInvoice) {
     const docType = selectedInvoice.type || 'invoice';
     
     // Find linked documents
     const parentDoc = selectedInvoice.linkedDocumentId ? invoices.find(inv => inv.id === selectedInvoice.linkedDocumentId) : null;
     const childDocs = invoices.filter(inv => inv.linkedDocumentId === selectedInvoice.id);
     const allLinkedDocs = [
       ...(parentDoc ? [{ doc: parentDoc, relation: 'origine' }] : []),
       ...childDocs.map(doc => ({ doc, relation: 'suite' }))
     ];
     
    return (
      <div className="max-w-4xl mx-auto animate-fade-in pb-10">
        <div className="sticky top-0 z-10 bg-brand-50/80 backdrop-blur-md py-4 mb-6 flex justify-between items-center print:hidden border-b border-brand-200/50 no-print">
          <button onClick={() => setView('list')} className="flex items-center gap-2 text-brand-600 hover:text-brand-900 font-bold px-4 py-2 hover:bg-white rounded-xl transition-all uppercase tracking-widest text-[10px]">
            <ArrowLeft size={16} /> Retour
          </button>
          
          <div className="flex items-center gap-3">
             {/* CUSTOM STATUS SELECTOR */}
            <div className="flex items-center gap-2 bg-white border border-brand-200 rounded-xl p-1 pr-3 shadow-sm">
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest ml-3">Statut</span>
                {isCustomStatus ? (
                  <div className="flex items-center gap-1">
                    <input 
                      type="text" 
                      autoFocus
                      className="text-sm font-bold rounded-lg py-1 px-2 outline-none bg-brand-50 w-32 border border-brand-200"
                      placeholder="Nouveau statut"
                      value={selectedInvoice.status}
                      onChange={(e) => updateStatus(selectedInvoice.id, e.target.value)}
                      onBlur={() => setIsCustomStatus(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsCustomStatus(false)}
                    />
                    <button onClick={() => setIsCustomStatus(false)} className="text-brand-400 hover:text-brand-600"><CheckSquare size={14}/></button>
                  </div>
                ) : (
                  <select 
                    value={selectedInvoice.status}
                    onChange={(e) => updateStatus(selectedInvoice.id, e.target.value)}
                    className={`text-sm font-bold rounded-lg py-1 px-2 cursor-pointer outline-none bg-transparent ${
                        selectedInvoice.status === InvoiceStatus.PAID || selectedInvoice.status === InvoiceStatus.ACCEPTED ? 'text-accent-600' :
                        selectedInvoice.status === InvoiceStatus.SENT ? 'text-amber-600' :
                        selectedInvoice.status === InvoiceStatus.REJECTED ? 'text-red-600' :
                        'text-brand-600'
                    }`}
                  >
                  {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="CUSTOM_INPUT" className="font-bold text-brand-600">+ Personnalisé...</option>
                  </select>
                )}
            </div>
            
            {/* Reminder Feature */}
            {selectedInvoice.status !== InvoiceStatus.PAID && (
                 <div className="flex items-center bg-white border border-brand-200 rounded-xl shadow-sm relative group">
                    <div className="p-2 text-brand-400 group-hover:text-brand-600 transition-colors">
                        <Bell size={16} />
                    </div>
                    <input 
                        type="date" 
                        className="text-xs font-bold text-brand-600 bg-transparent outline-none w-28 cursor-pointer"
                        value={selectedInvoice.reminderDate || ''}
                        onChange={(e) => updateReminder(selectedInvoice.id, e.target.value)}
                        title="Date de rappel"
                    />
                 </div>
            )}

            <button 
                onClick={() => handleEmail(selectedInvoice)}
                className="p-2.5 text-brand-500 hover:text-brand-900 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-brand-200"
                title="Envoyer par email"
            >
                <Mail size={18} />
            </button>
            <button 
                onClick={() => handleDuplicate(selectedInvoice)}
                className="p-2.5 text-brand-500 hover:text-brand-900 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-brand-200"
                title="Dupliquer"
            >
                <Copy size={18} />
            </button>

            {docType === 'quote' && selectedInvoice.status === InvoiceStatus.SENT && (
                <>
                <button 
                    onClick={() => updateStatus(selectedInvoice.id, InvoiceStatus.ACCEPTED)}
                    className="p-2.5 text-accent-600 hover:bg-accent-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-accent-200"
                    title="Accepter"
                >
                    <ThumbsUp size={18} />
                </button>
                 <button 
                    onClick={() => updateStatus(selectedInvoice.id, InvoiceStatus.REJECTED)}
                    className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-200"
                    title="Refuser"
                >
                    <ThumbsDown size={18} />
                </button>
                </>
            )}

            {docType === 'quote' && selectedInvoice.status === InvoiceStatus.ACCEPTED && (
                <button 
                    onClick={() => convertQuoteToInvoice(selectedInvoice)}
                    className="p-2.5 text-accent-600 hover:bg-accent-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-accent-200"
                    title="Convertir en Facture"
                >
                    <Repeat size={18} />
                </button>
            )}

             {docType === 'order' && (
                <button 
                    onClick={() => convertOrderToInvoice(selectedInvoice)}
                    className="p-2.5 text-brand-600 hover:bg-brand-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-brand-200"
                    title="Facturer"
                >
                    <ArrowRightCircle size={18} />
                </button>
            )}

            {docType === 'invoice' && (
                <>
                    <button 
                        onClick={() => createCreditNoteFromInvoice(selectedInvoice)}
                        className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-rose-200"
                        title="Créer un avoir"
                    >
                        <Receipt size={18} />
                    </button>
                    <button 
                        onClick={() => handleTransmitPPF(selectedInvoice)}
                        className="p-2.5 text-accent-600 hover:bg-accent-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-accent-200"
                        title="Transmettre au PPF (2026)"
                    >
                        <Zap size={18} />
                    </button>
                </>
            )}
            
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-900 text-white rounded-xl hover:bg-brand-800 transition-all shadow-lg shadow-brand-900/20 font-bold text-xs uppercase tracking-widest"
              title="Télécharger en PDF via l'impression"
            >
              <Printer size={16} /> PDF / Imprimer
            </button>
          </div>
        </div>

        {/* Linked Documents Section */}
        {allLinkedDocs.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-4 no-print">
            {allLinkedDocs.map(({ doc, relation }) => (
              <div key={doc.id} className="flex-1 min-w-[300px] bg-white border border-brand-100 rounded-3xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
                    <LinkIcon size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] mb-1">
                      {relation === 'origine' ? 'Document d\'origine' : 'Document lié (suite)'}
                    </p>
                    <p className="text-sm font-bold text-brand-900 font-display">
                      {getDocumentLabel(doc.type)} <span className="text-brand-500">#{doc.number}</span>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedInvoice(doc);
                    setActiveTab(doc.type);
                  }}
                  className="flex items-center gap-2 text-[10px] font-bold text-brand-600 hover:text-brand-900 bg-brand-50 px-4 py-2.5 rounded-xl transition-all uppercase tracking-widest"
                >
                  Voir <ExternalLink size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Invoice Paper Component */}
        <InvoicePaper invoice={selectedInvoice} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in relative pb-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
            <h2 className="text-3xl font-bold text-brand-900 dark:text-white font-display tracking-tight">Documents Commerciaux</h2>
            <p className="text-brand-500 dark:text-brand-400 mt-1 text-sm font-medium">Gérez vos factures, devis et commandes en un seul endroit.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            {/* Type Toggle Pills */}
            <div className="bg-brand-100/50 dark:bg-brand-900/50 p-1 rounded-2xl border border-brand-100 dark:border-brand-800 backdrop-blur-sm flex gap-1">
                <button onClick={() => { setActiveTab('invoice'); setSelectedIds(new Set()); }} className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${activeTab === 'invoice' ? 'bg-white dark:bg-brand-800 text-brand-900 dark:text-brand-50 shadow-sm' : 'text-brand-400 dark:text-brand-500 hover:text-brand-600 dark:hover:text-brand-300'}`}><FileText size={14} /> Factures</button>
                <button onClick={() => { setActiveTab('quote'); setSelectedIds(new Set()); }} className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${activeTab === 'quote' ? 'bg-white dark:bg-brand-800 text-brand-900 dark:text-brand-50 shadow-sm' : 'text-brand-400 dark:text-brand-500 hover:text-brand-600 dark:hover:text-brand-300'}`}><FileCheck size={14} /> Devis</button>
                <button onClick={() => { setActiveTab('order'); setSelectedIds(new Set()); }} className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${activeTab === 'order' ? 'bg-white dark:bg-brand-800 text-brand-900 dark:text-brand-50 shadow-sm' : 'text-brand-400 dark:text-brand-500 hover:text-brand-600 dark:hover:text-brand-300'}`}><ShoppingBag size={14} /> Commandes</button>
                <button onClick={() => { setActiveTab('credit_note'); setSelectedIds(new Set()); }} className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${activeTab === 'credit_note' ? 'bg-white dark:bg-brand-800 text-brand-900 dark:text-brand-50 shadow-sm' : 'text-brand-400 dark:text-brand-500 hover:text-brand-600 dark:hover:text-brand-300'}`}><Receipt size={14} /> Avoirs</button>
            </div>

            <div className="flex gap-2">
                <button 
                    onClick={exportCurrentViewCSV}
                    className="bg-white dark:bg-brand-900 text-brand-600 dark:text-brand-300 border border-brand-100 dark:border-brand-800 px-5 py-2.5 rounded-2xl flex items-center gap-2 transition-all text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-brand-50 dark:hover:bg-brand-800"
                    title={`Exporter en CSV`}
                >
                    <Download size={16} />
                    <span className="hidden sm:inline">Export</span>
                </button>

                <button 
                    onClick={startCreate}
                    className="bg-brand-900 dark:bg-white text-white dark:text-brand-900 px-6 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-brand-900/10 dark:shadow-white/5 text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus size={18} />
                    Nouveau
                </button>
            </div>
        </div>
      </div>

      {/* Stats Cards (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-modern p-6 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-(--text-main)">
                  <Calculator size={120} />
              </div>
              <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-(--bg-main) text-(--text-main) rounded-xl">
                      <Calculator size={20} />
                  </div>
                  <span className="badge bg-(--bg-main) text-(--text-muted)">Total {getDocumentLabel(activeTab)}s</span>
              </div>
              <div>
                  <h3 className="text-2xl font-bold text-(--text-main) font-display tracking-tight">{stats.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</h3>
                  <p className="text-xs text-(--text-muted) mt-1 font-medium">{stats.count} documents au total</p>
              </div>
          </div>
          <div className="card-modern p-6 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-accent-600">
                  <FileCheck size={120} />
              </div>
              <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 rounded-xl">
                      <FileCheck size={20} />
                  </div>
                  <span className="badge bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400">Réglé / Accepté</span>
              </div>
              <div>
                  <h3 className="text-2xl font-bold text-accent-600 dark:text-accent-400 font-display tracking-tight">{stats.paid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</h3>
                  <p className="text-xs text-(--text-muted) mt-1 font-medium">Revenus sécurisés</p>
              </div>
          </div>
          <div className="card-modern p-6 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-amber-500">
                  <Clock size={120} />
              </div>
              <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
                      <Clock size={20} />
                  </div>
                  <span className="badge bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">En attente</span>
              </div>
              <div>
                  <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-display tracking-tight">{stats.pending.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</h3>
                  <p className="text-xs text-(--text-muted) mt-1 font-medium">À encaisser</p>
              </div>
          </div>
          <div className="card-modern p-6 flex flex-col justify-between relative overflow-hidden group border-red-100 dark:border-red-900/30">
              <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-red-500">
                  <AlertCircle size={120} />
              </div>
              <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
                      <AlertCircle size={20} />
                  </div>
                  <span className="badge bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">En retard</span>
              </div>
              <div>
                  <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 font-display tracking-tight">{stats.overdue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</h3>
                  <p className="text-xs text-(--text-muted) mt-1 font-medium">Action requise</p>
              </div>
          </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white dark:bg-brand-900/30 rounded-3xl p-6 shadow-sm border border-brand-100 dark:border-brand-800 flex flex-wrap gap-6 items-end">
         <div className="flex flex-col gap-2.5">
             <label className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest">Période</label>
             <div className="flex items-center gap-3">
                 <div className="relative">
                     <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400" size={14} />
                     <input 
                        type="date" 
                        className="pl-10 pr-4 py-2.5 bg-brand-50/50 dark:bg-brand-950 border border-brand-100 dark:border-brand-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-brand-900/5 dark:focus:ring-white/5 transition-all text-brand-900 dark:text-brand-100 uppercase tracking-wider"
                        value={filters.dateStart}
                        onChange={(e) => setFilters({...filters, dateStart: e.target.value})}
                     />
                 </div>
                 <span className="text-brand-300 dark:text-brand-700 font-bold">→</span>
                 <div className="relative">
                     <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400" size={14} />
                     <input 
                        type="date" 
                        className="pl-10 pr-4 py-2.5 bg-brand-50/50 dark:bg-brand-950 border border-brand-100 dark:border-brand-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-brand-900/5 dark:focus:ring-white/5 transition-all text-brand-900 dark:text-brand-100 uppercase tracking-wider"
                        value={filters.dateEnd}
                        onChange={(e) => setFilters({...filters, dateEnd: e.target.value})}
                     />
                 </div>
             </div>
         </div>
         <div className="flex flex-col gap-2.5">
             <label className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest">Client</label>
             <select 
                className="px-5 py-2.5 bg-brand-50/50 dark:bg-brand-950 border border-brand-100 dark:border-brand-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-brand-900/5 dark:focus:ring-white/5 transition-all w-56 text-brand-900 dark:text-brand-100 uppercase tracking-wider cursor-pointer"
                value={filters.clientId}
                onChange={(e) => setFilters({...filters, clientId: e.target.value})}
             >
                 <option value="">Tous les clients</option>
                 {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
         </div>
         <div className="flex flex-col gap-2.5">
             <label className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest">Statut</label>
             <select 
                className="px-5 py-2.5 bg-brand-50/50 dark:bg-brand-950 border border-brand-100 dark:border-brand-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-brand-900/5 dark:focus:ring-white/5 transition-all w-48 text-brand-900 dark:text-brand-100 uppercase tracking-wider cursor-pointer"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
             >
                 <option value="">Tous les statuts</option>
                 {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
         </div>
         <button 
            onClick={() => setFilters({ dateStart: '', dateEnd: '', status: '', clientId: '' })}
            className="px-5 py-2.5 text-brand-500 hover:text-brand-900 dark:hover:text-brand-100 text-[10px] font-bold uppercase tracking-widest transition-colors"
         >
            Réinitialiser
         </button>
      </div>

      {/* BULK ACTION BAR */}
      {selectedIds.size > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-brand-900 dark:bg-white text-white dark:text-brand-900 rounded-2xl p-4 shadow-2xl flex items-center gap-6 animate-slide-up border border-white/10 dark:border-brand-200">
              <div className="flex items-center gap-3 border-r border-white/20 dark:border-brand-200 pr-6">
                  <div className="bg-white/10 dark:bg-brand-100 px-3 py-1 rounded-lg text-sm font-bold">
                      {selectedIds.size}
                  </div>
                  <span className="text-sm font-medium whitespace-nowrap">sélectionné(s)</span>
              </div>
              <div className="flex gap-2">
                   {activeTab !== 'quote' && (
                       <button onClick={() => handleBulkStatusChange(InvoiceStatus.PAID)} className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-accent-500/20">
                           Marquer Payée
                       </button>
                   )}
                   {activeTab === 'quote' && (
                       <>
                       <button onClick={() => handleBulkStatusChange(InvoiceStatus.ACCEPTED)} className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-accent-500/20">
                           Accepter
                       </button>
                       <button onClick={() => handleBulkStatusChange(InvoiceStatus.REJECTED)} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-500/20">
                           Refuser
                       </button>
                       </>
                   )}
                   <button onClick={() => handleBulkStatusChange(InvoiceStatus.SENT)} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20">
                       Envoyée
                   </button>
                   <button onClick={() => setSelectedIds(new Set())} className="p-2 hover:bg-white/10 dark:hover:bg-brand-100 rounded-xl transition-colors">
                       <X size={18} />
                   </button>
              </div>
          </div>
      )}

      <div className="bg-white dark:bg-brand-900 rounded-3xl shadow-sm border border-brand-200 dark:border-brand-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-brand-50/50 dark:bg-brand-800/50 text-brand-500 dark:text-brand-400 border-b border-brand-100 dark:border-brand-800">
                <th className="px-6 py-5 w-12 text-center">
                    <button onClick={toggleSelectAll} className="text-brand-400 hover:text-brand-600 dark:hover:text-brand-200 transition-colors">
                        {selectedIds.size > 0 && selectedIds.size === filteredAndSortedDocuments.length ? <CheckSquare size={20} className="text-brand-900 dark:text-white" /> : <Square size={20} />}
                    </button>
                </th>
                <th className="px-4 py-5 font-bold uppercase tracking-widest text-[10px] cursor-pointer hover:text-brand-900 dark:hover:text-white transition-colors" onClick={() => handleSort('number')}>
                    <div className="flex items-center gap-2">Numéro {sortConfig.key === 'number' && (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</div>
                </th>
                <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px] cursor-pointer hover:text-brand-900 dark:hover:text-white transition-colors" onClick={() => handleSort('client')}>
                    <div className="flex items-center gap-2">Client {sortConfig.key === 'client' && (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</div>
                </th>
                <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px] cursor-pointer hover:text-brand-900 dark:hover:text-white transition-colors" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-2">Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</div>
                </th>
                <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px] text-right cursor-pointer hover:text-brand-900 dark:hover:text-white transition-colors" onClick={() => handleSort('total')}>
                    <div className="flex items-center justify-end gap-2">Total TTC {sortConfig.key === 'total' && (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</div>
                </th>
                <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px] text-center">Statut</th>
                <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100 dark:divide-brand-800">
              {filteredAndSortedDocuments.map((doc) => {
                 const clientName = clients.find(c => c.id === doc.clientId)?.name || 'Client Inconnu';
                 const type = doc.type || 'invoice';
                 
                 let Icon = FileText;
                 let iconBg = 'bg-brand-50 dark:bg-brand-800';
                 let iconColor = 'text-brand-600 dark:text-brand-400';
                 
                 if (type === 'quote') {
                     Icon = FileCheck;
                     iconBg = 'bg-accent-50 dark:bg-accent-900/20';
                     iconColor = 'text-accent-600 dark:text-accent-400';
                 } else if (type === 'order') {
                     Icon = ShoppingBag;
                     iconBg = 'bg-amber-50 dark:bg-amber-900/20';
                     iconColor = 'text-amber-600 dark:text-amber-400';
                 } else if (type === 'credit_note') {
                     Icon = Receipt;
                     iconBg = 'bg-red-50 dark:bg-red-900/20';
                     iconColor = 'text-red-600 dark:text-red-400';
                 }

                 return (
                  <tr key={doc.id} className={`hover:bg-brand-50/50 dark:hover:bg-brand-800/30 transition-all group ${selectedIds.has(doc.id) ? 'bg-brand-50/80 dark:bg-brand-800/50' : ''}`}>
                    <td className="px-6 py-5 text-center">
                         <button onClick={() => toggleSelection(doc.id)} className={`transition-all duration-300 ${selectedIds.has(doc.id) ? 'text-brand-900 dark:text-white scale-110' : 'text-brand-300 dark:text-brand-700 hover:text-brand-500'}`}>
                            {selectedIds.has(doc.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                        </button>
                    </td>
                    <td className="px-4 py-5">
                         <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} ${iconColor} shadow-sm transition-transform group-hover:scale-110`}>
                                <Icon size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-mono font-bold text-brand-900 dark:text-white">{doc.number}</span>
                                <div className="flex gap-2 mt-0.5">
                                    {doc.linkedDocumentId && <span className="text-[10px] font-bold text-brand-400 dark:text-brand-500 flex items-center gap-1 uppercase tracking-wider"><LinkIcon size={10} /> Lié</span>}
                                    {doc.reminderDate && <span className="text-[10px] font-bold text-orange-500 flex items-center gap-1 uppercase tracking-wider"><Bell size={10} /> {new Date(doc.reminderDate).toLocaleDateString()}</span>}
                                </div>
                            </div>
                         </div>
                    </td>
                    <td className="px-6 py-5">
                        <span className="text-brand-900 dark:text-white font-bold block">{clientName}</span>
                        <span className="text-[10px] text-brand-400 dark:text-brand-500 uppercase font-bold tracking-widest">Client ID: {doc.clientId.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-5">
                        <span className="text-brand-700 dark:text-brand-300 font-medium">{new Date(doc.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                        <span className="text-brand-900 dark:text-white font-black text-base">{doc.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border
                        ${doc.status === InvoiceStatus.PAID || doc.status === InvoiceStatus.ACCEPTED ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 border-accent-100 dark:border-accent-900/50' : 
                          doc.status === InvoiceStatus.SENT ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' :
                          doc.status === InvoiceStatus.REJECTED ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50' :
                          'bg-brand-50 dark:bg-brand-800 text-brand-500 dark:text-brand-400 border-brand-200 dark:border-brand-700'}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button 
                            onClick={() => { setSelectedInvoice(doc); setView('detail'); }}
                            className="text-brand-500 hover:text-brand-900 dark:hover:text-white hover:bg-brand-100 dark:hover:bg-brand-800 p-2.5 rounded-xl transition-all"
                            title="Aperçu"
                        >
                            <Eye size={18} />
                        </button>
                        <button 
                            onClick={() => { setSelectedInvoice(doc); setView('detail'); }}
                            className="text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-800 p-2.5 rounded-xl transition-all"
                            title="Détails"
                        >
                            <FileText size={18} />
                        </button>
                        <button 
                            onClick={() => deleteDocument(doc.id)}
                            className="text-brand-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2.5 rounded-xl transition-all"
                            title="Supprimer"
                        >
                            <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                 );
              })}
              {filteredAndSortedDocuments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-brand-300 dark:text-brand-700">
                        <FileText size={64} className="mb-4 opacity-50" />
                        <p className="text-lg font-bold text-brand-500 dark:text-brand-400 font-display">Aucun document trouvé</p>
                        <p className="text-sm">Modifiez vos filtres ou créez un nouveau document.</p>
                        <button 
                            onClick={startCreate}
                            className="mt-8 btn-primary px-6 py-3"
                        >
                            <Plus size={20} />
                            Créer un document
                        </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Magic Fill Modal */}
      {isMagicFillOpen && (
          <div className="fixed inset-0 bg-brand-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
                  <div className="p-8 border-b border-brand-100 flex justify-between items-center bg-brand-50/50">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-accent-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-accent-500/20">
                              <Wand2 size={20} />
                          </div>
                          <div>
                              <h3 className="text-xl font-bold text-brand-900">Remplissage Magique</h3>
                              <p className="text-xs text-brand-500 font-medium">Décrivez ce que vous voulez facturer</p>
                          </div>
                      </div>
                      <button onClick={() => setIsMagicFillOpen(false)} className="p-2 hover:bg-brand-200 rounded-full text-brand-500 transition-colors">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-8 space-y-6">
                      <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 italic text-sm text-brand-600">
                          "Exemple : 3 jours de consulting IT à 500€/jour et 2 licences logicielles à 150€ l'unité."
                      </div>
                      <textarea 
                          rows={4}
                          className="w-full p-4 bg-brand-50 border border-brand-200 rounded-2xl focus:ring-4 focus:ring-accent-500/10 focus:border-accent-500 outline-none transition-all resize-none text-brand-900 font-medium"
                          placeholder="Décrivez votre prestation ici..."
                          value={magicFillPrompt}
                          onChange={e => setMagicFillPrompt(e.target.value)}
                          autoFocus
                      />
                      <div className="flex gap-3">
                          <button 
                              onClick={() => setIsMagicFillOpen(false)}
                              className="flex-1 py-3 text-brand-600 font-bold text-xs uppercase tracking-widest hover:bg-brand-50 rounded-2xl transition-all"
                          >
                              Annuler
                          </button>
                          <button 
                              onClick={handleMagicFill}
                              disabled={isMagicFilling || !magicFillPrompt.trim()}
                              className="flex-1 bg-brand-900 text-white py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-brand-800 transition-all shadow-lg shadow-brand-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                              {isMagicFilling ? <Wand2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                              Générer les lignes
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default InvoiceManager;

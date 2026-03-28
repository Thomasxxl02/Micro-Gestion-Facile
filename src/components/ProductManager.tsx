import React, { useState, useMemo } from 'react';
import type { Product } from '../types';
import {
  Plus,
  Minus,
  Search,
  Trash2,
  Package,
  Briefcase,
  X,
  Edit2,
  Zap,
  Download,
  SortAsc,
  Filter,
  Tag,
  Archive,
  RotateCcw,
  Upload,
  Hash,
  Ruler,
  AlertCircle,
  ArrowRightCircle,
} from 'lucide-react';
import { validateAmount } from '../lib/validators';

interface ProductManagerProps {
  products: Product[];
  onSave?: (product: Product) => void;
  onDelete?: (id: string) => void;
}

type SortOption = 'name' | 'price' | 'type' | 'category' | 'stock';

const ProductManager: React.FC<ProductManagerProps> = ({ products, onSave, onDelete }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showArchived, setShowArchived] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // État pour les erreurs de validation
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    type: 'service',
    category: '',
    sku: '',
    unit: 'unité',
    stock: 0,
    minStock: 0,
  });

  // Extraire les catégories uniques
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      type: 'service',
      category: '',
      sku: '',
      unit: 'unité',
      stock: 0,
      minStock: 0,
    });
    setIsPanelOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({ ...product });
    setIsPanelOpen(true);
  };

  // --- VALIDATION HELPERS ---
  const validateProductData = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = 'Nom obligatoire';
    }

    const priceValue = Number(formData.price) || 0;
    if (priceValue < 0) {
      errors.price = 'Prix doit être positif ou zéro';
    } else {
      const amountResult = validateAmount(formData.price || 0);
      if (!amountResult.valid) {
        errors.price = amountResult.error || 'Prix invalide';
      }
    }

    if (formData.type === 'product') {
      const stockValue = Number(formData.stock) || 0;
      if (stockValue < 0) {
        errors.stock = 'Stock doit être positif ou zéro';
      }
      const minStockValue = Number(formData.minStock) || 0;
      if (minStockValue < 0) {
        errors.minStock = "Seuil d'alerte doit être positif ou zéro";
      }
    }

    return errors;
  };

  const createProductFromForm = (): Product => {
    const isService = formData.type === 'service';
    return {
      id: Date.now().toString(),
      name: formData.name || '',
      description: formData.description || '',
      price: Number(formData.price) || 0,
      type: (formData.type as 'service' | 'product') || 'product',
      category: formData.category,
      sku: formData.sku,
      unit: formData.unit,
      stock: !isService ? Number(formData.stock) || 0 : undefined,
      minStock: !isService ? Number(formData.minStock) || 0 : undefined,
      archived: false,
      createdAt: new Date().toISOString(),
    };
  };

  const handleSubmit = () => {
    const errors = validateProductData();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (editingId) {
      const baseProduct = products.find((p) => p.id === editingId);
      if (baseProduct && onSave) {
        onSave({ ...baseProduct, ...formData } as Product);
      }
    } else if (onSave) {
      onSave(createProductFromForm());
    }

    setValidationErrors({});
    setIsPanelOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Supprimer définitivement cet élément du catalogue ?')) {
      if (onDelete) {
        onDelete(id);
      }
    }
  };

  const toggleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const product = products.find((p) => p.id === id);
    if (product) {
      const updated = { ...product, archived: !product.archived };
      if (onSave) {
        onSave(updated);
      }
    }
  };

  const updateStock = (id: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const product = products.find((p) => p.id === id);
    if (product) {
      const updated = { ...product, stock: Math.max(0, (product.stock || 0) + delta) };
      if (onSave) {
        onSave(updated);
      }
    }
  };

  const exportCSV = () => {
    const headers = [
      'Référence',
      'Nom',
      'Type',
      'Catégorie',
      'Prix',
      'Unité',
      'Stock',
      'Seuil Alerte',
      'Description',
      'Statut',
    ];
    const rows = products.map((p) =>
      [
        `"${p.sku || ''}"`,
        `"${p.name}"`,
        `"${p.type === 'service' ? 'Prestation' : 'Marchandise'}"`,
        `"${p.category || ''}"`,
        p.price.toFixed(2),
        `"${p.unit || ''}"`,
        p.stock ?? '',
        p.minStock ?? '',
        `"${p.description.replaceAll('"', '""')}"`,
        p.archived ? '"Archivé"' : '"Actif"',
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalogue_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const parseCSVLine = (line: string): string[] =>
    line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((p) => p.trim().replaceAll('"', ''));

  const createProductFromCSVLine = (parts: string[], lineIndex: number): Product => ({
    id: (Date.now() + lineIndex).toString(),
    sku: parts[0] || '',
    name: parts[1],
    type: parts[2]?.toLowerCase().includes('prest') ? 'service' : 'product',
    category: parts[3] || '',
    price: Number.parseFloat(parts[4]) || 0,
    unit: parts[5] || 'unité',
    stock: parts[6] ? Number.parseInt(parts[6]) : undefined,
    minStock: parts[7] ? Number.parseInt(parts[7]) : undefined,
    description: parts[8] || '',
    archived: parts[9]?.toLowerCase().includes('arch') ?? false,
    createdAt: new Date().toISOString(),
  });

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    const lines = text.split('\n');
    const newProducts: Product[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        continue;
      }

      const parts = parseCSVLine(line);
      if (parts.length >= 2) {
        newProducts.push(createProductFromCSVLine(parts, i));
      }
    }

    if (newProducts.length > 0) {
      newProducts.forEach((p) => onSave?.(p));
      alert(`${newProducts.length} éléments importés avec succès.`);
    }
  };

  // --- STATISTICS HELPERS ---
  const globalStats = useMemo(() => {
    const activeProducts = products.filter((p) => !p.archived);
    const services = activeProducts.filter((p) => p.type === 'service');
    const goods = activeProducts.filter((p) => p.type === 'product');
    const lowStock = goods.filter((p) => (p.stock || 0) <= (p.minStock || 0));

    return {
      total: activeProducts.length,
      servicesCount: services.length,
      goodsCount: goods.length,
      lowStockCount: lowStock.length,
    };
  }, [products]);

  const processedProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let result = products.filter(
      (p) =>
        ((p.name || '').toLowerCase().includes(term) ||
          (p.description || '').toLowerCase().includes(term) ||
          (p.sku || '').toLowerCase().includes(term)) &&
        (showArchived ? p.archived === true : !p.archived)
    );

    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (showLowStockOnly) {
      result = result.filter(
        (p) => p.type === 'product' && p.stock !== undefined && p.stock <= (p.minStock || 0)
      );
    }

    return result.sort((a, b) => {
      let comparison;
      if (sortBy === 'price') {
        comparison = b.price - a.price;
      } else if (sortBy === 'type') {
        comparison = a.type.localeCompare(b.type);
      } else if (sortBy === 'category') {
        comparison = (a.category || '').localeCompare(b.category || '');
      } else if (sortBy === 'stock') {
        comparison = (a.stock || 0) - (b.stock || 0);
      } else {
        comparison = a.name.localeCompare(b.name);
      }

      return comparison;
    });
  }, [products, searchTerm, sortBy, showArchived, selectedCategory, showLowStockOnly]);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto relative pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-brand-900 dark:text-white tracking-tight font-display text-gradient">
            Catalogue
          </h2>
          <p className="text-brand-500 dark:text-brand-400 mt-1">
            Gérez vos produits et prestations de service.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
          {/* Archive Toggle */}
          <div className="bg-white dark:bg-brand-900 p-1.5 rounded-2xl shadow-sm border border-brand-200 dark:border-brand-800 flex gap-1">
            <button
              onClick={() => setShowArchived(false)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${showArchived ? 'bg-brand-900 dark:bg-white text-white dark:text-brand-900 shadow-lg' : 'text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-800'}`}
            >
              Actifs
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${showArchived ? 'bg-brand-900 dark:bg-white text-white dark:text-brand-900 shadow-lg' : 'text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-800'}`}
            >
              Archivés
            </button>
          </div>

          <div className="flex gap-2">
            <label
              className="btn-secondary px-4 py-2.5 cursor-pointer"
              title="Importer depuis un CSV"
            >
              <Upload size={18} />
              <span className="hidden sm:inline">Import</span>
              <input type="file" accept=".csv" className="hidden" onChange={importCSV} />
            </label>
            <button
              onClick={exportCSV}
              className="btn-secondary px-4 py-2.5"
              title="Exporter en CSV"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button onClick={openCreate} className="btn-primary px-6 py-2.5">
              <Plus size={18} />
              Nouveau
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Bento */}
      <div className="bento-grid">
        <div className="bento-item">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-brand-100 dark:bg-brand-800 rounded-2xl text-brand-600 dark:text-brand-300">
              <Package size={24} />
            </div>
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
              Total Catalogue
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-brand-900 dark:text-white font-display">
              {globalStats.total}
            </h3>
            <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">Éléments actifs</p>
          </div>
        </div>
        <div className="bento-item">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-accent-100 dark:bg-accent-900/30 rounded-2xl text-accent-600 dark:text-accent-400">
              <Briefcase size={24} />
            </div>
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
              Prestations
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-accent-600 dark:text-accent-400 font-display">
              {globalStats.servicesCount}
            </h3>
            <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">Services proposés</p>
          </div>
        </div>
        <div className="bento-item">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400">
              <AlertCircle size={24} />
            </div>
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
              Stock Bas
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-display">
              {globalStats.lowStockCount}
            </h3>
            <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">
              Articles à réapprovisionner
            </p>
          </div>
        </div>
        <div className="bento-item bg-brand-900 dark:bg-white text-white dark:text-brand-900">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/10 dark:bg-brand-100 rounded-2xl">
              <Zap size={24} className="text-white dark:text-brand-900" />
            </div>
            <span className="text-[10px] font-bold text-brand-300 dark:text-brand-500 uppercase tracking-widest">
              Action Rapide
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold font-display">Optimiser le stock</h3>
            <button className="mt-2 text-xs font-bold flex items-center gap-2 hover:underline">
              Générer une commande <ArrowRightCircle size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Side Panel Form */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-112.5 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 border-l border-brand-100 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-brand-100 flex justify-between items-center bg-brand-50/50">
            <h3 className="text-xl font-bold text-brand-900">
              {editingId ? 'Modifier l&apos;élément' : 'Nouvel élément'}
            </h3>
            <button
              onClick={() => setIsPanelOpen(false)}
              title="Fermer le panneau"
              className="p-2 hover:bg-brand-200 rounded-full text-brand-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="formData-name"
                  className="block text-sm font-semibold text-brand-700 mb-1.5"
                >
                  Nom de l&apos;élément <span className="text-red-500">*</span>
                </label>
                <input
                  id="formData-name"
                  type="text"
                  required
                  className={
                    'w-full p-3 bg-brand-50 border rounded-2xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 outline-none transition-all ' +
                    (validationErrors.name ? 'border-red-500' : 'border-brand-200')
                  }
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Création site web"
                />
                {validationErrors.name && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="formData-sku"
                    className="block text-sm font-semibold text-brand-700 mb-1.5"
                  >
                    Référence / SKU
                  </label>
                  <div className="relative">
                    <Hash
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400"
                      size={16}
                    />
                    <input
                      id="formData-sku"
                      type="text"
                      className="w-full pl-10 pr-3 py-3 bg-brand-50 border border-brand-200 rounded-2xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 outline-none transition-all"
                      value={formData.sku || ''}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="REF-001"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="formData-category"
                    className="block text-sm font-semibold text-brand-700 mb-1.5"
                  >
                    Catégorie
                  </label>
                  <input
                    id="formData-category"
                    type="text"
                    className="w-full p-3 bg-brand-50 border border-brand-200 rounded-2xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 outline-none transition-all"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Développement"
                    list="product-categories"
                  />
                  <datalist id="product-categories">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="formData-type"
                    className="block text-sm font-semibold text-brand-700 mb-1.5"
                  >
                    Type
                  </label>
                  <select
                    id="formData-type"
                    title="Sélectionner le type d'élément"
                    className="w-full p-3 border border-brand-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all appearance-none bg-white"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as 'service' | 'product' })
                    }
                  >
                    <option value="service">Prestation</option>
                    <option value="product">Marchandise</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="formData-unit"
                    className="block text-sm font-semibold text-brand-700 mb-1.5"
                  >
                    Unité
                  </label>
                  <div className="relative">
                    <Ruler
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400"
                      size={16}
                    />
                    <select
                      id="formData-unit"
                      title="Sélectionner l'unité"
                      className="w-full pl-10 pr-3 py-3 border border-brand-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all appearance-none bg-white"
                      value={formData.unit || 'unité'}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="unité">Unité</option>
                      <option value="heure">Heure</option>
                      <option value="jour">Jour</option>
                      <option value="km">Kilomètre</option>
                      <option value="forfait">Forfait</option>
                      <option value="mois">Mois</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="formData-price"
                  className="block text-sm font-semibold text-brand-700 mb-1.5"
                >
                  Prix HT (EUR)
                </label>
                <input
                  id="formData-price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  title="Prix HT (hors taxe) en euros"
                  className={
                    'w-full p-3 bg-brand-50 border rounded-2xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 outline-none transition-all ' +
                    (validationErrors.price ? 'border-red-500' : 'border-brand-200')
                  }
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number.parseFloat(e.target.value) })
                  }
                />
                {validationErrors.price && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.price}</p>
                )}
              </div>

              {formData.type === 'product' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="formData-stock"
                      className="block text-sm font-semibold text-brand-700 mb-1.5"
                    >
                      Stock actuel
                    </label>
                    <input
                      id="formData-stock"
                      type="number"
                      placeholder="0"
                      title="Quantité en stock actuel"
                      className={
                        'w-full p-3 bg-brand-50 border rounded-2xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 outline-none transition-all ' +
                        (validationErrors.stock ? 'border-red-500' : 'border-brand-200')
                      }
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: Number.parseInt(e.target.value) || 0 })
                      }
                    />
                    {validationErrors.stock && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.stock}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="formData-minStock"
                      className="block text-sm font-semibold text-brand-700 mb-1.5"
                    >
                      Seuil d&apos;alerte
                    </label>
                    <input
                      id="formData-minStock"
                      type="number"
                      placeholder="0"
                      title="Seuil minimum d'alerte pour le stock"
                      className={
                        'w-full p-3 bg-brand-50 border rounded-2xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 outline-none transition-all ' +
                        (validationErrors.minStock ? 'border-red-500' : 'border-brand-200')
                      }
                      value={formData.minStock}
                      onChange={(e) =>
                        setFormData({ ...formData, minStock: Number.parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="formData-description"
                  className="block text-sm font-semibold text-brand-700 mb-1.5"
                >
                  Description (pour devis/factures)
                </label>
                <textarea
                  id="formData-description"
                  rows={4}
                  className="w-full p-3 bg-brand-50 border border-brand-200 rounded-2xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 outline-none transition-all resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description détaillée qui apparaîtra sur les documents..."
                />
              </div>
            </div>
          </form>

          <div className="p-6 border-t border-brand-100 bg-brand-50/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsPanelOpen(false)}
              className="px-6 py-2.5 text-brand-600 hover:bg-white border border-transparent hover:border-brand-200 rounded-2xl font-medium transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-brand-900 text-white rounded-2xl hover:bg-brand-800 font-medium shadow-lg shadow-brand-200 transition-all hover:scale-[1.02]"
            >
              {editingId ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isPanelOpen && (
        <button
          aria-label="Fermer le panneau"
          onClick={() => setIsPanelOpen(false)}
          className="fixed inset-0 overlay-button z-30 transition-opacity cursor-pointer border-none p-0"
        />
      )}

      {/* List */}
      <div className="space-y-8">
        {/* Search & Sort Toolbar */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-400 dark:text-brand-500"
              size={20}
            />
            <input
              type="text"
              placeholder="Rechercher par nom, référence, description..."
              className="w-full pl-14 pr-6 py-4 border border-brand-100 dark:border-brand-800 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-900/5 bg-white dark:bg-brand-900 shadow-sm transition-all font-medium text-brand-900 dark:text-white placeholder:text-brand-300 dark:placeholder:text-brand-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-brand-900 px-6 py-2 border border-brand-100 dark:border-brand-800 rounded-3xl shadow-sm">
            <Filter size={18} className="text-brand-400 dark:text-brand-500" />
            <span className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-wider">
              Catégorie
            </span>
            <select
              title="Filtrer par catégorie"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-sm font-bold text-brand-900 dark:text-white outline-none cursor-pointer appearance-none pr-4"
            >
              <option value="">Toutes</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-brand-900 px-6 py-2 border border-brand-100 dark:border-brand-800 rounded-3xl shadow-sm">
            <SortAsc size={18} className="text-brand-400 dark:text-brand-500" />
            <span className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-wider">
              Trier par
            </span>
            <select
              title="Trier les produits"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption | 'stock')}
              className="bg-transparent text-sm font-bold text-brand-900 dark:text-white outline-none cursor-pointer appearance-none pr-4"
            >
              <option value="name">Nom (A-Z)</option>
              <option value="price">Prix (Décroissant)</option>
              <option value="type">Type</option>
              <option value="category">Catégorie</option>
              <option value="stock">Stock</option>
            </select>
          </div>

          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-8 py-3 rounded-3xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2 ${showLowStockOnly ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30 shadow-sm' : 'bg-white dark:bg-brand-900 text-brand-600 dark:text-brand-400 border-brand-100 dark:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-800 shadow-sm'}`}
          >
            <AlertCircle size={16} />
            Stock Bas
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {processedProducts.map((p) => (
            <div key={p.id} className="card-modern p-8 group relative flex flex-col">
              {/* Actions Top Right */}
              <div className="absolute top-6 right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-10">
                <button
                  onClick={() => openEdit(p)}
                  className="p-2.5 text-brand-400 dark:text-brand-500 hover:text-brand-900 dark:hover:text-white hover:bg-brand-50 dark:hover:bg-brand-800 rounded-xl transition-all"
                  title="Modifier"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={(e) => toggleArchive(p.id, e)}
                  className="p-2.5 text-brand-400 dark:text-brand-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all"
                  title={p.archived ? 'Restaurer' : 'Archiver'}
                >
                  {p.archived ? <RotateCcw size={16} /> : <Archive size={16} />}
                </button>
                <button
                  onClick={(e) => handleDelete(p.id, e)}
                  className="p-2.5 text-brand-400 dark:text-brand-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-start justify-between mb-6">
                <div
                  className={`
                            w-16 h-16 rounded-3xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110
                            ${p.type === 'service' ? 'bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 border-brand-100 dark:border-brand-700' : 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 border-accent-100 dark:border-accent-900/30'}
                        `}
                >
                  {p.type === 'service' ? <Briefcase size={28} /> : <Package size={28} />}
                </div>
                {p.sku && (
                  <span className="text-[10px] font-mono font-bold text-brand-400 dark:text-brand-500 bg-brand-50 dark:bg-brand-800 px-2.5 py-1 rounded-lg border border-brand-100 dark:border-brand-700">
                    {p.sku}
                  </span>
                )}
              </div>

              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border
                                ${p.type === 'service' ? 'bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 border-brand-100 dark:border-brand-700' : 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 border-accent-100 dark:border-accent-900/30'}
                            `}
                  >
                    {p.type === 'service' ? 'Prestation' : 'Marchandise'}
                  </span>
                  {p.category && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-800 text-brand-500 dark:text-brand-400 border border-brand-100 dark:border-brand-700 flex items-center gap-1.5">
                      <Tag size={10} /> {p.category}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-brand-900 dark:text-white text-xl leading-tight mb-3 pr-10 font-display">
                  {p.name}
                </h4>
                <p className="text-sm text-brand-500 dark:text-brand-400 line-clamp-2 h-10 leading-relaxed">
                  {p.description || 'Aucune description'}
                </p>
              </div>

              <div className="mt-auto pt-6 border-t border-brand-50 dark:border-brand-800 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-black text-brand-400 dark:text-brand-500 tracking-widest mb-1">
                    Prix HT
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-brand-900 dark:text-white font-display">
                      {p.price.toFixed(2)} €
                    </span>
                    <span className="text-[10px] text-brand-400 dark:text-brand-500 font-bold uppercase tracking-widest">
                      / {p.unit || 'unité'}
                    </span>
                  </div>
                </div>

                {p.type === 'product' && p.stock !== undefined && (
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-black text-brand-400 dark:text-brand-500 tracking-widest block mb-1">
                      Stock
                    </span>
                    <div className="flex items-center gap-2 bg-brand-50 dark:bg-brand-800 p-1.5 rounded-xl border border-brand-100 dark:border-brand-700">
                      <button
                        onClick={(e) => updateStock(p.id, -1, e)}
                        title="Diminuer le stock"
                        className="p-1 text-brand-400 dark:text-brand-500 hover:text-brand-900 dark:hover:text-white hover:bg-white dark:hover:bg-brand-700 rounded-lg transition-all shadow-sm"
                      >
                        <Minus size={12} />
                      </button>
                      <div
                        className={`flex items-center gap-1.5 font-black px-2 ${p.stock <= (p.minStock || 0) ? 'text-red-500 dark:text-red-400' : 'text-brand-900 dark:text-white'}`}
                      >
                        {p.stock <= (p.minStock || 0) && <AlertCircle size={12} />}
                        <span className="text-sm">{p.stock}</span>
                      </div>
                      <button
                        onClick={(e) => updateStock(p.id, 1, e)}
                        title="Augmenter le stock"
                        className="p-1 text-brand-400 dark:text-brand-500 hover:text-brand-900 dark:hover:text-white hover:bg-white dark:hover:bg-brand-700 rounded-lg transition-all shadow-sm"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {processedProducts.length === 0 && (
            <div className="col-span-full py-32 text-center">
              <div className="inline-block p-10 rounded-[2.5rem] bg-brand-50 dark:bg-brand-800/50 mb-8 animate-pulse">
                <Zap size={48} className="text-brand-200 dark:text-brand-700" />
              </div>
              <h3 className="text-brand-900 dark:text-white font-bold text-xl font-display mb-2">
                Catalogue vide
              </h3>
              <p className="text-brand-400 dark:text-brand-500 text-sm max-w-xs mx-auto">
                Essayez une autre recherche ou changez de filtre pour trouver ce que vous cherchez.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductManager;

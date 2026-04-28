import {
  CircleAlert as AlertCircle,
  Download,
  File as Filter,
  Package,
  Plus,
  RotateCcw,
  Search,
  ArrowUpWideNarrow as SortAsc,
  Upload,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { validateAmount } from "../lib/zod-schemas";
import type { Product } from "../types";
import { ProductStats } from "./products/ProductStats";
import { ProductList } from "./products/ProductList";
import { ProductForm } from "./products/ProductForm";

interface ProductManagerProps {
  products: Product[];
  onSave?: (product: Product) => void;
  onDelete?: (id: string) => void;
}

type SortOption = "name" | "price" | "type" | "category" | "stock";

const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  onSave,
  onDelete,
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showArchived, setShowArchived] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // État pour les erreurs de validation
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    type: "service",
    category: "",
    sku: "",
    unit: "unité",
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
      name: "",
      description: "",
      price: 0,
      type: "service",
      category: "",
      sku: "",
      unit: "unité",
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
      errors.name = "Nom obligatoire";
    }

    const priceValue = Number(formData.price) || 0;
    if (priceValue < 0) {
      errors.price = "Prix doit être positif ou zéro";
    } else {
      const amountResult = validateAmount(formData.price ?? 0);
      if (!amountResult.valid) {
        errors.price = amountResult.error ?? "Prix invalide";
      }
    }

    if (formData.type === "product") {
      const stockValue = Number(formData.stock) || 0;
      if (stockValue < 0) {
        errors.stock = "Stock doit être positif ou zéro";
      }
      const minStockValue = Number(formData.minStock) || 0;
      if (minStockValue < 0) {
        errors.minStock = "Seuil d'alerte doit être positif ou zéro";
      }
    }

    return errors;
  };

  const createProductFromForm = (): Product => {
    const isService = formData.type === "service";
    return {
      id: Date.now().toString(),
      name: formData.name ?? "",
      description: formData.description ?? "",
      price: Number(formData.price) || 0,
      type: (formData.type as "service" | "product") || "product",
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
    if (confirm("Supprimer définitivement cet élément du catalogue ?")) {
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
      const updated = {
        ...product,
        stock: Math.max(0, (product.stock ?? 0) + delta),
      };
      if (onSave) {
        onSave(updated);
      }
    }
  };

  const exportCSV = () => {
    const headers = [
      "Référence",
      "Nom",
      "Type",
      "Catégorie",
      "Prix",
      "Unité",
      "Stock",
      "Seuil Alerte",
      "Description",
      "Statut",
    ];
    const rows = products.map((p) =>
      [
        `"${p.sku ?? ""}"`,
        `"${p.name}"`,
        `"${p.type === "service" ? "Prestation" : "Marchandise"}"`,
        `"${p.category ?? ""}"`,
        p.price.toFixed(2),
        `"${p.unit ?? ""}"`,
        p.stock ?? "",
        p.minStock ?? "",
        `"${p.description.replaceAll('"', '""')}"`,
        p.archived ? '"Archivé"' : '"Actif"',
      ].join(","),
    );

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `catalogue_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const parseCSVLine = (line: string): string[] =>
    line
      .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      .map((p) => p.trim().replaceAll('"', ""));

  const createProductFromCSVLine = (
    parts: string[],
    lineIndex: number,
  ): Product => ({
    id: (Date.now() + lineIndex).toString(),
    sku: parts[0] || "",
    name: parts[1],
    type: parts[2]?.toLowerCase().includes("prest") ? "service" : "product",
    category: parts[3] || "",
    price: Number.parseFloat(parts[4]) || 0,
    unit: parts[5] || "unité",
    stock: parts[6] ? Number.parseInt(parts[6]) : undefined,
    minStock: parts[7] ? Number.parseInt(parts[7]) : undefined,
    description: parts[8] || "",
    archived: parts[9]?.toLowerCase().includes("arch") ?? false,
    createdAt: new Date().toISOString(),
  });

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    const lines = text.split("\n");
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
    const services = activeProducts.filter((p) => p.type === "service");
    const goods = activeProducts.filter((p) => p.type === "product");
    const lowStock = goods.filter((p) => (p.stock ?? 0) <= (p.minStock ?? 0));

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
        ((p.name || "").toLowerCase().includes(term) ||
          (p.description || "").toLowerCase().includes(term) ||
          (p.sku ?? "").toLowerCase().includes(term)) &&
        (showArchived ? p.archived === true : !p.archived),
    );

    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (showLowStockOnly) {
      result = result.filter(
        (p) =>
          p.type === "product" &&
          p.stock !== undefined &&
          p.stock <= (p.minStock ?? 0),
      );
    }

    return result.sort((a, b) => {
      let comparison;
      if (sortBy === "price") {
        comparison = b.price - a.price;
      } else if (sortBy === "type") {
        comparison = a.type.localeCompare(b.type);
      } else if (sortBy === "category") {
        comparison = (a.category ?? "").localeCompare(b.category ?? "");
      } else if (sortBy === "stock") {
        comparison = (a.stock ?? 0) - (b.stock ?? 0);
      } else {
        comparison = a.name.localeCompare(b.name);
      }

      return comparison;
    });
  }, [
    products,
    searchTerm,
    sortBy,
    showArchived,
    selectedCategory,
    showLowStockOnly,
  ]);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto relative pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-900 dark:text-white tracking-tight font-display text-gradient">
            Catalogue
          </h1>
          <p className="text-brand-500 dark:text-brand-400 mt-1">
            Gérez vos produits et prestations de service.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
          {/* Archive Toggle */}
          <div className="bg-white dark:bg-brand-900 p-1.5 rounded-2xl shadow-sm border border-brand-200 dark:border-brand-800 flex gap-1">
            <button
              onClick={() => setShowArchived(false)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${showArchived ? "bg-brand-900 dark:bg-white text-white dark:text-brand-900 shadow-lg" : "text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-800"}`}
            >
              Actifs
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${showArchived ? "bg-brand-900 dark:bg-white text-white dark:text-brand-900 shadow-lg" : "text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-800"}`}
            >
              Archivés
            </button>
          </div>

          <div className="flex gap-2">
            <label
              className="btn-secondary px-4 py-2.5 cursor-pointer"
              aria-label="Importer depuis un CSV"
              title="Importer depuis un CSV"
            >
              <Upload size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Import</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  void importCSV(e);
                }}
              />
            </label>
            <button
              onClick={exportCSV}
              aria-label="Exporter en CSV"
              className="btn-secondary px-4 py-2.5"
            >
              <Download size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button onClick={openCreate} className="btn-primary px-6 py-2.5">
              <Plus size={18} />
              Nouveau
            </button>
          </div>
        </div>
      </div>

      <ProductStats
        total={globalStats.total}
        servicesCount={globalStats.servicesCount}
        lowStockCount={globalStats.lowStockCount}
      />

      {/* Side Panel Form */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-112.5 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 border-l border-brand-100 ${isPanelOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-brand-100 flex justify-between items-center bg-brand-50/50">
            <h3 className="text-xl font-bold text-brand-900">
              {editingId ? "Modifier l&apos;élément" : "Nouvel élément"}
            </h3>
            <button
              onClick={() => setIsPanelOpen(false)}
              aria-label="Fermer le panneau"
              className="p-2 hover:bg-brand-200 rounded-full text-brand-500 transition-colors"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex-1 overflow-y-auto"
          >
            <ProductForm
              formData={formData}
              validationErrors={validationErrors}
              onFormChange={(data) => setFormData({ ...formData, ...data })}
            />
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
              {editingId ? "Mettre à jour" : "Enregistrer"}
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
              aria-label="Filtrer par catégorie"
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
              aria-label="Trier les produits"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as SortOption | "stock")
              }
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
            className={`px-8 py-3 rounded-3xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2 ${showLowStockOnly ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30 shadow-sm" : "bg-white dark:bg-brand-900 text-brand-600 dark:text-brand-400 border-brand-100 dark:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-800 shadow-sm"}`}
          >
            <AlertCircle size={16} />
            Stock Bas
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <ProductList
            products={processedProducts}
            onEdit={openEdit}
            onDelete={handleDelete}
            onToggleArchive={toggleArchive}
            onUpdateStock={updateStock}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductManager;

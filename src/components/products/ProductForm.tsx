import React from "react";
import {
  Package,
  Briefcase,
  Tag,
  Hash,
  Ruler,
  Zap,
  AlertCircle,
} from "lucide-react";
import type { Product } from "../../types";

interface ProductFormProps {
  formData: Partial<Product>;
  validationErrors: Record<string, string>;
  onFormChange: (data: Partial<Product>) => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  formData,
  validationErrors,
  onFormChange,
}) => {
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    onFormChange({ [name]: value });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8">
      {/* Type Selection */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onFormChange({ type: "service" })}
          className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all duration-300 ${
            formData.type === "service"
              ? "border-brand-600 bg-brand-50 text-brand-900 shadow-inner"
              : "border-brand-100 text-brand-400 hover:border-brand-300"
          }`}
        >
          <Briefcase size={32} />
          <span className="font-bold">Service</span>
        </button>
        <button
          onClick={() => onFormChange({ type: "product" })}
          className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all duration-300 ${
            formData.type === "product"
              ? "border-brand-600 bg-brand-50 text-brand-900 shadow-inner"
              : "border-brand-100 text-brand-400 hover:border-brand-300"
          }`}
        >
          <Package size={32} />
          <span className="font-bold">Produit</span>
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label
            htmlFor="product-name"
            className="block text-sm font-bold text-brand-900 mb-2 flex items-center gap-2"
          >
            Nom de l&apos;élément <span className="text-red-500">*</span>
          </label>
          <input
            id="product-name"
            type="text"
            name="name"
            value={formData.name || ""}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-xl border ${
              validationErrors.name
                ? "border-red-500 bg-red-50"
                : "border-brand-100"
            } focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none`}
            placeholder="Nom"
          />
          {validationErrors.name && (
            <p className="mt-1 text-xs font-bold text-red-500 flex items-center gap-1">
              <AlertCircle size={12} /> {validationErrors.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="product-description"
            className="block text-sm font-bold text-brand-900 mb-2"
          >
            Description
          </label>
          <textarea
            id="product-description"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-brand-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none resize-none"
            placeholder="Description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="product-price"
              className="block text-sm font-bold text-brand-900 mb-2 flex items-center gap-2"
            >
              <Tag size={16} className="text-brand-400" /> Prix HT (€)
            </label>
            <input
              id="product-price"
              type="number"
              name="price"
              value={formData.price || ""}
              onChange={handleChange}
              step="0.01"
              className={`w-full px-4 py-3 rounded-xl border ${
                validationErrors.price
                  ? "border-red-500 bg-red-50"
                  : "border-brand-100"
              } focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none`}
              placeholder="Prix"
            />
            {validationErrors.price && (
              <p className="mt-1 text-xs font-bold text-red-500">
                {validationErrors.price}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="product-unit"
              className="block text-sm font-bold text-brand-900 mb-2 flex items-center gap-2"
            >
              <Ruler size={16} className="text-brand-400" /> Unité
            </label>
            <input
              id="product-unit"
              type="text"
              name="unit"
              value={formData.unit || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-brand-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none"
              placeholder="Unité"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="product-sku"
              className="block text-sm font-bold text-brand-900 mb-2 flex items-center gap-2"
            >
              <Hash size={16} className="text-brand-400" /> Référence (SKU)
            </label>
            <input
              id="product-sku"
              type="text"
              name="sku"
              value={formData.sku || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-brand-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none"
              placeholder="SKU"
            />
          </div>
          <div>
            <label
              htmlFor="product-category"
              className="block text-sm font-bold text-brand-900 mb-2 flex items-center gap-2"
            >
              <Tag size={16} className="text-brand-400" /> Catégorie
            </label>
            <input
              id="product-category"
              type="text"
              name="category"
              list="categories"
              value={formData.category || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-brand-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none"
              placeholder="Catégorie"
            />
            <datalist id="categories">
              {/* Options will be handled by Parent */}
            </datalist>
          </div>
        </div>

        {formData.type === "product" && (
          <div className="bg-brand-50 p-6 rounded-3xl space-y-4 border border-brand-100">
            <h4 className="font-bold text-brand-900 flex items-center gap-2">
              <Zap size={18} className="text-brand-600" /> Gestion des stocks
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-500 mb-1 uppercase tracking-wider">
                  Quantité Actuelle
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    validationErrors.stock
                      ? "border-red-500 bg-red-50"
                      : "border-white"
                  } focus:ring-2 focus:ring-brand-500 outline-none`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-500 mb-1 uppercase tracking-wider">
                  Seuil d&apos;alerte
                </label>
                <input
                  type="number"
                  name="minStock"
                  value={formData.minStock}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    validationErrors.minStock
                      ? "border-red-500 bg-red-50"
                      : "border-white"
                  } focus:ring-2 focus:ring-brand-500 outline-none`}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from "react";
import {
  Package,
  Briefcase,
  Trash2,
  Archive,
  RotateCcw,
  Minus,
  Plus,
  Pencil as Edit2,
  CircleAlert as AlertCircle,
} from "lucide-react";
import type { Product } from "../../types";

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onToggleArchive: (id: string, e: React.MouseEvent) => void;
  onUpdateStock: (id: string, delta: number, e: React.MouseEvent) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  onEdit,
  onDelete,
  onToggleArchive,
  onUpdateStock,
}) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-brand-100 dark:border-slate-800">
        <div className="p-4 bg-brand-50 dark:bg-brand-900/30 rounded-full mb-4">
          <Package size={40} className="text-brand-300 dark:text-brand-700" />
        </div>
        <h3 className="text-xl font-bold text-brand-900 dark:text-white mb-2">
          Aucun produit trouvé
        </h3>
        <p className="text-brand-500 dark:text-brand-400 max-w-xs text-center">
          Ajustez vos filtres ou créez un nouvel élément pour commencer.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          onClick={() => onEdit(product)}
          className="group bg-white dark:bg-slate-800 p-5 rounded-2xl border border-brand-100 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-500 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-brand-500/5 relative"
        >
          <div className="flex justify-between items-start mb-4">
            <div
              className={`p-2.5 rounded-xl ${
                product.type === "service"
                  ? "bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-400"
                  : "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
              }`}
            >
              {product.type === "service" ? (
                <Briefcase size={20} />
              ) : (
                <Package size={20} />
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => onEdit(product)}
                className="p-2 text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-800 rounded-lg transition-colors"
                aria-label="Modifier"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={(e) => onToggleArchive(product.id, e)}
                className="p-2 text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-800 rounded-lg transition-colors"
                title={product.archived ? "Restaurer" : "Archiver"}
                aria-label={product.archived ? "Restaurer" : "Archiver"}
              >
                {product.archived ? (
                  <RotateCcw size={16} />
                ) : (
                  <Archive size={16} />
                )}
              </button>
              <button
                onClick={(e) => onDelete(product.id, e)}
                className="p-2 text-brand-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                aria-label="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              {product.type === "service" ? (
                <span className="text-[10px] font-bold text-accent-600 dark:text-accent-400 uppercase tracking-widest px-1.5 py-0.5 bg-accent-50 dark:bg-accent-900/20 rounded-md">
                  Service
                </span>
              ) : (
                <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest px-1.5 py-0.5 bg-brand-50 dark:bg-brand-900/20 rounded-md">
                  Produit
                </span>
              )}
              {product.sku && (
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest px-1.5 py-0.5 bg-brand-50 dark:bg-brand-800 rounded-md">
                  {product.sku}
                </span>
              )}
              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                {product.category || "Sans catégorie"}
              </span>
            </div>
            <h4 className="font-bold text-lg text-brand-900 dark:text-white group-hover:text-brand-600 transition-colors line-clamp-1">
              {product.name}
            </h4>
            <p className="text-sm text-brand-500 dark:text-brand-400 line-clamp-2 mt-1 min-h-[2.5rem]">
              {product.description || "Aucune description"}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-brand-50 dark:border-slate-700 flex justify-between items-end">
            <div>
              <div className="text-xs text-brand-400 font-medium mb-1 uppercase tracking-tighter">
                Prix unitaire
              </div>
              <div className="text-xl font-black text-brand-900 dark:text-white">
                {product.price.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })}
                <span className="text-xs font-normal text-brand-400 ml-1">
                  /{product.unit || "unité"}
                </span>
              </div>
            </div>

            {product.type === "product" && (
              <div className="flex flex-col items-end">
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg mb-2 ${
                    (product.stock ?? 0) <= (product.minStock ?? 0)
                      ? "bg-red-50 text-red-600 animate-pulse"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  {(product.stock ?? 0) <= (product.minStock ?? 0) && (
                    <AlertCircle size={12} />
                  )}
                  <span className="text-xs font-bold">
                    Stock: {product.stock}
                  </span>
                </div>
                <div className="flex bg-brand-50 dark:bg-brand-900/50 rounded-xl p-1 gap-1">
                  <button
                    onClick={(e) => onUpdateStock(product.id, -1, e)}
                    className="p-1.5 hover:bg-white dark:hover:bg-brand-800 rounded-lg text-brand-600 transition-all active:scale-95 shadow-sm"
                  >
                    <Minus size={14} />
                  </button>
                  <button
                    onClick={(e) => onUpdateStock(product.id, 1, e)}
                    className="p-1.5 hover:bg-white dark:hover:bg-brand-800 rounded-lg text-brand-600 transition-all active:scale-95 shadow-sm"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            {product.type === "service" && (
              <div className="p-2.5 bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 rounded-2xl">
                <Edit2 size={16} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

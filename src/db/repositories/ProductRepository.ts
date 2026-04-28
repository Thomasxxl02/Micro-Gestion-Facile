/**
 * Repository pour les produits / services du catalogue
 *
 * Centralise tous les accès Dexie pour l'entité Product.
 * Ref schéma : products '&id, name, category, archived'
 */

import type { Product } from "../../types";
import { db } from "../invoiceDB";

export const productRepository = {
  /** Tous les produits (actifs + archivés) */
  findAll: (): Promise<Product[]> => db.products.toArray(),

  /** Produits non archivés uniquement */
  findAllActive: (): Promise<Product[]> =>
    db.products.filter((p) => !p.archived).toArray(),

  /** Produit par identifiant */
  findById: (id: string): Promise<Product | undefined> => db.products.get(id),

  /** Produits par catégorie (index category) */
  findByCategory: (category: string): Promise<Product[]> =>
    db.products.where("category").equals(category).toArray(),

  /** Produits dont le stock est inférieur au stock minimum (alerte de réapprovisionnement) */
  findBelowMinStock: (): Promise<Product[]> =>
    db.products
      .filter(
        (p) =>
          p.stock !== undefined &&
          p.minStock !== undefined &&
          p.stock < p.minStock,
      )
      .toArray(),

  /** Persiste (insert ou update) un produit */
  save: (product: Product): Promise<string> => db.products.put(product),

  /** Persiste plusieurs produits en une seule transaction */
  saveBulk: (products: Product[]): Promise<string> =>
    db.products.bulkPut(products),

  /** Supprime un produit par identifiant */
  delete: (id: string): Promise<void> => db.products.delete(id),

  /** Nombre total de produits */
  count: (): Promise<number> => db.products.count(),
};

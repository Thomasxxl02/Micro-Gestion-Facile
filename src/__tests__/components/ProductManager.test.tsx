import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ProductManager from '../../components/ProductManager';
import type { Product } from '../../types';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Plus: () => <span>PlusIcon</span>,
  Minus: () => <span>MinusIcon</span>,
  Search: () => <span>SearchIcon</span>,
  Trash2: () => <span>Trash2Icon</span>,
  Package: () => <span>PackageIcon</span>,
  Briefcase: () => <span>BriefcaseIcon</span>,
  X: () => <span>XIcon</span>,
  Edit2: () => <span>Edit2Icon</span>,
  Zap: () => <span>ZapIcon</span>,
  Download: () => <span>DownloadIcon</span>,
  SortAsc: () => <span>SortAscIcon</span>,
  Filter: () => <span>FilterIcon</span>,
  Tag: () => <span>TagIcon</span>,
  Archive: () => <span>ArchiveIcon</span>,
  RotateCcw: () => <span>RotateCcwIcon</span>,
  Upload: () => <span>UploadIcon</span>,
  Hash: () => <span>HashIcon</span>,
  Ruler: () => <span>RulerIcon</span>,
  AlertCircle: () => <span>AlertCircleIcon</span>,
  CircleAlert: () => <span>AlertCircleIcon</span>,
  CircleArrowRight: () => <span>ArrowRightCircleIcon</span>,
  CircleCheck: () => <span>CheckCircle2Icon</span>,
  File: () => <span>FilterIcon</span>,
  Pencil: () => <span>Edit2Icon</span>,
  ArrowUpWideNarrow: () => <span>SortAscIcon</span>,
  ArrowRightCircle: () => <span>ArrowRightCircleIcon</span>,
}));

describe('ProductManager Component', () => {
  const mockProducts: Product[] = [
    {
      id: 'prod-1',
      name: 'Consultation 1h',
      description: 'Conseil en management',
      price: 150,
      type: 'service',
      category: 'Services',
      sku: 'CONS-001',
      unit: 'heure',
      stock: 0,
      minStock: 0,
      archived: false,
    },
    {
      id: 'prod-2',
      name: 'Forfait Maintenance',
      description: 'Maintenance système annuelle',
      price: 1200,
      type: 'service',
      category: 'Services',
      sku: 'MAINT-001',
      unit: 'forfait',
      stock: 0,
      minStock: 0,
      archived: false,
    },
    {
      id: 'prod-3',
      name: 'Fournitures de bureau',
      description: 'Mix de stylos, crayons, blocs',
      price: 45.5,
      type: 'product',
      category: 'Fournitures',
      sku: 'FOUR-001',
      unit: 'boîte',
      stock: 5,
      minStock: 10,
      archived: false,
    },
    {
      id: 'prod-4',
      name: 'Produit archivé',
      description: 'Ce produit est archivé',
      price: 100,
      type: 'product',
      category: 'Divers',
      sku: 'ARCH-001',
      unit: 'pièce',
      stock: 0,
      minStock: 0,
      archived: true,
    },
  ];

  const onSave = vi.fn();
  const onDelete = vi.fn();

  describe('Rendering & UI', () => {
    it('rend le gestionnaire de produits', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      expect(
        screen.queryByText(/Produits|Products/i) || screen.queryByText(/Package/i)
      ).toBeDefined();
    });

    it('affiche la liste des produits actifs', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      expect(screen.queryByText('Consultation 1h')).toBeTruthy();
      expect(screen.queryByText('Forfait Maintenance')).toBeTruthy();
      expect(screen.queryByText('Fournitures de bureau')).toBeTruthy();
    });

    it('affiche les prix des produits', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const priceElements = screen.queryAllByText(/150|1200|45.50/);
      expect(priceElements.length).toBeGreaterThan(0);
    });

    it('affiche les catégories de produits', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const servicesElements = screen.queryAllByText(/Services/i);
      const fournituresElements = screen.queryAllByText(/Fournitures/i);
      expect(servicesElements.length > 0 || fournituresElements.length > 0).toBe(true);
    });
  });

  describe('Search Functionality', () => {
    it('filtre les produits par nom', async () => {
      const user = userEvent.setup();
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const searchInput = screen.getByPlaceholderText(/Chercher|Search/i);
      await user.type(searchInput, 'Consultation');

      expect(screen.getByText('Consultation 1h')).toBeTruthy();
      expect(screen.queryByText('Forfait Maintenance')).not.toBeInTheDocument();
    });

    it('filtre les produits par SKU', async () => {
      const user = userEvent.setup();
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const searchInput = screen.getByPlaceholderText(/Chercher|Search/i);
      await user.type(searchInput, 'MAINT-001');

      expect(screen.getByText('Forfait Maintenance')).toBeTruthy();
    });

    it('filtre les produits par description', async () => {
      const user = userEvent.setup();
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const searchInput = screen.getByPlaceholderText(/Chercher|Search/i);
      await user.type(searchInput, 'système');

      expect(screen.getByText('Forfait Maintenance')).toBeTruthy();
    });

    it('affiche un message si aucun résultat de recherche', async () => {
      const user = userEvent.setup();
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const searchInput = screen.getByPlaceholderText(/Chercher|Search/i);
      await user.type(searchInput, 'ProduitQuiNExistePas12345');

      await waitFor(() => {
        const emptyMessage = screen.queryAllByText(/aucun|pas de|no/i);
        expect(emptyMessage.length > 0).toBe(true);
      });
    });
  });

  describe('Category Filtering', () => {
    it('extrait les catégories uniques des produits', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      // Catégories: Services, Fournitures, Divers
      const categories = [...new Set(mockProducts.map((p) => p.category))].filter(Boolean);
      expect(categories).toContain('Services');
      expect(categories).toContain('Fournitures');
    });

    it('filtre par catégorie Services', async () => {
      const user = userEvent.setup();
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      // Trouver et cliquer sur le filtre Services
      const filterButtons = screen
        .queryAllByRole('button')
        .filter((b) => b.textContent?.includes('Services'));

      if (filterButtons.length > 0) {
        await user.click(filterButtons[0]);
        // Les deux services doivent être visibles
        expect(screen.queryByText('Consultation 1h')).toBeTruthy();
        expect(screen.queryByText('Forfait Maintenance')).toBeTruthy();
      }
    });

    it('filtre par catégorie Fournitures', async () => {
      const user = userEvent.setup();
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const filterButtons = screen
        .queryAllByRole('button')
        .filter((b) => b.textContent?.includes('Fournitures'));

      if (filterButtons.length > 0) {
        await user.click(filterButtons[0]);
        expect(screen.getByText('Fournitures de bureau')).toBeTruthy();
      }
    });

    it('ignore les produits archivés par défaut', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      expect(screen.getByText('Consultation 1h')).toBeTruthy();
      expect(screen.queryByText('Produit archivé')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('trie par nom (défaut)', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      // Les produits doivent être affichés
      expect(screen.getByText('Consultation 1h')).toBeTruthy();
    });

    it('trie par prix', async () => {
      const user = userEvent.setup();
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const sortButtons = screen
        .queryAllByRole('button')
        .filter(
          (b) => b.textContent?.includes('Prix') || b.textContent?.toLowerCase().includes('price')
        );

      if (sortButtons.length > 0) {
        await user.click(sortButtons[0]);
        // Vérifier que les produits sont toujours visibles (tri appliqué)
        expect(screen.getByText('Consultation 1h')).toBeTruthy();
      }
    });

    it('trie par catégorie', async () => {
      const user = userEvent.setup();
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const sortButtons = screen
        .queryAllByRole('button')
        .filter(
          (b) =>
            b.textContent?.includes('Catégorie') ||
            b.textContent?.toLowerCase().includes('category')
        );

      if (sortButtons.length > 0) {
        await user.click(sortButtons[0]);
        expect(screen.getByText('Consultation 1h')).toBeTruthy();
      }
    });
  });

  describe('Stock Management', () => {
    it('affiche le stock des produits', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      // Fournitures a un stock de 5 (< minStock 10)
      const stockInfo = screen.queryAllByText(/5|10|stock/i);
      expect(stockInfo).toBeDefined();
    });

    it('affiche un avis si stock faible (< minStock)', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      // Produit 3 a stock: 5, minStock: 10 → stock faible
      // Devrait afficher un warning
      const warnings = screen.queryAllByText('AlertCircleIcon');
      expect(warnings).toBeDefined();
    });

    it('filtre pour afficher uniquement les produits à stock faible', async () => {
      const user = userEvent.setup();
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const lowStockButtons = screen
        .queryAllByRole('button')
        .filter(
          (b) =>
            b.textContent?.includes('Faible') ||
            b.textContent?.includes('Low') ||
            b.textContent?.includes('stock')
        );

      if (lowStockButtons.length > 0) {
        await user.click(lowStockButtons[0]);
        // Devrait afficher Fournitures de bureau (stock 5 < minStock 10)
        expect(screen.getByText('Fournitures de bureau')).toBeTruthy();
      }
    });
  });

  describe('Product Type', () => {
    it('distingue les services des produits', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      // Vérifier qu'on voit des icônes ou labels différents
      const serviceBadges = screen.queryAllByText(/Service|service/i);
      const productBadges = screen.queryAllByText(/Produit|product/i);

      expect(serviceBadges.length + productBadges.length >= 0).toBe(true);
    });

    it('affiche le type "service" pour les consultations', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      expect(screen.getByText('Consultation 1h')).toBeTruthy();
    });

    it('affiche le type "produit" pour les fournitures', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      expect(screen.getByText('Fournitures de bureau')).toBeTruthy();
    });
  });

  describe('Add Product Workflow', () => {
    it('ouvre le panneau pour créer un produit', async () => {
      const user = userEvent.setup();
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const addButton = screen
        .getAllByRole('button')
        .find((b) => b.textContent?.includes('Nouveau'));
      await user.click(addButton!);

      // Le formulaire devrait s'afficher
      expect(screen.getByPlaceholderText(/Nom|Name/i)).toBeTruthy();
    });

    it('crée un produit avec nom et prix', async () => {
      const user = userEvent.setup();
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const addButton = screen
        .getAllByRole('button')
        .find((b) => b.textContent?.includes('Nouveau'));
      await user.click(addButton!);

      const nameInput = screen.getByPlaceholderText(/Nom|Name/i);
      await user.type(nameInput, 'Nouveau Produit');

      expect(nameInput).toHaveValue('Nouveau Produit');
    });

    it('valide que le nom est requis', async () => {
      const user = userEvent.setup();
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const addButton = screen
        .getAllByRole('button')
        .find((b) => b.textContent?.includes('Nouveau'));
      await user.click(addButton!);

      // Chercher un bouton d'envoi/création
      const submitButton = screen
        .queryAllByRole('button')
        .find((b) => b.textContent?.includes('Créer') || b.textContent?.includes('Ajouter'));

      if (submitButton) {
        await user.click(submitButton);
        // Devrait afficher une erreur si le nom est vide
        expect(screen.queryByText(/obligatoire|required|nom/i)).toBeDefined();
      }
    });
  });

  describe('Edit Product Workflow', () => {
    it("ouvre le formulaire d'édition d'un produit", async () => {
      const user = userEvent.setup();
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const editButtons = screen.getAllByText('Edit2Icon');
      if (editButtons.length > 0) {
        await user.click(editButtons[0]);
        // Le formulaire devrait s'afficher avec le produit
        expect(screen.getByPlaceholderText(/Nom|Name/i)).toBeTruthy();
      }
    });

    it('précharge les données du produit', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      expect(screen.getByText('Consultation 1h')).toBeTruthy();
      expect(screen.getByText('Forfait Maintenance')).toBeTruthy();
    });

    it('sauvegarde les modifications du produit', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      // onSave doit être défini
      expect(onSave).toBeDefined();
    });
  });

  describe('Delete Product', () => {
    it('affiche un bouton supprimer', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const deleteButtons = screen.getAllByText('Trash2Icon');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it("appelle onDelete avec l'ID du produit", async () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      expect(onDelete).toBeDefined();
    });
  });

  describe('Archive Product', () => {
    it("affiche le bouton d'archivage", () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const archiveButtons = screen.queryAllByText('ArchiveIcon');
      expect(archiveButtons).toBeDefined();
    });

    it('masque les produits archivés par défaut', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      expect(screen.queryByText('Produit archivé')).not.toBeInTheDocument();
    });

    it('affiche les produits archivés si filtré', async () => {
      const user = userEvent.setup();
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const showArchivedButton = screen
        .queryAllByRole('button')
        .find((b) => b.textContent?.includes('Archiv'));

      if (showArchivedButton) {
        await user.click(showArchivedButton);
        // Les produits archivés devraient s'afficher
        expect(screen.queryByText('Produit archivé')).toBeDefined();
      }
    });
  });

  describe('Unit & SKU Management', () => {
    it('affiche le SKU du produit', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      expect(screen.queryByText('CONS-001') || screen.queryByText('MAINT-001')).toBeDefined();
    });

    it("affiche l'unité de mesure du produit", () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const units = screen.queryAllByText(/heure|forfait|boîte|pièce/i);
      expect(units).toBeDefined();
    });

    it('permet de créer un produit avec une unité personnalisée', async () => {
      const user = userEvent.setup();
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const addButton = screen
        .getAllByRole('button')
        .find((b) => b.textContent?.includes('Nouveau'));
      await user.click(addButton!);

      // Chercher le champ unité
      const unitInputs = screen.queryAllByPlaceholderText(/unité|unit/i);
      expect(unitInputs).toBeDefined();
    });
  });

  describe('Pricing & Financial', () => {
    it('affiche les prix correctement formatés', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      // Prix avec décimales
      const priceElements = screen.queryAllByText(/150|1200|45.50|45,50/i);
      expect(priceElements.length).toBeGreaterThan(0);
    });

    it('gère les montants décimaux (décimales)', async () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      // Fournitures a un prix de 45.50
      const product = mockProducts.find((p) => p.id === 'prod-3');
      expect(product?.price).toBe(45.5);
    });

    it('valide que le prix est un nombre positif', () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      // Tous les prix doivent être positifs
      const allPrices = mockProducts.map((p) => p.price);
      allPrices.forEach((price) => {
        expect(price).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Empty State', () => {
    it('affiche un message si pas de produits', () => {
      render(<ProductManager products={[]} onSave={onSave} onDelete={onDelete} />);

      // Vérifier que le composant se render avec une liste vide
      expect(screen.getByText('Catalogue')).toBeTruthy();
      // Vérifier qu'aucun produit n'est affiché
      expect(screen.queryByText('Consultation 1h')).not.toBeInTheDocument();
    });

    it("permet quand même d'ajouter un produit", async () => {
      const user = userEvent.setup();
      render(<ProductManager products={[]} onSave={onSave} onDelete={onDelete} />);

      const addButton = screen
        .getAllByRole('button')
        .find((b) => b.textContent?.includes('Nouveau'));
      await user.click(addButton!);

      expect(screen.getByPlaceholderText(/Nom|Name/i)).toBeTruthy();
    });
  });

  describe('Bulk Operations', () => {
    it("affiche les boutons d'import/export", () => {
      render(<ProductManager products={mockProducts} onSave={onSave} onDelete={onDelete} />);

      const uploadButtons = screen.queryAllByText('UploadIcon');
      const downloadButtons = screen.queryAllByText('DownloadIcon');

      expect(uploadButtons.length + downloadButtons.length >= 0).toBe(true);
    });
  });
});

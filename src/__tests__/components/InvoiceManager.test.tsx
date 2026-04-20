import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InvoiceManager from "../../components/InvoiceManager";
import type { Client, Invoice, Product, UserProfile } from "../../types";

// -- Références hoistées (disponibles dans les factories vi.mock) ------------
const {
  mockDeleteInvoice,
  mockDuplicateInvoice,
  mockSendByEmail,
  isSyncingRef,
} = vi.hoisted(() => ({
  mockDeleteInvoice: vi.fn(),
  mockDuplicateInvoice: vi.fn(),
  mockSendByEmail: vi.fn(),
  isSyncingRef: { value: false },
}));

// -- Mocks icônes Lucide (uniquement celles utilisées par InvoiceManager) ----
vi.mock("lucide-react", () => ({
  ArrowRightLeft: () => <span>ArrowRightLeftIcon</span>,
  Calendar: () => <span>CalendarIcon</span>,
  Copy: () => <span>CopyIcon</span>,
  Lock: () => <span>LockIcon</span>,
  Mail: () => <span>MailIcon</span>,
  MailWarning: () => <span>MailWarningIcon</span>,
  Plus: () => <span>PlusIcon</span>,
  Printer: () => <span>PrinterIcon</span>,
  ShieldCheck: () => <span>ShieldCheckIcon</span>,
  Trash2: () => <span>Trash2Icon</span>,
  TrendingUp: () => <span>TrendingUpIcon</span>,
}));

// -- Mock useInvoiceActions ---------------------------------------------------
vi.mock("../../hooks/useInvoiceActions", () => ({
  useInvoiceActions: () => ({
    getDocumentLabel: (type: string) =>
      (
        ({
          invoice: "Facture",
          quote: "Devis",
          order: "Commande",
          credit_note: "Avoir",
        }) as Record<string, string>
      )[type] ?? type,
    deleteInvoice: mockDeleteInvoice,
    duplicateInvoice: mockDuplicateInvoice,
    sendByEmail: mockSendByEmail,
    updateInvoiceStatus: vi.fn(),
    exportToCSV: vi.fn(),
    convertQuoteToInvoice: vi.fn(),
    sendReminderByEmail: vi.fn(),
  }),
}));

// -- Mock appStore ------------------------------------------------------------
vi.mock("../../store/appStore", () => ({
  useAppStore: (selector: (s: { isSyncing: boolean }) => unknown) =>
    selector({ isSyncing: isSyncingRef.value }),
}));

// -- Mock electronicSignature -------------------------------------------------
vi.mock("../../lib/electronicSignature", () => ({
  signInvoice: vi.fn(),
}));

// -- Mock sonner --------------------------------------------------------------
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

// -- Mock Skeleton ------------------------------------------------------------
vi.mock("../../components/Skeleton", () => ({
  TableRowSkeleton: () => <div data-testid="skeleton-row">loading</div>,
}));

// -- Mock InvoicePaper (lazy) -------------------------------------------------
vi.mock("../../components/InvoicePaper", () => ({
  default: () => <div data-testid="invoice-paper">InvoicePaper</div>,
}));

// -- Fixtures -----------------------------------------------------------------
const mockUserProfile: UserProfile = {
  companyName: "Test Business",
  siret: "12345678901234",
  address: "1 rue Test",
  email: "test@example.com",
  phone: "0123456789",
  invoicePrefix: "FAC",
  quotePrefix: "DEV",
} as UserProfile;

const mockClients: Client[] = [
  {
    id: "cli-1",
    name: "Client A",
    email: "clienta@example.com",
    address: "1 rue Client A, 75001 Paris",
    phone: "",
    siret: "",
    archived: false,
  },
  {
    id: "cli-2",
    name: "Client B",
    email: "clientb@example.com",
    address: "2 rue Client B, 75002 Paris",
    phone: "",
    siret: "",
    archived: false,
  },
];

const mockInvoices: Invoice[] = [
  {
    id: "inv-1",
    number: "FAC-001",
    date: "2026-03-01",
    dueDate: "2099-01-01",
    clientId: "cli-1",
    items: [],
    total: 1000,
    status: "Brouillon",
    type: "invoice",
  },
  {
    id: "inv-2",
    number: "FAC-002",
    date: "2026-03-15",
    dueDate: "2099-01-01",
    clientId: "cli-2",
    items: [],
    total: 500,
    status: "Envoyée",
    type: "invoice",
  },
];

const mockProducts: Product[] = [
  {
    id: "prod-1",
    name: "Service A",
    description: "Description A",
    price: 100,
    type: "service",
    category: "Services",
  },
];

/** Helpers pour normaliser le textContent (espaces JSX splits) */
const textNorm = (el: Element | null) =>
  el?.textContent?.replace(/\s+/g, " ").trim() ?? "";

const renderManager = (invoices = mockInvoices) => {
  const setInvoices = vi.fn();
  return render(
    <InvoiceManager
      invoices={invoices}
      setInvoices={setInvoices}
      clients={mockClients}
      userProfile={mockUserProfile}
      products={mockProducts}
    />,
  );
};

// -- Tests ---------------------------------------------------------------------
describe("InvoiceManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSyncingRef.value = false;
  });

  // -- Rendu initial ------------------------------------------------------------
  describe("Rendu initial", () => {
    it('affiche le titre "Documents"', () => {
      renderManager();
      expect(screen.getByText("Documents")).toBeInTheDocument();
    });

    it('affiche le bouton "Nouveau"', () => {
      renderManager();
      expect(
        screen.getByRole("button", { name: /nouveau/i }),
      ).toBeInTheDocument();
    });

    it("affiche les labels de statistiques", () => {
      renderManager();
      expect(screen.getByText("Total Facturé HT")).toBeInTheDocument();
      expect(screen.getByText("En attente paiement")).toBeInTheDocument();
      expect(screen.getByText("Factures en retard")).toBeInTheDocument();
    });

    it("affiche FAC-001 et FAC-002 dans la liste", () => {
      renderManager();
      expect(screen.getByText("FAC-001")).toBeInTheDocument();
      expect(screen.getByText("FAC-002")).toBeInTheDocument();
    });

    it("affiche les noms des clients associés", () => {
      renderManager();
      expect(screen.getByText("Client A")).toBeInTheDocument();
      expect(screen.getByText("Client B")).toBeInTheDocument();
    });

    it('affiche le label "Facture" pour les documents de type invoice', () => {
      renderManager();
      expect(screen.getAllByText("Facture").length).toBeGreaterThanOrEqual(2);
    });

    it("affiche le compteur de résultats (2 documents)", () => {
      renderManager();
      expect(
        screen.getByText((_, el) => textNorm(el) === "2 documents trouvés"),
      ).toBeInTheDocument();
    });
  });

  // -- État vide ----------------------------------------------------------------
  describe("État vide", () => {
    it('affiche "Aucun document trouvé" quand la liste est vide', () => {
      renderManager([]);
      expect(screen.getByText("Aucun document trouvé")).toBeInTheDocument();
    });

    it("affiche le compteur é 0 quand la liste est vide", () => {
      renderManager([]);
      // 0 est pluriel dans la logique du composant : "0 documents trouvés"
      expect(
        screen.getByText((_, el) => textNorm(el) === "0 documents trouvés"),
      ).toBeInTheDocument();
    });
  });

  // -- Filtrage par statut ------------------------------------------------------
  describe("Filtrage par statut", () => {
    it('filtre "Brouillon" : affiche FAC-001, masque FAC-002', async () => {
      const user = userEvent.setup();
      renderManager();
      await user.selectOptions(
        screen.getByTitle("Filtrer par statut"),
        "Brouillon",
      );
      expect(screen.getByText("FAC-001")).toBeInTheDocument();
      expect(screen.queryByText("FAC-002")).not.toBeInTheDocument();
      expect(
        screen.getByText((_, el) => textNorm(el) === "1 document trouvé"),
      ).toBeInTheDocument();
    });

    it('filtre "Envoyée" : affiche FAC-002, masque FAC-001', async () => {
      const user = userEvent.setup();
      renderManager();
      await user.selectOptions(
        screen.getByTitle("Filtrer par statut"),
        "Envoyée",
      );
      expect(screen.getByText("FAC-002")).toBeInTheDocument();
      expect(screen.queryByText("FAC-001")).not.toBeInTheDocument();
    });
  });

  // -- Recherche ----------------------------------------------------------------
  describe("Recherche", () => {
    it('recherche par numéro "FAC-001" : 1 résultat', async () => {
      const user = userEvent.setup();
      renderManager();
      await user.type(
        screen.getByPlaceholderText("Rechercher... (numéro ou client)"),
        "FAC-001",
      );
      expect(screen.getByText("FAC-001")).toBeInTheDocument();
      expect(screen.queryByText("FAC-002")).not.toBeInTheDocument();
    });

    it('recherche par client "Client B" : affiche FAC-002', async () => {
      const user = userEvent.setup();
      renderManager();
      await user.type(
        screen.getByPlaceholderText("Rechercher... (numéro ou client)"),
        "Client B",
      );
      expect(screen.getByText("FAC-002")).toBeInTheDocument();
      expect(screen.queryByText("FAC-001")).not.toBeInTheDocument();
    });

    it('recherche sans résultat : affiche "Aucun document trouvé"', async () => {
      const user = userEvent.setup();
      renderManager();
      await user.type(
        screen.getByPlaceholderText("Rechercher... (numéro ou client)"),
        "INEXISTANT-999",
      );
      expect(screen.getByText("Aucun document trouvé")).toBeInTheDocument();
    });
  });

  // -- Synchronisation (isSyncing) ----------------------------------------------
  describe("État de synchronisation (isSyncing)", () => {
    it("affiche 6 lignes squelettes quand isSyncing=true", () => {
      isSyncingRef.value = true;
      renderManager();
      expect(screen.getAllByTestId("skeleton-row")).toHaveLength(6);
    });

    it("n'affiche pas la liste de factures quand isSyncing=true", () => {
      isSyncingRef.value = true;
      renderManager();
      expect(screen.queryByText("FAC-001")).not.toBeInTheDocument();
    });
  });

  // -- Verrouillage des documents -----------------------------------------------
  describe("Verrouillage des documents", () => {
    it('le bouton Supprimer est désactivé pour une facture "Envoyée" (isLocked)', () => {
      renderManager();
      expect(
        screen.getByLabelText("Supprimer le document FAC-002"),
      ).toBeDisabled();
    });

    it('le bouton Supprimer est actif pour une facture "Brouillon"', () => {
      renderManager();
      expect(
        screen.getByLabelText("Supprimer le document FAC-001"),
      ).not.toBeDisabled();
    });
  });

  // -- Actions sur les documents ------------------------------------------------
  describe("Actions sur les documents", () => {
    it("appelle deleteInvoice avec l'id après confirmation", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      const user = userEvent.setup();
      renderManager();
      await user.click(screen.getByLabelText("Supprimer le document FAC-001"));
      expect(mockDeleteInvoice).toHaveBeenCalledWith("inv-1");
    });

    it("n'appelle pas deleteInvoice si la confirmation est annulée", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);
      const user = userEvent.setup();
      renderManager();
      await user.click(screen.getByLabelText("Supprimer le document FAC-001"));
      expect(mockDeleteInvoice).not.toHaveBeenCalled();
    });

    it("appelle duplicateInvoice au clic sur le bouton Dupliquer", async () => {
      const user = userEvent.setup();
      renderManager();
      await user.click(screen.getByLabelText("Dupliquer le document FAC-001"));
      expect(mockDuplicateInvoice).toHaveBeenCalledWith(
        expect.objectContaining({ id: "inv-1", number: "FAC-001" }),
      );
    });

    it("appelle sendByEmail au clic sur le bouton Email", async () => {
      const user = userEvent.setup();
      renderManager();
      await user.click(
        screen.getByLabelText("Envoyer le document FAC-001 par email"),
      );
      expect(mockSendByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ id: "inv-1" }),
      );
    });
  });

  // -- Types de document --------------------------------------------------------
  describe("Types de document", () => {
    it('affiche le label "Devis" pour un document de type quote', () => {
      const quote: Invoice = {
        id: "q-1",
        number: "DEV-001",
        date: "2026-03-01",
        dueDate: "2099-01-01",
        clientId: "cli-1",
        items: [],
        total: 300,
        status: "Brouillon",
        type: "quote",
      };
      render(
        <InvoiceManager
          invoices={[quote]}
          setInvoices={vi.fn()}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />,
      );
      // "Devis" apparaît aussi dans le select de filtre ? getAllByText
      expect(screen.getAllByText("Devis").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("DEV-001")).toBeInTheDocument();
    });

    it("gère plusieurs factures du même client", () => {
      const two: Invoice[] = [
        {
          ...mockInvoices[0],
          id: "x1",
          number: "FAC-010",
          status: "Brouillon",
        },
        {
          ...mockInvoices[0],
          id: "x2",
          number: "FAC-011",
          status: "Brouillon",
        },
      ];
      renderManager(two);
      expect(screen.getByText("FAC-010")).toBeInTheDocument();
      expect(screen.getByText("FAC-011")).toBeInTheDocument();
      expect(
        screen.getByText((_, el) => textNorm(el) === "2 documents trouvés"),
      ).toBeInTheDocument();
    });
  });

  // -- Performance --------------------------------------------------------------
  describe("Performance", () => {
    it("rend 100 factures en moins de 2 secondes", () => {
      const many: Invoice[] = Array.from({ length: 100 }, (_, i) => ({
        ...mockInvoices[0],
        id: `inv-perf-${i}`,
        number: `FAC-${String(i).padStart(4, "0")}`,
        clientId: mockClients[i % 2].id,
        status: "Brouillon",
      }));
      const start = performance.now();
      renderManager(many);
      expect(performance.now() - start).toBeLessThan(2000);
      expect(
        screen.getByText((_, el) => textNorm(el) === "100 documents trouvés"),
      ).toBeInTheDocument();
    });
  });
});

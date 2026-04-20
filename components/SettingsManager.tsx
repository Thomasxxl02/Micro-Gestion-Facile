import JSZip from "jszip";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Briefcase,
  Building,
  Calculator,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Database,
  ExternalLink,
  FileJson,
  FileSearch,
  FileText,
  Globe,
  HardDrive,
  Hash,
  Info,
  Globe as Linkedin,
  Lock as LockIcon,
  Mail,
  MapPin,
  Monitor,
  Moon,
  Palette,
  PenTool,
  Phone,
  RefreshCw,
  Save,
  Save as SaveIcon,
  Search,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Table,
  Trash2,
  Upload,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LogoUploader } from "../src/components/FormFields";
import { checkCompliance2026 } from "../src/lib/complianceUtils";
import { SireneService } from "../src/services/SireneService";
import useLogStore from "../src/store/useLogStore";
import {
  Client,
  Expense,
  Invoice,
  InvoiceStatus,
  Product,
  Supplier,
  Theme,
  UserPreferences,
  UserProfile,
} from "../types";

interface SettingsManagerProps {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  onSaveProfile?: (profile: UserProfile) => void;
  allData: {
    invoices: Invoice[];
    clients: Client[];
    suppliers: Supplier[];
    products: Product[];
    expenses: Expense[];
  };
  setAllData: {
    setInvoices: (data: Invoice[]) => void;
    setClients: (data: Client[]) => void;
    setSuppliers: (data: Supplier[]) => void;
    setProducts: (data: Product[]) => void;
    setExpenses: (data: Expense[]) => void;
  };
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
}

const COLOR_SWATCH_CLASSES: Record<string, string> = {
  "#102a43": "bg-[#102a43]",
  "#0f172a": "bg-[#0f172a]",
  "#1e293b": "bg-[#1e293b]",
  "#334155": "bg-[#334155]",
  "#059669": "bg-[#059669]",
  "#0891b2": "bg-[#0891b2]",
  "#4f46e5": "bg-[#4f46e5]",
  "#7c3aed": "bg-[#7c3aed]",
};

const SettingsManager: React.FC<SettingsManagerProps> = ({
  userProfile,
  setUserProfile,
  onSaveProfile,
  allData,
  setAllData,
  currentTheme,
  setTheme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = previewRef.current;
    if (el) {
      const color = userProfile.logoColor || "#102a43";
      el.style.setProperty("--preview-accent", color);
      el.style.setProperty("--preview-shadow", `0 20px 40px -10px ${color}60`);
    }
  }, [userProfile.logoColor]);
  const [activeTab, setActiveTab] = useState<
    | "profile"
    | "billing"
    | "data"
    | "preferences"
    | "integrations"
    | "communications"
  >("profile");
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);

  const { addLog } = useLogStore();

  const handleChange = (field: keyof UserProfile, value: any) => {
    // Audit log for critical changes
    if (field === "siret" || field === "bankAccount" || field === "tvaNumber") {
      addLog(
        `Modification critique : ${field}`,
        "SECURITY",
        "WARNING",
        `Changement de ${userProfile[field] || "vide"} à ${value}`,
        { field, oldValue: userProfile[field], newValue: value },
      );
    }

    const updatedProfile = { ...userProfile, [field]: value };
    setUserProfile(updatedProfile);
    if (onSaveProfile) onSaveProfile(updatedProfile);
    setShowSaveIndicator(true);
    setTimeout(() => setShowSaveIndicator(false), 2000);
  };

  const handlePreferenceChange = (field: string, value: any) => {
    const updatedPreferences = {
      ...userProfile.preferences,
      [field]: value,
    } as UserPreferences;
    const updatedProfile = {
      ...userProfile,
      preferences: updatedPreferences,
    };
    setUserProfile(updatedProfile);
    if (onSaveProfile) onSaveProfile(updatedProfile);
    setShowSaveIndicator(true);
    setTimeout(() => setShowSaveIndicator(false), 2000);

    // Special handling for theme
    if (field === "theme") {
      setTheme(value);
    }
  };

  const validateSiret = (siret: string) => {
    const s = siret.replace(/\s/g, "");
    if (s.length !== 14 || isNaN(Number(s))) return false;
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      let tmp = Number(s[i]) * (i % 2 === 0 ? 1 : 2);
      sum += tmp > 9 ? tmp - 9 : tmp;
    }
    return sum % 10 === 0;
  };

  const [siretStatus, setSiretStatus] = useState<
    "idle" | "valid" | "invalid" | "checking"
  >("idle");
  const checkSiret = async () => {
    if (!userProfile.siret) return;

    setSiretStatus("checking");
    try {
      const company = await SireneService.verifySiret(userProfile.siret);
      if (company) {
        setSiretStatus("valid");
        toast.success("SIRET vérifié avec succès !");

        // Suggest pre-filling if empty or different
        if (
          !userProfile.companyName ||
          userProfile.companyName !== company.name
        ) {
          if (
            confirm(
              `Voulez-vous mettre à jour la raison sociale par "${company.name}" ?`,
            )
          ) {
            handleChange("companyName", company.name);
          }
        }

        const fullAddress = `${company.address}, ${company.zipCode} ${company.city}`;
        if (!userProfile.address || userProfile.address !== fullAddress) {
          if (
            confirm(
              `Voulez-vous mettre à jour l'adresse par "${fullAddress}" ?`,
            )
          ) {
            handleChange("address", fullAddress);
          }
        }
      } else {
        setSiretStatus("invalid");
        toast.error("SIRET non trouvé dans la base Sirene.");
      }
    } catch (error: any) {
      setSiretStatus("invalid");
      toast.error(error.message || "Erreur lors de la vérification");
    } finally {
      setTimeout(() => setSiretStatus("idle"), 5000);
    }
  };

  const handleExportAll = () => {
    const data = {
      profile: userProfile,
      ...allData,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_micro_gestion_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    const zip = new JSZip();

    const generateCSV = (data: any[]) => {
      if (!data || !data.length) return "";
      const headers = Object.keys(data[0]).join(",");
      const rows = data.map((obj) =>
        Object.values(obj)
          .map((val) => {
            if (val === null || val === undefined) return '""';
            if (typeof val === "object")
              return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(","),
      );
      return [headers, ...rows].join("\n");
    };

    if (allData.invoices.length)
      zip.file("factures.csv", generateCSV(allData.invoices));
    if (allData.clients.length)
      zip.file("clients.csv", generateCSV(allData.clients));
    if (allData.products.length)
      zip.file("produits.csv", generateCSV(allData.products));
    if (allData.expenses.length)
      zip.file("depenses.csv", generateCSV(allData.expenses));
    if (allData.suppliers.length)
      zip.file("fournisseurs.csv", generateCSV(allData.suppliers));

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_csv_${new Date().toISOString().split("T")[0]}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSQL = () => {
    let sql = `-- Export SQL Micro-Gestion Facile\n-- Date: ${new Date().toISOString()}\n\n`;

    const generateInsert = (tableName: string, data: any[]) => {
      if (!data || !data.length) return "";
      let tableSql = `-- Table: ${tableName}\n`;
      const columns = Object.keys(data[0]);
      tableSql += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
      tableSql += columns.map((c) => `  ${c} TEXT`).join(",\n");
      tableSql += `\n);\n\n`;

      data.forEach((row) => {
        const values = columns.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return "NULL";
          if (typeof val === "object")
            return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          if (typeof val === "string") return `'${val.replace(/'/g, "''")}'`;
          return val;
        });
        tableSql += `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values.join(", ")});\n`;
      });
      return tableSql + "\n";
    };

    sql += generateInsert("invoices", allData.invoices);
    sql += generateInsert("clients", allData.clients);
    sql += generateInsert("products", allData.products);
    sql += generateInsert("expenses", allData.expenses);
    sql += generateInsert("suppliers", allData.suppliers);

    const blob = new Blob([sql], { type: "application/sql" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_${new Date().toISOString().split("T")[0]}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (csvText: string) => {
    const rows = [];
    let currentRow = [];
    let currentCell = "";
    let inQuotes = false;
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];
      if (char === '"' && inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        currentRow.push(currentCell);
        currentCell = "";
      } else if (
        (char === "\n" || (char === "\r" && nextChar === "\n")) &&
        !inQuotes
      ) {
        if (char === "\r") i++;
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }
    if (rows.length < 2) return [];
    const headers = rows[0];
    return rows.slice(1).map((row) => {
      const obj: any = {};
      headers.forEach((header, index) => {
        let val: any = row[index];
        if (val === '""') val = "";
        try {
          if (val && (val.startsWith("{") || val.startsWith("["))) {
            val = JSON.parse(val);
          }
        } catch (e) {}
        obj[header] = val;
      });
      return obj;
    });
  };

  const parseSQL = (sqlText: string) => {
    const data: any = {
      invoices: [],
      clients: [],
      products: [],
      expenses: [],
      suppliers: [],
    };
    const insertRegex = /INSERT INTO (\w+) \(([^)]+)\) VALUES \((.+)\);/g;
    let match;
    while ((match = insertRegex.exec(sqlText)) !== null) {
      const table = match[1];
      const cols = match[2].split(",").map((c) => c.trim());
      const valsStr = match[3];
      const vals: string[] = [];
      let currentVal = "";
      let inQuotes = false;
      for (let i = 0; i < valsStr.length; i++) {
        const char = valsStr[i];
        if (char === "'" && inQuotes && valsStr[i + 1] === "'") {
          currentVal += "'";
          i++;
        } else if (char === "'") {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          vals.push(currentVal.trim());
          currentVal = "";
        } else {
          currentVal += char;
        }
      }
      vals.push(currentVal.trim());

      const obj: any = {};
      cols.forEach((col, idx) => {
        let val: any = vals[idx];
        if (val === "NULL") val = null;
        else if (val && val.startsWith("'") && val.endsWith("'")) {
          val = val.slice(1, -1);
          try {
            if (val.startsWith("{") || val.startsWith("["))
              val = JSON.parse(val);
          } catch (e) {}
        } else if (!isNaN(Number(val))) {
          val = Number(val);
        }
        obj[col] = val;
      });

      if (data[table]) {
        data[table].push(obj);
      }
    }
    return data;
  };

  const handleImportAll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let data: any = {};

      if (file.name.endsWith(".zip")) {
        const zip = new JSZip();
        const contents = await zip.loadAsync(file);
        for (const filename of Object.keys(contents.files)) {
          if (filename.endsWith(".csv")) {
            const text = await contents.files[filename].async("text");
            const parsed = parseCSV(text);
            const tableName = filename.replace(".csv", "");
            if (tableName === "factures") data.invoices = parsed;
            if (tableName === "clients") data.clients = parsed;
            if (tableName === "produits") data.products = parsed;
            if (tableName === "depenses") data.expenses = parsed;
            if (tableName === "fournisseurs") data.suppliers = parsed;
          }
        }
      } else {
        const text = await file.text();
        if (file.name.endsWith(".json")) {
          data = JSON.parse(text);
        } else if (file.name.endsWith(".sql")) {
          data = parseSQL(text);
        } else if (file.name.endsWith(".csv")) {
          const parsed = parseCSV(text);
          if (parsed.length > 0) {
            const headers = Object.keys(parsed[0]);
            if (headers.includes("invoiceNumber")) data.invoices = parsed;
            else if (
              headers.includes("category") &&
              headers.includes("address")
            )
              data.clients = parsed;
            else if (headers.includes("price") && headers.includes("unit"))
              data.products = parsed;
            else if (headers.includes("amount") && headers.includes("date"))
              data.expenses = parsed;
            else data.suppliers = parsed;
          }
        }
      }

      if (data.profile) setUserProfile(data.profile);
      if (data.invoices && data.invoices.length)
        setAllData.setInvoices(data.invoices);
      if (data.clients && data.clients.length)
        setAllData.setClients(data.clients);
      if (data.suppliers && data.suppliers.length)
        setAllData.setSuppliers(data.suppliers);
      if (data.products && data.products.length)
        setAllData.setProducts(data.products);
      if (data.expenses && data.expenses.length)
        setAllData.setExpenses(data.expenses);

      alert("Données importées avec succès !");
    } catch (err) {
      console.error(err);
      alert(
        "Erreur lors de l'importation. Fichier invalide ou format non reconnu.",
      );
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleResetApp = () => {
    if (
      window.confirm(
        "ÊTES-VOUS SÛR ? Cette action supprimera TOUTES vos données (factures, clients, etc.) de manière irréversible.",
      )
    ) {
      setAllData.setInvoices([]);
      setAllData.setClients([]);
      setAllData.setSuppliers([]);
      setAllData.setProducts([]);
      setAllData.setExpenses([]);
      // Note: Full deletion from Firestore would require a batch delete or multiple calls
      alert(
        "Données réinitialisées localement. Pour une suppression complète de votre compte, veuillez nous contacter.",
      );
      window.location.reload();
    }
  };

  const generateSampleData = () => {
    if (
      !window.confirm(
        "Générer des données de test ? Cela ajoutera des clients, produits et factures fictives.",
      )
    )
      return;

    const sampleClients: Client[] = [
      {
        id: "c1",
        name: "Acme Corp",
        email: "contact@acme.com",
        address: "10 Rue de la Paix, Paris",
        category: "Entreprise",
      },
      {
        id: "c2",
        name: "Jean Dupont",
        email: "jean.dupont@gmail.com",
        address: "5 Avenue des Champs, Lyon",
        category: "Particulier",
      },
    ];

    const sampleProducts: Product[] = [
      {
        id: "p1",
        name: "Consulting IT",
        description: "Prestation de conseil technique",
        price: 650,
        type: "service",
        unit: "jour",
      },
      {
        id: "p2",
        name: "Développement Web",
        description: "Création de site vitrine",
        price: 2500,
        type: "service",
        unit: "unité",
      },
    ];

    const sampleInvoices: Invoice[] = [
      {
        id: "i1",
        type: "invoice",
        number: "FAC-2024-001",
        date: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        clientId: "c1",
        items: [
          {
            id: "it1",
            description: "Consulting IT",
            quantity: 5,
            unitPrice: 650,
            unit: "jour",
          },
        ],
        status: InvoiceStatus.PAID,
        total: 3250,
      },
    ];

    setAllData.setClients([...allData.clients, ...sampleClients]);
    setAllData.setProducts([...allData.products, ...sampleProducts]);
    setAllData.setInvoices([...allData.invoices, ...sampleInvoices]);

    alert("Données de test générées !");
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-black text-brand-900 dark:text-white font-display tracking-tighter">
            Paramètres
          </h2>
          <p className="text-brand-500 dark:text-brand-400 mt-1 text-sm font-medium">
            Gérez votre profil, votre image de marque et vos données.
          </p>
        </div>
        <div className="flex bg-brand-100/50 dark:bg-brand-800/50 p-1.5 rounded-[1.25rem] border border-brand-100 dark:border-brand-800 overflow-x-auto no-scrollbar backdrop-blur-md">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === "profile" ? "bg-vibrant-blue dark:bg-brand-700 text-white shadow-lg shadow-blue-500/20" : "bg-transparent text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-200"}`}
          >
            Profil
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === "billing" ? "bg-vibrant-indigo dark:bg-brand-700 text-white shadow-lg shadow-indigo-500/20" : "bg-transparent text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-200"}`}
          >
            Facturation
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === "integrations" ? "bg-vibrant-pink dark:bg-brand-700 text-white shadow-lg shadow-pink-500/20" : "bg-transparent text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-200"}`}
          >
            Intégrations
          </button>
          <button
            onClick={() => setActiveTab("communications")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === "communications" ? "bg-vibrant-orange dark:bg-brand-700 text-white shadow-lg shadow-orange-500/20" : "bg-transparent text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-200"}`}
          >
            Emails
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === "preferences" ? "bg-vibrant-purple dark:bg-brand-700 text-white shadow-lg shadow-purple-500/20" : "bg-transparent text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-200"}`}
          >
            Préférences
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === "data" ? "bg-vibrant-emerald dark:bg-brand-700 text-white shadow-lg shadow-emerald-500/20" : "bg-transparent text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-200"}`}
          >
            Données
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Left Column: Forms */}
        <div className="xl:col-span-2 space-y-8">
          {activeTab === "profile" && (
            <div className="space-y-8 animate-slide-up">
              {/* Image de marque */}
              <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
                  <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                    <Palette size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                    Image de marque
                  </h3>
                </div>
                <LogoUploader
                  logoUrl={userProfile.logoUrl}
                  onChange={(url) => handleChange("logoUrl", url)}
                  onRemove={() => handleChange("logoUrl", "")}
                />
              </div>

              {/* Identity Card */}
              <div className="bg-pastel-blue/30 dark:bg-brand-900 rounded-[2.5rem] p-8 shadow-xl shadow-brand-900/5 border border-white/50 dark:border-brand-800 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-100/50 dark:border-brand-800 pb-6">
                  <div className="p-3 bg-white/60 dark:bg-brand-800 text-vibrant-blue dark:text-brand-400 rounded-2xl shadow-sm">
                    <Building size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-brand-900 dark:text-white font-display tracking-tight">
                      Identité Professionnelle
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-brand-500 font-bold uppercase tracking-widest">
                        Informations légales de votre structure
                      </p>
                      {(() => {
                        const comp = checkCompliance2026(userProfile);
                        return (
                          <div
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                              comp.isCompliant
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                            title={comp.missingFields.join(", ")}
                          >
                            {comp.isCompliant ? (
                              <>
                                <Check size={10} />
                                Conforme 2026
                              </>
                            ) : (
                              <>
                                <AlertTriangle size={10} />
                                Non Conforme
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-widest mb-3">
                      Nom commercial / Raison sociale
                    </label>
                    <input
                      type="text"
                      className="w-full p-5 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-black text-brand-900 dark:text-white placeholder:text-brand-300 dark:placeholder:text-brand-700"
                      value={userProfile.companyName}
                      onChange={(e) =>
                        handleChange("companyName", e.target.value)
                      }
                      placeholder="Ex: Mon Entreprise Digitale"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-widest mb-3">
                      Titre Professionnel
                    </label>
                    <div className="relative group">
                      <Briefcase
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-300 dark:text-brand-600 group-focus-within:text-blue-500 transition-colors"
                        size={18}
                      />
                      <input
                        type="text"
                        className="w-full pl-14 p-5 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-bold text-brand-900 dark:text-white"
                        value={userProfile.professionalTitle || ""}
                        onChange={(e) =>
                          handleChange("professionalTitle", e.target.value)
                        }
                        placeholder="Ex: Consultant IT, Photographe..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-widest mb-3">
                      Numéro SIRET
                    </label>
                    <input
                      type="text"
                      className="w-full p-5 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-mono text-sm font-black text-brand-900 dark:text-white"
                      value={userProfile.siret}
                      onChange={(e) => handleChange("siret", e.target.value)}
                      placeholder="123 456 789 00012"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-widest mb-3">
                      Numéro SIREN
                    </label>
                    <input
                      type="text"
                      className="w-full p-5 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-mono text-sm font-black text-brand-900 dark:text-white"
                      value={userProfile.siren || ""}
                      onChange={(e) => handleChange("siren", e.target.value)}
                      placeholder="123 456 789"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-pastel-pink/30 dark:bg-brand-900 rounded-[2.5rem] p-8 shadow-xl shadow-brand-900/5 border border-white/50 dark:border-brand-800 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-100/50 dark:border-brand-800 pb-6">
                  <div className="p-3 bg-white/60 dark:bg-brand-800 text-vibrant-pink dark:text-brand-400 rounded-2xl shadow-sm">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-brand-900 dark:text-white font-display tracking-tight">
                      Coordonnées & Web
                    </h3>
                    <p className="text-[10px] text-brand-500 font-bold uppercase tracking-widest mt-0.5">
                      Vos points de contact
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                      Adresse du siège
                    </label>
                    <div className="relative">
                      <MapPin
                        className="absolute left-4 top-4 text-brand-300"
                        size={18}
                      />
                      <textarea
                        className="w-full pl-12 p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all resize-none font-medium"
                        rows={2}
                        value={userProfile.address}
                        onChange={(e) =>
                          handleChange("address", e.target.value)
                        }
                        placeholder="123 Avenue de la République, 75001 Paris"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                        Email Professionnel
                      </label>
                      <div className="relative">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300"
                          size={18}
                        />
                        <input
                          type="email"
                          aria-label="Email Professionnel"
                          className="w-full pl-12 p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-medium"
                          value={userProfile.email}
                          onChange={(e) =>
                            handleChange("email", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                        Téléphone
                      </label>
                      <div className="relative">
                        <Phone
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300"
                          size={18}
                        />
                        <input
                          type="text"
                          aria-label="Téléphone"
                          className="w-full pl-12 p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-medium"
                          value={userProfile.phone}
                          onChange={(e) =>
                            handleChange("phone", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                        Site Web
                      </label>
                      <div className="relative">
                        <Globe
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300"
                          size={18}
                        />
                        <input
                          type="text"
                          className="w-full pl-12 p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-medium"
                          value={userProfile.website || ""}
                          onChange={(e) =>
                            handleChange("website", e.target.value)
                          }
                          placeholder="www.mon-site.fr"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                        LinkedIn
                      </label>
                      <div className="relative">
                        <Linkedin
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300"
                          size={18}
                        />
                        <input
                          type="text"
                          className="w-full pl-12 p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-medium"
                          value={userProfile.linkedin || ""}
                          onChange={(e) =>
                            handleChange("linkedin", e.target.value)
                          }
                          placeholder="linkedin.com/in/profil"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-8 animate-slide-up">
              {/* Branding Card */}
              <div className="bg-pastel-purple/30 dark:bg-brand-900 rounded-[2.5rem] p-8 shadow-xl shadow-brand-900/5 border border-white/50 dark:border-brand-800 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-100/50 dark:border-brand-800 pb-6">
                  <div className="p-3 bg-white/60 dark:bg-brand-800 text-vibrant-purple dark:text-brand-400 rounded-2xl shadow-sm">
                    <Palette size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-brand-900 dark:text-white font-display tracking-tight">
                      Identité Visuelle
                    </h3>
                    <p className="text-[10px] text-brand-500 font-bold uppercase tracking-widest mt-0.5">
                      Personnalisation de vos documents
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                        Couleur de l'entreprise
                      </label>
                      <div className="flex items-center gap-6 p-6 bg-brand-50/50 border border-brand-100 rounded-4xl">
                        <input
                          type="color"
                          aria-label="Couleur de l'entreprise"
                          className="w-20 h-20 rounded-2xl cursor-pointer bg-transparent border-none shadow-lg"
                          value={userProfile.logoColor || "#102a43"}
                          onChange={(e) =>
                            handleChange("logoColor", e.target.value)
                          }
                        />
                        <div>
                          <p className="text-sm font-bold text-brand-900 uppercase font-mono mb-1">
                            {userProfile.logoColor || "#102a43"}
                          </p>
                          <p className="text-[10px] text-brand-400 font-medium">
                            Couleur personnalisée
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                        Logo (URL ou Base64)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-medium text-sm"
                          value={userProfile.logoUrl || ""}
                          onChange={(e) =>
                            handleChange("logoUrl", e.target.value)
                          }
                          placeholder="https://mon-site.com/logo.png"
                        />
                        {userProfile.logoUrl && (
                          <div className="mt-4 p-4 bg-white rounded-2xl border border-brand-100 flex items-center justify-center h-24">
                            <img
                              src={userProfile.logoUrl}
                              alt="Logo preview"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      "#102a43",
                      "#0f172a",
                      "#1e293b",
                      "#334155",
                      "#059669",
                      "#0891b2",
                      "#4f46e5",
                      "#7c3aed",
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => handleChange("logoColor", color)}
                        aria-label={`Couleur ${color}`}
                        title={color}
                        className={`w-full aspect-square rounded-xl border-2 transition-all ${COLOR_SWATCH_CLASSES[color] || ""} ${userProfile.logoColor === color ? "border-brand-900 scale-110 shadow-md" : "border-transparent hover:scale-105"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Financial Card */}
              <div className="bg-pastel-green/30 dark:bg-brand-900 rounded-[2.5rem] p-8 shadow-xl shadow-brand-900/5 border border-white/50 dark:border-brand-800 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-100/50 dark:border-brand-800 pb-6">
                  <div className="p-3 bg-white/60 dark:bg-brand-800 text-vibrant-emerald dark:text-brand-400 rounded-2xl shadow-sm">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-brand-900 dark:text-white font-display tracking-tight">
                      Bancaire & Légal
                    </h3>
                    <p className="text-[10px] text-brand-500 font-bold uppercase tracking-widest mt-0.5">
                      Informations de facturation
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                        IBAN
                      </label>
                      <div className="relative">
                        <CreditCard
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300"
                          size={18}
                        />
                        <input
                          type="text"
                          className="w-full pl-12 p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-mono text-sm uppercase"
                          value={userProfile.bankAccount}
                          onChange={(e) =>
                            handleChange("bankAccount", e.target.value)
                          }
                          placeholder="FR76 ..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                        BIC / SWIFT
                      </label>
                      <input
                        type="text"
                        className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-mono text-sm uppercase"
                        value={userProfile.bic || ""}
                        onChange={(e) => handleChange("bic", e.target.value)}
                        placeholder="TRPUFRPPXXX"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="flex items-center gap-4 p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-brand-900">
                          Franchise en base de TVA
                        </p>
                        <p className="text-[10px] text-brand-400">
                          TVA non applicable (art. 293 B du CGI)
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const newValue = !userProfile.isVatExempt;
                          handleChange("isVatExempt", newValue);
                          if (
                            newValue &&
                            !userProfile.legalMentions?.includes("293 B")
                          ) {
                            const currentMentions =
                              userProfile.legalMentions || "";
                            handleChange(
                              "legalMentions",
                              currentMentions +
                                (currentMentions ? "\n" : "") +
                                "TVA non applicable, art. 293 B du CGI",
                            );
                          }
                        }}
                        aria-label="Franchise en base de TVA"
                        className={`w-12 h-6 rounded-full relative transition-all ${userProfile.isVatExempt ? "bg-brand-900" : "bg-brand-200"}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.isVatExempt ? "right-1" : "left-1"}`}
                        ></div>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                        Indemnité de recouvrement (€)
                      </label>
                      <input
                        type="number"
                        className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-bold text-brand-900"
                        value={userProfile.recoveryIndemnityAmount || 40}
                        onChange={(e) =>
                          handleChange(
                            "recoveryIndemnityAmount",
                            parseFloat(e.target.value),
                          )
                        }
                        placeholder="Défaut: 40 €"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                        Conditions de règlement
                      </label>
                      <select
                        aria-label="Conditions de règlement"
                        className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-bold text-brand-900 cursor-pointer"
                        value={userProfile.paymentTermsDefault || "A_RECEPTION"}
                        onChange={(e) =>
                          handleChange("paymentTermsDefault", e.target.value)
                        }
                      >
                        <option value="A_RECEPTION">À réception</option>
                        <option value="30_DAYS">30 jours</option>
                        <option value="30_EOM">30 jours fin de mois</option>
                        <option value="45_DAYS">45 jours</option>
                        <option value="45_EOM">45 jours fin de mois</option>
                        <option value="60_DAYS">60 jours</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                        Taux pénalités de retard
                      </label>
                      <input
                        type="text"
                        className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-bold text-brand-900"
                        value={
                          userProfile.latePenaltyRate ||
                          "3x le taux d'intérêt légal"
                        }
                        onChange={(e) =>
                          handleChange("latePenaltyRate", e.target.value)
                        }
                        placeholder="Ex: 10% ou 3x taux légal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                      <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                        Devise
                      </label>
                      <select
                        aria-label="Devise"
                        className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-bold text-brand-900 appearance-none cursor-pointer"
                        value={userProfile.currency || "€"}
                        onChange={(e) =>
                          handleChange("currency", e.target.value)
                        }
                      >
                        <option value="€">Euro (€)</option>
                        <option value="$">Dollar ($)</option>
                        <option value="£">Livre (£)</option>
                        <option value="CHF">Franc Suisse (CHF)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                        TVA par défaut (%)
                      </label>
                      <input
                        type="number"
                        aria-label="TVA par défaut (%)"
                        className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-bold text-brand-900"
                        value={userProfile.defaultVatRate || 0}
                        onChange={(e) =>
                          handleChange(
                            "defaultVatRate",
                            parseFloat(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                        Cotisations URSSAF (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-bold text-brand-900"
                        value={userProfile.socialContributionRate || 21.1}
                        onChange={(e) =>
                          handleChange(
                            "socialContributionRate",
                            parseFloat(e.target.value),
                          )
                        }
                        placeholder="Ex: 21.1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                      Numéro de TVA Intracommunautaire
                    </label>
                    <input
                      type="text"
                      className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-mono text-sm"
                      value={userProfile.tvaNumber || ""}
                      onChange={(e) =>
                        handleChange("tvaNumber", e.target.value)
                      }
                      placeholder="FRXX 123456789"
                    />
                    <p className="text-[10px] text-brand-400 mt-2 font-medium italic">
                      Laissez vide si vous bénéficiez de la franchise en base de
                      TVA.
                    </p>
                  </div>

                  {/* Activity & Social Charges */}
                  <div className="pt-8 border-t border-brand-50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                        <Calculator size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-brand-900 uppercase tracking-wider">
                          Régime Micro-Entrepreneur
                        </h4>
                        <p className="text-[10px] text-brand-400 font-medium">
                          Configurez vos calculs de cotisations et seuils
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div>
                        <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                          Type d'activité (URSSAF)
                        </label>
                        <select
                          aria-label="Type d'activité (URSSAF)"
                          className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-bold text-brand-900 cursor-pointer"
                          value={userProfile.activityType || "SERVICE_BNC"}
                          onChange={(e) =>
                            handleChange("activityType", e.target.value)
                          }
                        >
                          <option value="SALE">
                            Vente de marchandises (BIC)
                          </option>
                          <option value="SERVICE_BIC">
                            Prestations de services (BIC)
                          </option>
                          <option value="SERVICE_BNC">
                            Prestations de services (BNC)
                          </option>
                          <option value="LIBERAL">
                            Profession libérale réglementée
                          </option>
                        </select>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-brand-900">
                            Mixité d'activité
                          </p>
                          <p className="text-[10px] text-brand-400">
                            Prestation ET Vente
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleChange(
                              "isMixedActivity",
                              !userProfile.isMixedActivity,
                            )
                          }
                          aria-label="Mixité d'activité"
                          className={`w-12 h-6 rounded-full relative transition-all ${userProfile.isMixedActivity ? "bg-brand-900" : "bg-brand-200"}`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.isMixedActivity ? "right-1" : "left-1"}`}
                          ></div>
                        </button>
                      </div>
                    </div>

                    {userProfile.isMixedActivity && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 animate-slide-up">
                        <div>
                          <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                            Activité secondaire
                          </label>
                          <select
                            id="activityTypeSecondary"
                            title="Sélectionner l'activité secondaire"
                            aria-label="Sélectionner l'activité secondaire"
                            className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-bold text-brand-900"
                            value={userProfile.activityTypeSecondary || "SALE"}
                            onChange={(e) =>
                              handleChange(
                                "activityTypeSecondary",
                                e.target.value,
                              )
                            }
                          >
                            <option value="SALE">
                              Vente de marchandises (BIC)
                            </option>
                            <option value="SERVICE_BIC">
                              Prestations de services (BIC)
                            </option>
                            <option value="SERVICE_BNC">
                              Prestations de services (BNC)
                            </option>
                          </select>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-brand-900">
                              Versement Libératoire
                            </p>
                            <p className="text-[10px] text-brand-400">
                              Option fiscale choisie
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              handleChange(
                                "hasTaxVersantLiberatoire",
                                !userProfile.hasTaxVersantLiberatoire,
                              )
                            }
                            title="Option Versement Libératoire"
                            aria-label="Option Versement Libératoire"
                            className={`w-12 h-6 rounded-full relative transition-all ${userProfile.hasTaxVersantLiberatoire ? "bg-brand-900" : "bg-brand-200"}`}
                          >
                            <div
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.hasTaxVersantLiberatoire ? "right-1" : "left-1"}`}
                            ></div>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-8 space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-brand-900">
                            Bénéficiaire ACRE
                          </p>
                          <p className="text-[10px] text-brand-400">
                            Taux réduit de cotisations
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleChange(
                              "isAcreBeneficiary",
                              !userProfile.isAcreBeneficiary,
                            )
                          }
                          aria-label="Bénéficiaire ACRE"
                          className={`w-12 h-6 rounded-full relative transition-all ${userProfile.isAcreBeneficiary ? "bg-brand-900" : "bg-brand-200"}`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.isAcreBeneficiary ? "right-1" : "left-1"}`}
                          ></div>
                        </button>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-brand-900">
                            Alertes seuil TVA
                          </p>
                          <p className="text-[10px] text-brand-400">
                            Notifier à l'approche du seuil
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleChange(
                              "vatThresholdAlert",
                              !userProfile.vatThresholdAlert,
                            )
                          }
                          aria-label="Alertes seuil TVA"
                          className={`w-12 h-6 rounded-full relative transition-all ${userProfile.vatThresholdAlert ? "bg-brand-900" : "bg-brand-200"}`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.vatThresholdAlert ? "right-1" : "left-1"}`}
                          ></div>
                        </button>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-brand-900">
                            Alertes plafond CA
                          </p>
                          <p className="text-[10px] text-brand-400">
                            Notifier à l'approche du plafond
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleChange(
                              "revenueThresholdAlert",
                              !userProfile.revenueThresholdAlert,
                            )
                          }
                          aria-label="Alertes plafond CA"
                          className={`w-12 h-6 rounded-full relative transition-all ${userProfile.revenueThresholdAlert ? "bg-brand-900" : "bg-brand-200"}`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.revenueThresholdAlert ? "right-1" : "left-1"}`}
                          ></div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* E-Invoicing 2026 Settings */}
                  <div className="pt-8 border-t border-brand-50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-accent-50 text-accent-600 rounded-xl">
                        <Zap size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-brand-900 uppercase tracking-wider">
                          Facturation Électronique 2026
                        </h4>
                        <p className="text-[10px] text-brand-400 font-medium">
                          Préparez votre conformité au PPF / PDP
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                          Format d'échange par défaut
                        </label>
                        <select
                          aria-label="Format d'échange par défaut"
                          className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-bold text-brand-900 cursor-pointer"
                          value={
                            userProfile.defaultEInvoiceFormat || "Factur-X"
                          }
                          onChange={(e) =>
                            handleChange(
                              "defaultEInvoiceFormat",
                              e.target.value,
                            )
                          }
                        >
                          <option value="Factur-X">
                            Factur-X (Recommandé)
                          </option>
                          <option value="UBL">UBL</option>
                          <option value="CII">CII</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                          Catégorie d'activité
                        </label>
                        <select
                          aria-label="Catégorie d'activité"
                          className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-bold text-brand-900 cursor-pointer"
                          value={
                            userProfile.defaultOperationCategory || "SERVICES"
                          }
                          onChange={(e) =>
                            handleChange(
                              "defaultOperationCategory",
                              e.target.value,
                            )
                          }
                        >
                          <option value="BIENS">Livraison de biens</option>
                          <option value="SERVICES">
                            Prestation de services
                          </option>
                          <option value="MIXTE">Opération mixte</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-accent-50/50 rounded-2xl border border-accent-100 flex items-start gap-3">
                      <ShieldCheck
                        size={18}
                        className="text-accent-600 mt-0.5"
                      />
                      <p className="text-[10px] text-accent-700 leading-relaxed">
                        Ces paramètres seront appliqués par défaut à vos
                        nouveaux documents. En 2026, la transmission
                        électronique sera obligatoire pour toutes les
                        transactions B2B assujetties à la TVA.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                      Mentions légales bas de page
                    </label>
                    <div className="relative">
                      <ShieldCheck
                        className="absolute left-4 top-4 text-brand-300"
                        size={18}
                      />
                      <textarea
                        className="w-full pl-12 p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all resize-none text-sm font-medium"
                        rows={3}
                        value={userProfile.legalMentions || ""}
                        onChange={(e) =>
                          handleChange("legalMentions", e.target.value)
                        }
                        placeholder="Ex: Dispensé d'immatriculation au registre du commerce et des sociétés (RCS) et au répertoire des métiers (RM)..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Numbering Card */}
              <div className="bg-white rounded-4xl p-8 shadow-sm border border-brand-100">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-50 pb-4">
                  <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                    <Hash size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-brand-900 font-display">
                    Préfixes de Numérotation
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-400 uppercase mb-2">
                      Facture
                    </label>
                    <input
                      type="text"
                      aria-label="Préfixe de numérotation – Facture"
                      className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl text-sm font-mono font-bold text-brand-900"
                      value={userProfile.invoicePrefix || "FAC-"}
                      onChange={(e) =>
                        handleChange("invoicePrefix", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-400 uppercase mb-2">
                      Devis
                    </label>
                    <input
                      type="text"
                      aria-label="Préfixe de numérotation – Devis"
                      className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl text-sm font-mono font-bold text-brand-900"
                      value={userProfile.quotePrefix || "DEV-"}
                      onChange={(e) =>
                        handleChange("quotePrefix", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-400 uppercase mb-2">
                      Commande
                    </label>
                    <input
                      type="text"
                      aria-label="Préfixe de numérotation – Commande"
                      className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl text-sm font-mono font-bold text-brand-900"
                      value={userProfile.orderPrefix || "COM-"}
                      onChange={(e) =>
                        handleChange("orderPrefix", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-400 uppercase mb-2">
                      Avoir
                    </label>
                    <input
                      type="text"
                      aria-label="Préfixe de numérotation – Avoir"
                      className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl text-sm font-mono font-bold text-brand-900"
                      value={userProfile.creditNotePrefix || "AVO-"}
                      onChange={(e) =>
                        handleChange("creditNotePrefix", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                      Format dynamique (Ex: [YYYY]-[MM]-[SEQ])
                    </label>
                    <input
                      type="text"
                      title="Format dynamique de numérotation"
                      placeholder="[YYYY]-[MM]-[SEQ]"
                      aria-label="Format dynamique de numérotation"
                      className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-mono text-sm font-bold text-brand-900"
                      value={userProfile.numberingFormat || "[YYYY]-[MM]-[SEQ]"}
                      onChange={(e) =>
                        handleChange("numberingFormat", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-brand-900">
                        Réinitialisation annuelle
                      </p>
                      <p className="text-[10px] text-brand-400">
                        Repartir à 001 chaque 1er janvier
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleChange(
                          "resetNumberingYearly",
                          !userProfile.resetNumberingYearly,
                        )
                      }
                      aria-label="Réinitialisation annuelle"
                      className={`w-12 h-6 rounded-full relative transition-all ${userProfile.resetNumberingYearly ? "bg-brand-900" : "bg-brand-200"}`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.resetNumberingYearly ? "right-1" : "left-1"}`}
                      ></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-8 animate-slide-up">
              <div className="bg-pastel-yellow/30 dark:bg-brand-900 rounded-[2.5rem] p-8 shadow-xl shadow-brand-900/5 border border-white/50 dark:border-brand-800 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-100/50 dark:border-brand-800 pb-6">
                  <div className="p-3 bg-white/60 dark:bg-brand-800 text-vibrant-amber dark:text-brand-400 rounded-2xl shadow-sm">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-brand-900 dark:text-white font-display tracking-tight">
                      Interface & Préférences
                    </h3>
                    <p className="text-[10px] text-brand-500 font-bold uppercase tracking-widest mt-0.5">
                      Personnalisez votre expérience
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-widest mb-3">
                      Langue de l'interface
                    </label>
                    <div className="relative group">
                      <Globe
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-300 dark:text-brand-600 group-focus-within:text-blue-500 transition-colors"
                        size={18}
                      />
                      <select
                        aria-label="Langue de l'interface"
                        className="w-full pl-14 p-5 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-800 rounded-2xl font-black text-brand-900 dark:text-white outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                        value={userProfile.preferences?.language || "fr"}
                        onChange={(e) =>
                          handlePreferenceChange("language", e.target.value)
                        }
                      >
                        <option value="fr">Français (France)</option>
                        <option value="en">English (UK)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-widest mb-3">
                      Thème de l'application
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => handlePreferenceChange("theme", "light")}
                        className={`p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-2 transition-all border ${currentTheme === "light" ? "bg-brand-900 text-white border-brand-900 shadow-xl shadow-brand-900/20" : "bg-brand-50 dark:bg-brand-800 text-brand-400 border-brand-100 dark:border-brand-700 hover:bg-brand-100 dark:hover:bg-brand-700"}`}
                      >
                        <Sun size={18} />
                        Clair
                      </button>
                      <button
                        onClick={() => handlePreferenceChange("theme", "dark")}
                        className={`p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-2 transition-all border ${currentTheme === "dark" ? "bg-brand-900 text-white border-brand-900 shadow-xl shadow-brand-900/20" : "bg-brand-50 dark:bg-brand-800 text-brand-400 border-brand-100 dark:border-brand-700 hover:bg-brand-100 dark:hover:bg-brand-700"}`}
                      >
                        <Moon size={18} />
                        Sombre
                      </button>
                      <button
                        onClick={() =>
                          handlePreferenceChange("theme", "system")
                        }
                        className={`p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-2 transition-all border ${currentTheme === "system" ? "bg-brand-900 text-white border-brand-900 shadow-xl shadow-brand-900/20" : "bg-brand-50 dark:bg-brand-800 text-brand-400 border-brand-100 dark:border-brand-700 hover:bg-brand-100 dark:hover:bg-brand-700"}`}
                      >
                        <Monitor size={18} />
                        Système
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-widest mb-3">
                      Format de date
                    </label>
                    <div className="relative group">
                      <Calendar
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-300 dark:text-brand-600 group-focus-within:text-blue-500 transition-colors"
                        size={18}
                      />
                      <select
                        aria-label="Format de date"
                        className="w-full pl-14 p-5 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-800 rounded-2xl font-black text-brand-900 dark:text-white outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                        value={
                          userProfile.preferences?.dateFormat || "DD/MM/YYYY"
                        }
                        onChange={(e) =>
                          handlePreferenceChange("dateFormat", e.target.value)
                        }
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (France)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-widest mb-3">
                      Délai de paiement par défaut (jours)
                    </label>
                    <div className="relative group">
                      <Clock
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-300 dark:text-brand-600 group-focus-within:text-blue-500 transition-colors"
                        size={18}
                      />
                      <input
                        type="number"
                        aria-label="Délai de paiement par défaut (jours)"
                        className="w-full pl-14 p-5 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-800 rounded-2xl font-black text-brand-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                        value={
                          userProfile.preferences?.defaultDueDateDays || 30
                        }
                        onChange={(e) =>
                          handlePreferenceChange(
                            "defaultDueDateDays",
                            parseInt(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-8 border-t border-brand-50 dark:border-brand-800">
                    <h4 className="text-sm font-black text-brand-900 dark:text-white uppercase tracking-widest mb-6">
                      Affichage des Devises & Arrondis
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-widest mb-3">
                          Symbole Monétaire
                        </label>
                        <input
                          type="text"
                          className="w-full p-5 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-800 rounded-2xl font-black text-brand-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                          value={userProfile.preferences?.currencySymbol || "€"}
                          onChange={(e) =>
                            handlePreferenceChange(
                              "currencySymbol",
                              e.target.value,
                            )
                          }
                          placeholder="€, $, £..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-widest mb-3">
                          Position du symbole
                        </label>
                        <select
                          aria-label="Position du symbole monétaire"
                          className="w-full p-5 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-800 rounded-2xl font-black text-brand-900 dark:text-white outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                          value={
                            userProfile.preferences?.currencyPosition || "after"
                          }
                          onChange={(e) =>
                            handlePreferenceChange(
                              "currencyPosition",
                              e.target.value,
                            )
                          }
                        >
                          <option value="after">
                            Après le montant (100 €)
                          </option>
                          <option value="before">
                            Avant le montant (€ 100)
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-widest mb-3">
                          Mode d'arrondi
                        </label>
                        <select
                          aria-label="Mode d'arrondi"
                          className="w-full p-5 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-800 rounded-2xl font-black text-brand-900 dark:text-white outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                          value={
                            userProfile.preferences?.roundingMode || "nearest"
                          }
                          onChange={(e) =>
                            handlePreferenceChange(
                              "roundingMode",
                              e.target.value,
                            )
                          }
                        >
                          <option value="nearest">
                            Au plus proche (Standard)
                          </option>
                          <option value="up">Supérieur (Plafond)</option>
                          <option value="down">Inférieur (Plancher)</option>
                          <option value="none">Aucun (Précis)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-8 border-t border-brand-50 dark:border-brand-800">
                    <h4 className="text-sm font-black text-brand-900 dark:text-white uppercase tracking-widest mb-6">
                      Outils de Vérification
                    </h4>
                    <div className="p-8 bg-brand-50 dark:bg-brand-800/30 rounded-[2.5rem] border border-brand-100 dark:border-brand-800 shadow-inner">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                          <p className="text-lg font-black text-brand-900 dark:text-white tracking-tight">
                            Vérificateur de SIRET
                          </p>
                          <p className="text-xs text-brand-400 font-medium mt-1">
                            Vérifier l'existence légale via l'API Sirene (INSEE)
                            pour pré-remplir vos coordonnées.
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="px-6 py-3 bg-white dark:bg-brand-900 rounded-2xl border border-brand-100 dark:border-brand-800 font-mono text-base font-black text-brand-900 dark:text-white shadow-sm">
                            {userProfile.siret || "Non renseigné"}
                          </div>
                          <button
                            onClick={checkSiret}
                            disabled={
                              siretStatus === "checking" || !userProfile.siret
                            }
                            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${siretStatus === "valid" ? "bg-emerald-500 text-white shadow-emerald-500/20" : siretStatus === "invalid" ? "bg-red-500 text-white shadow-red-500/20" : siretStatus === "checking" ? "bg-brand-400 text-white cursor-not-allowed" : "bg-brand-900 text-white hover:bg-brand-950 shadow-brand-900/20 active:scale-95"}`}
                          >
                            {siretStatus === "checking" ? (
                              <>
                                <RefreshCw size={14} className="animate-spin" />
                                Vérification...
                              </>
                            ) : siretStatus === "valid" ? (
                              <>
                                <CheckCircle2 size={14} />
                                Valide !
                              </>
                            ) : siretStatus === "invalid" ? (
                              <>
                                <AlertCircle size={14} />
                                Inexistant
                              </>
                            ) : (
                              <>
                                <Search size={14} />
                                Vérifier l'Existence Légale
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-8 border-t border-brand-50 dark:border-brand-800">
                    <h4 className="text-sm font-black text-brand-900 dark:text-white uppercase tracking-widest mb-6">
                      Automatisation & Notifications
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between p-6 bg-brand-50/50 dark:bg-brand-800/50 rounded-4xl border border-brand-100 dark:border-brand-800 hover:border-brand-200 dark:hover:border-brand-700 transition-all group">
                        <div className="flex gap-5 items-center">
                          <div className="p-3 bg-white dark:bg-brand-700 rounded-2xl text-brand-600 dark:text-brand-400 shadow-sm group-hover:scale-110 transition-transform">
                            <SaveIcon size={20} />
                          </div>
                          <div>
                            <p className="text-base font-black text-brand-900 dark:text-white tracking-tight">
                              Sauvegarde automatique
                            </p>
                            <p className="text-xs text-brand-400 font-medium">
                              Enregistrer les modifications en temps réel
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handlePreferenceChange(
                              "autoSave",
                              !userProfile.preferences?.autoSave,
                            )
                          }
                          aria-label="Sauvegarde automatique"
                          className={`w-14 h-7 rounded-full relative transition-all ${userProfile.preferences?.autoSave ? "bg-brand-900" : "bg-brand-200 dark:bg-brand-700"}`}
                        >
                          <div
                            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${userProfile.preferences?.autoSave ? "right-1" : "left-1"}`}
                          ></div>
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-brand-50/50 dark:bg-brand-800/50 rounded-4xl border border-brand-100 dark:border-brand-800 hover:border-brand-200 dark:hover:border-brand-700 transition-all group">
                        <div className="flex gap-5 items-center">
                          <div className="p-3 bg-white dark:bg-brand-700 rounded-2xl text-brand-600 dark:text-brand-400 shadow-sm group-hover:scale-110 transition-transform">
                            <Bell size={20} />
                          </div>
                          <div>
                            <p className="text-base font-black text-brand-900 dark:text-white tracking-tight">
                              Notifications système
                            </p>
                            <p className="text-xs text-brand-400 font-medium">
                              Activer les alertes et rappels visuels
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handlePreferenceChange(
                              "notificationsEnabled",
                              !userProfile.preferences?.notificationsEnabled,
                            )
                          }
                          aria-label="Notifications système"
                          className={`w-14 h-7 rounded-full relative transition-all ${userProfile.preferences?.notificationsEnabled ? "bg-brand-900" : "bg-brand-200 dark:bg-brand-700"}`}
                        >
                          <div
                            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${userProfile.preferences?.notificationsEnabled ? "right-1" : "left-1"}`}
                          ></div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-8 animate-slide-up">
              {/* Data Stats Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-pastel-blue/30 dark:bg-brand-900 p-6 rounded-4xl border border-white/50 dark:border-brand-800 shadow-xl shadow-brand-900/5 text-center group hover:scale-105 transition-all backdrop-blur-sm">
                  <p className="text-[10px] font-black text-vibrant-blue dark:text-brand-500 uppercase tracking-widest mb-2">
                    Factures
                  </p>
                  <p className="text-3xl font-black text-blue-950 dark:text-white font-display tracking-tighter">
                    {allData.invoices.length}
                  </p>
                </div>
                <div className="bg-pastel-purple/30 dark:bg-brand-900 p-6 rounded-4xl border border-white/50 dark:border-brand-800 shadow-xl shadow-brand-900/5 text-center group hover:scale-105 transition-all backdrop-blur-sm">
                  <p className="text-[10px] font-black text-vibrant-purple dark:text-brand-500 uppercase tracking-widest mb-2">
                    Clients
                  </p>
                  <p className="text-3xl font-black text-purple-950 dark:text-white font-display tracking-tighter">
                    {allData.clients.length}
                  </p>
                </div>
                <div className="bg-pastel-yellow/30 dark:bg-brand-900 p-6 rounded-4xl border border-white/50 dark:border-brand-800 shadow-xl shadow-brand-900/5 text-center group hover:scale-105 transition-all backdrop-blur-sm">
                  <p className="text-[10px] font-black text-vibrant-amber dark:text-brand-500 uppercase tracking-widest mb-2">
                    Produits
                  </p>
                  <p className="text-3xl font-black text-amber-950 dark:text-white font-display tracking-tighter">
                    {allData.products.length}
                  </p>
                </div>
                <div className="bg-pastel-green/30 dark:bg-brand-900 p-6 rounded-4xl border border-white/50 dark:border-brand-800 shadow-xl shadow-brand-900/5 text-center group hover:scale-105 transition-all backdrop-blur-sm">
                  <p className="text-[10px] font-black text-vibrant-emerald dark:text-brand-500 uppercase tracking-widest mb-2">
                    Dépenses
                  </p>
                  <p className="text-3xl font-black text-emerald-950 dark:text-white font-display tracking-tighter">
                    {allData.expenses.length}
                  </p>
                </div>
              </div>

              <div className="bg-pastel-orange/30 dark:bg-brand-900 p-8 rounded-[2.5rem] border border-white/50 dark:border-brand-800 shadow-xl shadow-brand-900/5 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-100/50 dark:border-brand-800 pb-6">
                  <div className="p-3 bg-white/60 dark:bg-brand-800 text-vibrant-orange dark:text-brand-400 rounded-2xl shadow-sm">
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-brand-900 dark:text-white font-display tracking-tight">
                      Sauvegarde & Maintenance
                    </h3>
                    <p className="text-[10px] text-brand-500 font-bold uppercase tracking-widest mt-0.5">
                      Gérez l'intégrité de vos données
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                      Exporter les données
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleExportAll}
                        className="flex-1 flex items-center justify-center gap-2 p-4 bg-brand-900 dark:bg-brand-800 text-white rounded-2xl hover:bg-brand-950 dark:hover:bg-brand-700 transition-all font-black text-xs shadow-lg shadow-brand-900/20 active:scale-95"
                      >
                        <FileJson size={16} /> JSON
                      </button>
                      <button
                        onClick={handleExportCSV}
                        className="flex-1 flex items-center justify-center gap-2 p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-500 transition-all font-black text-xs shadow-lg shadow-emerald-600/20 active:scale-95"
                      >
                        <Table size={16} /> CSV
                      </button>
                      <button
                        onClick={handleExportSQL}
                        className="flex-1 flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all font-black text-xs shadow-lg shadow-blue-600/20 active:scale-95"
                      >
                        <Database size={16} /> SQL
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                      Importer des données
                    </label>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-800 text-brand-700 dark:text-brand-300 rounded-2xl hover:bg-brand-50 dark:hover:bg-brand-800 transition-all font-black text-xs shadow-sm active:scale-95"
                    >
                      <Upload size={16} /> Importer (JSON, SQL, CSV/ZIP)
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      aria-label="Importer des données"
                      className="hidden"
                      accept=".json,.sql,.zip,.csv"
                      onChange={handleImportAll}
                    />
                  </div>
                </div>

                <div className="p-8 bg-amber-50 dark:bg-amber-900/20 rounded-4xl border border-amber-100 dark:border-amber-900/30 mb-8">
                  <div className="flex gap-5">
                    <div className="p-3 bg-white dark:bg-brand-900 rounded-2xl text-amber-600 dark:text-amber-500 h-fit shadow-sm">
                      <ShieldAlert size={24} />
                    </div>
                    <div>
                      <p className="text-lg font-black text-amber-900 dark:text-amber-400 tracking-tight mb-1">
                        Sécurité des données
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-500/80 leading-relaxed font-medium">
                        Vos données sont stockées localement dans votre
                        navigateur. Elles ne sont jamais envoyées sur un serveur
                        externe. Pensez à faire des exports réguliers pour
                        éviter toute perte en cas de suppression de l'historique
                        de votre navigateur.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-brand-50 dark:border-brand-800 pt-8">
                  <p className="text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-widest mb-6">
                    Zone de Danger
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button
                      onClick={generateSampleData}
                      className="flex items-center justify-center gap-3 p-5 bg-brand-50 dark:bg-brand-800/50 text-brand-700 dark:text-brand-300 rounded-2xl hover:bg-brand-100 dark:hover:bg-brand-700 transition-all text-xs font-black uppercase tracking-widest active:scale-95"
                    >
                      <RefreshCw size={18} /> Générer des données de test
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Êtes-vous sûr de vouloir effacer TOUTES vos données ? Cette action est irréversible.",
                          )
                        ) {
                          setAllData.setInvoices([]);
                          setAllData.setClients([]);
                          setAllData.setSuppliers([]);
                          setAllData.setProducts([]);
                          setAllData.setExpenses([]);
                          alert("Toutes les données ont été effacées.");
                        }
                      }}
                      className="flex items-center justify-center gap-3 p-5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-all text-xs font-black uppercase tracking-widest active:scale-95 border border-red-100 dark:border-red-900/30"
                    >
                      <Trash2 size={18} /> Effacer toutes les données
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "communications" && (
            <div className="space-y-8 animate-slide-up">
              <div className="bg-pastel-orange/30 dark:bg-brand-900 rounded-[2.5rem] p-8 shadow-xl shadow-brand-900/5 border border-white/50 dark:border-brand-800 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-100/50 dark:border-brand-800 pb-6">
                  <div className="p-3 bg-white/60 dark:bg-brand-800 text-vibrant-orange dark:text-brand-400 rounded-2xl shadow-sm">
                    <Send size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-brand-900 dark:text-white font-display tracking-tight">
                      Emails & Communications
                    </h3>
                    <p className="text-[10px] text-brand-500 font-bold uppercase tracking-widest mt-0.5">
                      Personnalisez vos envois
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="p-8 bg-white dark:bg-brand-800/50 rounded-[2.5rem] border border-brand-100 dark:border-brand-800 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-2xl text-orange-600 dark:text-orange-400">
                          <Mail size={28} />
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-brand-900 dark:text-white tracking-tight">
                            Configuration d'Expédition
                          </h4>
                          <p className="text-xs text-brand-400 font-medium mt-1">
                            Gérez comment vos clients voient vos emails.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-3">
                            Nom de l'expéditeur
                          </label>
                          <input
                            type="text"
                            placeholder={userProfile.companyName}
                            className="w-full p-4 bg-brand-50/50 dark:bg-brand-900 border border-brand-100 dark:border-brand-800 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-sm"
                            value={
                              userProfile.integrations?.emailSettings
                                ?.senderName || ""
                            }
                            onChange={(e) =>
                              handleChange("integrations", {
                                ...userProfile.integrations,
                                emailSettings: {
                                  ...userProfile.integrations?.emailSettings,
                                  senderName: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-3">
                            Email de réponse (Reply-To)
                          </label>
                          <input
                            type="email"
                            placeholder={userProfile.email}
                            className="w-full p-4 bg-brand-50/50 dark:bg-brand-900 border border-brand-100 dark:border-brand-800 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-sm"
                            value={
                              userProfile.integrations?.emailSettings
                                ?.replyTo || ""
                            }
                            onChange={(e) =>
                              handleChange("integrations", {
                                ...userProfile.integrations,
                                emailSettings: {
                                  ...userProfile.integrations?.emailSettings,
                                  replyTo: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-3">
                            Copie invisible (BCC)
                          </label>
                          <input
                            type="email"
                            placeholder="votre-archive@email.com"
                            className="w-full p-4 bg-brand-50/50 dark:bg-brand-900 border border-brand-100 dark:border-brand-800 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-sm"
                            value={
                              userProfile.integrations?.emailSettings
                                ?.bccEmail || ""
                            }
                            onChange={(e) =>
                              handleChange("integrations", {
                                ...userProfile.integrations,
                                emailSettings: {
                                  ...userProfile.integrations?.emailSettings,
                                  bccEmail: e.target.value,
                                },
                              })
                            }
                          />
                          <p className="mt-3 text-[10px] text-brand-400 italic">
                            Recevez systématiquement une copie de vos envois
                            pour vos archives personnelles.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-brand-50 dark:bg-brand-800/50 rounded-3xl border border-brand-100 dark:border-brand-800">
                      <div className="flex items-center gap-3 mb-4">
                        <LockIcon size={18} className="text-brand-400" />
                        <h5 className="text-sm font-black text-brand-900 dark:text-white uppercase tracking-widest">
                          Serveur d'envoi (SMTP)
                        </h5>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          {
                            id: "internal",
                            name: "Service Inclus",
                            desc: "Serveur sécurisé",
                          },
                          {
                            id: "gmail",
                            name: "Gmail",
                            desc: "Via Google OAuth",
                          },
                          {
                            id: "custom_smtp",
                            name: "Serveur Pro",
                            desc: "Config manuelle",
                          },
                        ].map((provider) => (
                          <button
                            key={provider.id}
                            onClick={() =>
                              handleChange("integrations", {
                                ...userProfile.integrations,
                                emailSettings: {
                                  ...userProfile.integrations?.emailSettings,
                                  provider: provider.id as any,
                                },
                              })
                            }
                            className={`p-4 rounded-2xl border-2 transition-all text-left ${userProfile.integrations?.emailSettings?.provider === provider.id ? "border-orange-500 bg-white dark:bg-brand-900 shadow-md" : "border-transparent bg-white/50 dark:bg-brand-800 hover:border-brand-200"}`}
                          >
                            <p className="text-xs font-black text-brand-900 dark:text-white uppercase">
                              {provider.name}
                            </p>
                            <p className="text-[10px] text-brand-400 font-medium mt-1">
                              {provider.desc}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                      Signature d'email par défaut
                    </label>
                    <div className="relative">
                      <PenTool
                        className="absolute left-4 top-4 text-brand-300"
                        size={18}
                      />
                      <textarea
                        className="w-full pl-12 p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-medium text-sm min-h-30"
                        value={userProfile.preferences?.emailSignature || ""}
                        onChange={(e) =>
                          handlePreferenceChange(
                            "emailSignature",
                            e.target.value,
                          )
                        }
                        placeholder="Cordialement,&#10;Mon Entreprise&#10;01 23 45 67 89"
                      />
                    </div>
                  </div>

                  <div className="border-t border-brand-100/50 dark:border-brand-800 pt-8">
                    <h4 className="text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-widest mb-6">
                      Modèles d'emails
                    </h4>

                    <div className="space-y-6">
                      <div className="p-6 bg-white dark:bg-brand-800/50 rounded-4xl border border-brand-100 dark:border-brand-800">
                        <div className="flex items-center gap-3 mb-4">
                          <FileText size={18} className="text-blue-500" />
                          <h5 className="font-black text-brand-900 dark:text-white">
                            Envoi de Facture
                          </h5>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                              Objet
                            </label>
                            <input
                              type="text"
                              aria-label="Objet de l'email de facture"
                              className="w-full p-3 bg-brand-50/50 border border-brand-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                              value={
                                userProfile.preferences?.invoiceEmailSubject ||
                                "Votre facture {{invoiceNumber}}"
                              }
                              onChange={(e) =>
                                handlePreferenceChange(
                                  "invoiceEmailSubject",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                              Message
                            </label>
                            <textarea
                              aria-label="Message de l'email de facture"
                              className="w-full p-3 bg-brand-50/50 border border-brand-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm min-h-25"
                              value={
                                userProfile.preferences?.invoiceEmailTemplate ||
                                "Bonjour,\n\nVeuillez trouver ci-joint la facture {{invoiceNumber}} d'un montant de {{total}}.\n\nMerci de votre confiance."
                              }
                              onChange={(e) =>
                                handlePreferenceChange(
                                  "invoiceEmailTemplate",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-white dark:bg-brand-800/50 rounded-4xl border border-brand-100 dark:border-brand-800">
                        <div className="flex items-center gap-3 mb-4">
                          <FileText size={18} className="text-purple-500" />
                          <h5 className="font-black text-brand-900 dark:text-white">
                            Envoi de Devis
                          </h5>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                              Objet
                            </label>
                            <input
                              type="text"
                              aria-label="Objet de l'email de devis"
                              className="w-full p-3 bg-brand-50/50 border border-brand-100 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm"
                              value={
                                userProfile.preferences?.quoteEmailSubject ||
                                "Votre devis {{quoteNumber}}"
                              }
                              onChange={(e) =>
                                handlePreferenceChange(
                                  "quoteEmailSubject",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                              Message
                            </label>
                            <textarea
                              aria-label="Message de l'email de devis"
                              className="w-full p-3 bg-brand-50/50 border border-brand-100 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm min-h-25"
                              value={
                                userProfile.preferences?.quoteEmailTemplate ||
                                "Bonjour,\n\nVeuillez trouver ci-joint le devis {{quoteNumber}} d'un montant de {{total}}.\n\nJe reste à votre disposition pour toute question."
                              }
                              onChange={(e) =>
                                handlePreferenceChange(
                                  "quoteEmailTemplate",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-white dark:bg-brand-800/50 rounded-4xl border border-brand-100 dark:border-brand-800">
                        <div className="flex items-center gap-3 mb-4">
                          <AlertTriangle size={18} className="text-red-500" />
                          <h5 className="font-black text-brand-900 dark:text-white">
                            Relance d'impayé
                          </h5>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                              Objet
                            </label>
                            <input
                              type="text"
                              aria-label="Objet de l'email de relance"
                              className="w-full p-3 bg-brand-50/50 border border-brand-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
                              value={
                                userProfile.preferences?.reminderEmailSubject ||
                                "Relance : Facture {{invoiceNumber}} impayée"
                              }
                              onChange={(e) =>
                                handlePreferenceChange(
                                  "reminderEmailSubject",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                              Message
                            </label>
                            <textarea
                              aria-label="Message de l'email de relance"
                              className="w-full p-3 bg-brand-50/50 border border-brand-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm min-h-25"
                              value={
                                userProfile.preferences
                                  ?.reminderEmailTemplate ||
                                "Bonjour,\n\nSauf erreur ou omission de notre part, la facture {{invoiceNumber}} d'un montant de {{total}} arrivée à échéance le {{dueDate}} reste impayée.\n\nMerci de procéder au règlement dans les plus brefs délais."
                              }
                              onChange={(e) =>
                                handlePreferenceChange(
                                  "reminderEmailTemplate",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] text-brand-400 font-medium italic">
                        Variables disponibles : {"{{invoiceNumber}}"},{" "}
                        {"{{total}}"}, {"{{dueDate}}"}, {"{{clientName}}"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-8 animate-slide-up">
              {/* AI & API Section */}
              <div className="bg-pastel-pink/30 dark:bg-brand-900 rounded-[2.5rem] p-8 shadow-xl shadow-brand-900/5 border border-white/50 dark:border-brand-800 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-100/50 dark:border-brand-800 pb-6">
                  <div className="p-3 bg-white/60 dark:bg-brand-800 text-vibrant-pink dark:text-brand-400 rounded-2xl shadow-sm">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-brand-900 dark:text-white font-display tracking-tight">
                      Assistant IA & API
                    </h3>
                    <p className="text-[10px] text-brand-500 font-bold uppercase tracking-widest mt-0.5">
                      Boostez votre productivité avec l'IA
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-3">
                      Clé API Google Gemini
                    </label>
                    <div className="relative group">
                      <LockIcon
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-300 dark:text-brand-600 group-focus-within:text-pink-500 transition-colors"
                        size={18}
                      />
                      <input
                        type="password"
                        aria-label="Clé API Google Gemini"
                        className="w-full pl-14 p-5 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-800 rounded-2xl font-mono text-sm outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all"
                        value={userProfile.geminiApiKey || ""}
                        onChange={(e) =>
                          handleChange("geminiApiKey", e.target.value)
                        }
                        placeholder="AIzaSy..."
                      />
                    </div>
                    <p className="text-[10px] text-brand-400 mt-3 font-medium flex items-center gap-2">
                      <Info size={12} />
                      Nécessaire pour l'IA. Obtenez votre clé sur{" "}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 dark:text-pink-400 font-bold hover:underline"
                      >
                        Google AI Studio
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Cloud Backup & Legality */}
              <div className="bg-pastel-blue/30 dark:bg-brand-900 rounded-[2.5rem] p-8 shadow-xl shadow-brand-900/5 border border-white/50 dark:border-brand-800 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-100/50 dark:border-brand-800 pb-6">
                  <div className="p-3 bg-white/60 dark:bg-brand-800 text-vibrant-blue dark:text-brand-400 rounded-2xl shadow-sm">
                    <HardDrive size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-brand-900 dark:text-white font-display tracking-tight">
                      Connecteurs Cloud & Archivage
                    </h3>
                    <p className="text-[10px] text-brand-500 font-bold uppercase tracking-widest mt-0.5">
                      Conservation légale 10 ans (RGPD)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Google Gemini / Assistant IA */}
                  <div className="xl:col-span-2 p-8 bg-white dark:bg-brand-800/50 rounded-[2.5rem] border border-brand-100 dark:border-brand-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[100px] -mr-32 -mt-32"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400">
                            <Sparkles size={28} />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-brand-900 dark:text-white tracking-tight">
                              Assistant IA Intelligence
                            </h4>
                            <p className="text-xs text-brand-400 font-medium mt-1">
                              Configurez votre moteur IA pour l'analyse et
                              l'assistance.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleChange("integrations", {
                              ...userProfile.integrations,
                              aiAssistant: {
                                ...userProfile.integrations?.aiAssistant,
                                isEnabled:
                                  !userProfile.integrations?.aiAssistant
                                    ?.isEnabled,
                              },
                            })
                          }
                          className={`w-14 h-7 rounded-full relative transition-all ${userProfile.integrations?.aiAssistant?.isEnabled ? "bg-emerald-600 shadow-xl shadow-emerald-600/20" : "bg-brand-200 dark:bg-brand-700"}`}
                        >
                          <div
                            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${userProfile.integrations?.aiAssistant?.isEnabled ? "right-1" : "left-1"}`}
                          ></div>
                        </button>
                      </div>

                      {userProfile.integrations?.aiAssistant?.isEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
                          <div className="space-y-6">
                            <div>
                              <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-3">
                                Fournisseur IA
                              </label>
                              <div className="grid grid-cols-3 gap-3">
                                {[
                                  {
                                    id: "google_gemini",
                                    name: "Gemini",
                                    icon: <Zap size={14} />,
                                  },
                                  {
                                    id: "openai",
                                    name: "OpenAI",
                                    icon: <Sparkles size={14} />,
                                  },
                                  {
                                    id: "anthropic",
                                    name: "Claude",
                                    icon: <FileSearch size={14} />,
                                  },
                                ].map((p) => (
                                  <button
                                    key={p.id}
                                    onClick={() =>
                                      handleChange("integrations", {
                                        ...userProfile.integrations,
                                        aiAssistant: {
                                          ...userProfile.integrations
                                            ?.aiAssistant,
                                          provider: p.id as any,
                                          model:
                                            p.id === "google_gemini"
                                              ? "gemini-1.5-flash"
                                              : p.id === "openai"
                                                ? "gpt-4o"
                                                : "claude-3-5-sonnet",
                                        },
                                      })
                                    }
                                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${userProfile.integrations?.aiAssistant?.provider === p.id ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "border-brand-100 dark:border-brand-800 text-brand-400 hover:border-brand-200"}`}
                                  >
                                    {p.icon}
                                    <span className="text-[10px] font-black uppercase tracking-tighter">
                                      {p.name}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div>
                              <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-3">
                                Clé API Secrète
                              </label>
                              <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300">
                                  <LockIcon size={18} />
                                </div>
                                <input
                                  type="password"
                                  placeholder={`Entrez votre clé ${userProfile.integrations?.aiAssistant?.provider === "google_gemini" ? "Google AI" : "API"}`}
                                  className="w-full pl-12 p-4 bg-brand-50/50 dark:bg-brand-900 border border-brand-100 dark:border-brand-800 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-mono text-xs"
                                  value={
                                    userProfile.integrations?.aiAssistant
                                      ?.apiKey || ""
                                  }
                                  onChange={(e) =>
                                    handleChange("integrations", {
                                      ...userProfile.integrations,
                                      aiAssistant: {
                                        ...userProfile.integrations
                                          ?.aiAssistant,
                                        apiKey: e.target.value,
                                      },
                                    })
                                  }
                                />
                              </div>
                              <p className="mt-3 text-[10px] text-brand-400 italic">
                                La clé est stockée localement dans votre
                                navigateur et n'est jamais transmise à nos
                                serveurs.
                              </p>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-3">
                                Modèle (Optionnel)
                              </label>
                              <input
                                type="text"
                                className="w-full p-4 bg-brand-50/50 dark:bg-brand-900 border border-brand-100 dark:border-brand-800 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-mono text-xs"
                                value={
                                  userProfile.integrations?.aiAssistant
                                    ?.model || ""
                                }
                                placeholder="ex: gemini-1.5-pro, gpt-4-turbo"
                                onChange={(e) =>
                                  handleChange("integrations", {
                                    ...userProfile.integrations,
                                    aiAssistant: {
                                      ...userProfile.integrations?.aiAssistant,
                                      model: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start justify-between p-6 bg-white dark:bg-brand-800/50 rounded-4xl border border-brand-100 dark:border-brand-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all group">
                    <div className="flex gap-5">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 shadow-sm group-hover:scale-110 transition-transform">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <p className="text-base font-black text-brand-900 dark:text-white tracking-tight">
                          Auto-Backup Légal
                        </p>
                        <p className="text-xs text-brand-400 font-medium leading-relaxed mt-1">
                          Envoi automatique de chaque facture vers un
                          coffre-fort numérique.
                        </p>
                        <div className="flex gap-2 mt-4">
                          {["Google Drive", "Dropbox", "Digiposte"].map((p) => (
                            <span
                              key={p}
                              className="px-2 py-1 bg-brand-50 dark:bg-brand-800 rounded-lg text-[9px] font-bold text-brand-500 uppercase"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleChange("integrations", {
                          ...userProfile.integrations,
                          autoBackup: {
                            ...userProfile.integrations?.autoBackup,
                            enabled:
                              !userProfile.integrations?.autoBackup?.enabled,
                          },
                        })
                      }
                      title="Activer l'auto-backup légal"
                      aria-label="Activer l'auto-backup légal"
                      className={`w-14 h-7 rounded-full relative shrink-0 transition-all ${userProfile.integrations?.autoBackup?.enabled ? "bg-blue-600" : "bg-brand-200 dark:bg-brand-700"}`}
                    >
                      <div
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${userProfile.integrations?.autoBackup?.enabled ? "right-1" : "left-1"}`}
                      ></div>
                    </button>
                  </div>

                  <div className="flex items-start justify-between p-6 bg-white dark:bg-brand-800/50 rounded-4xl border border-brand-100 dark:border-brand-800 hover:border-emerald-200 dark:hover:border-emerald-900 transition-all group">
                    <div className="flex gap-5">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400 shadow-sm group-hover:scale-110 transition-transform">
                        <FileSearch size={24} />
                      </div>
                      <div>
                        <p className="text-base font-black text-brand-900 dark:text-white tracking-tight">
                          Import de Dépenses (IA)
                        </p>
                        <p className="text-xs text-brand-400 font-medium leading-relaxed mt-1">
                          Scannez un dossier cloud pour créer vos dépenses
                          automatiquement.
                        </p>
                        <button className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-600 hover:underline">
                          <Settings size={14} /> Configurer le dossier "Watch"
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleChange("integrations", {
                          ...userProfile.integrations,
                          expenseImport: {
                            ...userProfile.integrations?.expenseImport,
                            dropboxWatchEnabled:
                              !userProfile.integrations?.expenseImport
                                ?.dropboxWatchEnabled,
                          },
                        })
                      }
                      title="Activer l'import de dépenses IA"
                      aria-label="Activer l'import de dépenses IA"
                      className={`w-14 h-7 rounded-full relative shrink-0 transition-all ${userProfile.integrations?.expenseImport?.dropboxWatchEnabled ? "bg-emerald-600" : "bg-brand-200 dark:bg-brand-700"}`}
                    >
                      <div
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${userProfile.integrations?.expenseImport?.dropboxWatchEnabled ? "right-1" : "left-1"}`}
                      ></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Productivity: Calendar & CRM */}
              <div className="bg-pastel-yellow/30 dark:bg-brand-900 rounded-[2.5rem] p-8 shadow-xl shadow-brand-900/5 border border-white/50 dark:border-brand-800 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-100/50 dark:border-brand-800 pb-6">
                  <div className="p-3 bg-white/60 dark:bg-brand-800 text-vibrant-amber dark:text-brand-400 rounded-2xl shadow-sm">
                    <CalendarDays size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-brand-900 dark:text-white font-display tracking-tight">
                      Productivité : Calendrier & CRM
                    </h3>
                    <p className="text-[10px] text-brand-500 font-bold uppercase tracking-widest mt-0.5">
                      Automatisez vos fiches clients et factures
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-white dark:bg-brand-800/50 rounded-4xl border border-brand-100 dark:border-brand-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users size={20} className="text-brand-600" />
                        <h4 className="font-black text-brand-900 dark:text-white">
                          Récupération Prospect
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <Linkedin size={16} className="text-blue-700" />
                        <ExternalLink size={16} className="text-brand-300" />
                      </div>
                    </div>
                    <p className="text-xs text-brand-400 font-medium">
                      Créez une fiche client instantanément depuis LinkedIn ou
                      Salesforce (Import auto du logo et coordonnées).
                    </p>
                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-2 bg-brand-50 dark:bg-brand-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-600 hover:bg-brand-100 transition-all">
                        LinkedIn
                      </button>
                      <button className="flex-1 px-4 py-2 bg-brand-50 dark:bg-brand-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-600 hover:bg-brand-100 transition-all">
                        Salesforce
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-white dark:bg-brand-800/50 rounded-4xl border border-brand-100 dark:border-brand-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar size={20} className="text-vibrant-amber" />
                        <h4 className="font-black text-brand-900 dark:text-white">
                          Sync Google Calendar
                        </h4>
                      </div>
                      <button
                        onClick={() =>
                          handleChange("integrations", {
                            ...userProfile.integrations,
                            calendarSync: {
                              ...userProfile.integrations?.calendarSync,
                              googleCalendarEnabled:
                                !userProfile.integrations?.calendarSync
                                  ?.googleCalendarEnabled,
                            },
                          })
                        }
                        title="Activer la synchronisation Google Calendar"
                        aria-label="Activer la synchronisation Google Calendar"
                        className={`w-12 h-6 rounded-full relative transition-all ${userProfile.integrations?.calendarSync?.googleCalendarEnabled ? "bg-vibrant-amber" : "bg-brand-200 dark:bg-brand-700"}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${userProfile.integrations?.calendarSync?.googleCalendarEnabled ? "right-1" : "left-1"}`}
                        ></div>
                      </button>
                    </div>
                    <p className="text-xs text-brand-400 font-medium leading-relaxed">
                      Transformez vos rendez-vous en sessions de facturations en
                      1 clic (ex: "Séance photo 2h").
                    </p>
                    <div className="bg-brand-50 dark:bg-brand-800/50 p-4 rounded-2xl flex items-center justify-between border border-dashed border-brand-200">
                      <span className="text-[10px] font-bold text-brand-500 uppercase">
                        Prochain RDV :
                      </span>
                      <span className="text-[10px] font-black text-brand-900 dark:text-white">
                        Consulting (14:00) ⚡
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="xl:col-span-1">
          <div className="sticky top-10">
            <div className="flex items-center justify-between mb-6 px-4">
              <h4 className="text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-[0.3em]">
                Aperçu Facture
              </h4>
              <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                En direct
              </div>
            </div>

            <div
              ref={previewRef}
              className="bg-white dark:bg-brand-900 p-10 rounded-[3rem] shadow-2xl shadow-brand-900/10 border border-brand-100 dark:border-brand-800 min-h-150 flex flex-col relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-40 h-40 rounded-bl-[6rem] -mr-12 -mt-12 opacity-10 dark:opacity-20 blur-2xl group-hover:scale-110 transition-transform duration-700 bg-(--preview-accent)"></div>

              {/* Fake Header */}
              <div className="border-b border-brand-50 dark:border-brand-800 pb-10 mb-10 relative z-10">
                {userProfile.logoUrl ? (
                  <div className="mb-8 h-16 flex items-center justify-start">
                    <img
                      src={userProfile.logoUrl}
                      alt="Logo"
                      className="max-h-full max-w-50 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-white mb-8 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500 bg-(--preview-accent) shadow-(--preview-shadow)">
                    <span className="font-black text-3xl">
                      {userProfile.companyName.charAt(0)}
                    </span>
                  </div>
                )}
                <h2 className="font-black text-brand-900 dark:text-white text-2xl leading-tight mb-2 font-display tracking-tighter">
                  {userProfile.companyName || "Votre Entreprise"}
                </h2>
                {userProfile.professionalTitle && (
                  <p className="text-[10px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-[0.2em] mb-4">
                    {userProfile.professionalTitle}
                  </p>
                )}

                <div className="space-y-2 mt-6">
                  <div className="flex items-center gap-3 text-xs text-brand-500 dark:text-brand-400 font-medium">
                    <div className="p-1.5 bg-brand-50 dark:bg-brand-800 rounded-lg text-brand-300 dark:text-brand-600">
                      <Mail size={12} />
                    </div>{" "}
                    {userProfile.email || "email@exemple.com"}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-brand-500 dark:text-brand-400 font-medium">
                    <div className="p-1.5 bg-brand-50 dark:bg-brand-800 rounded-lg text-brand-300 dark:text-brand-600">
                      <Phone size={12} />
                    </div>{" "}
                    {userProfile.phone || "01 02 03 04 05"}
                  </div>
                  {userProfile.website && (
                    <div className="flex items-center gap-3 text-xs font-black text-(--preview-accent)">
                      <div className="p-1.5 bg-brand-50 dark:bg-brand-800 rounded-lg opacity-50 text-(--preview-accent)">
                        <Globe size={12} />
                      </div>{" "}
                      {userProfile.website}
                    </div>
                  )}
                </div>
              </div>

              {/* Fake Content */}
              <div className="space-y-6 opacity-20 dark:opacity-10 mb-auto">
                <div className="flex justify-between items-end">
                  <div className="space-y-3">
                    <div className="h-5 bg-brand-200 dark:bg-brand-700 rounded-full w-40"></div>
                    <div className="h-4 bg-brand-100 dark:bg-brand-800 rounded-full w-28"></div>
                  </div>
                  <div className="h-12 bg-brand-100 dark:bg-brand-800 rounded-2xl w-28 border border-brand-200 dark:border-brand-700"></div>
                </div>
                <div className="h-40 bg-brand-50/50 dark:bg-brand-800/30 rounded-4xl w-full border-2 border-brand-100 dark:border-brand-800 border-dashed"></div>
                <div className="space-y-4">
                  <div className="h-3 bg-brand-100 dark:bg-brand-800 rounded-full w-full"></div>
                  <div className="h-3 bg-brand-100 dark:bg-brand-800 rounded-full w-5/6"></div>
                  <div className="h-3 bg-brand-100 dark:bg-brand-800 rounded-full w-4/6"></div>
                </div>
              </div>

              {/* Fake Footer */}
              <div className="mt-12 pt-8 border-t border-brand-50 dark:border-brand-800 text-[10px] text-center text-brand-400 dark:text-brand-500 leading-relaxed">
                <p className="font-black text-brand-900 dark:text-white mb-2 uppercase tracking-[0.2em]">
                  {userProfile.companyName}
                </p>
                <p className="max-w-60 mx-auto font-medium">
                  {userProfile.address}
                </p>
                <div className="flex items-center justify-center gap-4 mt-4 font-black text-brand-500 dark:text-brand-400">
                  <span className="px-2 py-1 bg-brand-50 dark:bg-brand-800 rounded-md">
                    SIRET: {userProfile.siret}
                  </span>
                  {userProfile.tvaNumber && (
                    <span className="px-2 py-1 bg-brand-50 dark:bg-brand-800 rounded-md">
                      TVA: {userProfile.tvaNumber}
                    </span>
                  )}
                </div>
                {!userProfile.tvaNumber && (
                  <p className="mt-3 italic font-medium">
                    TVA non applicable, art. 293 B du CGI
                  </p>
                )}
                {userProfile.legalMentions && (
                  <p className="mt-4 text-[9px] opacity-60 italic leading-tight font-medium">
                    {userProfile.legalMentions}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4 text-blue-600 dark:text-blue-400 bg-white dark:bg-brand-900 p-5 rounded-3xl border border-brand-100 dark:border-brand-800 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-900/5 transition-all">
              {showSaveIndicator ? (
                <>
                  <div className="p-1.5 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 size={14} className="animate-pulse" />
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Modifications enregistrées
                  </span>
                </>
              ) : (
                <>
                  <div className="p-1.5 bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/20">
                    <Save size={14} />
                  </div>
                  <span>Sauvegarde automatique</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;

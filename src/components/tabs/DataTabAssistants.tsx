import React from "react";
import { Download, Archive, User } from "lucide-react";
import type { Invoice, Client } from "../../types";

export const RenderArchiveAssistant = ({
  archiveConfirm,
  setArchiveConfirm,
  prepareArchive,
  confirmArchive,
}: {
  archiveConfirm: Invoice[] | null;
  setArchiveConfirm: (v: Invoice[] | null) => void;
  prepareArchive: () => void;
  confirmArchive: () => void;
}) => {
  if (archiveConfirm) {
    return (
      <div className="sm:col-span-2 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl space-y-3">
        <div className="flex items-start gap-2">
          <Archive
            size={16}
            className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
          />
          <div>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
              {archiveConfirm.length} facture(s) de plus de 10 ans
            </p>
            <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
              Un fichier JSON sera téléchargé pour conservation légale
              (art.&nbsp;L110-4 C.com.), puis ces factures seront retirées de
              l'application.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setArchiveConfirm(null)}
            className="px-3 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-600 rounded-xl hover:bg-brand-50"
          >
            Annuler
          </button>
          <button
            onClick={confirmArchive}
            className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download size={12} /> Exporter et archiver
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={prepareArchive}
      className="p-4 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-700 rounded-2xl hover:bg-brand-100 transition-all text-left"
    >
      <p className="text-xs font-bold text-brand-900 dark:text-white">
        Archiver (10 ans+)
      </p>
      <p className="text-[9px] text-brand-400 mt-1 uppercase tracking-tighter">
        Conformité RGPD / Fiscale
      </p>
    </button>
  );
};

export interface MergeGroup {
  keep: { id: string; name: string };
  duplicates: Array<{ id: string; name: string }>;
  invoiceCount: number;
  diffs: string[];
}

export interface MergeConfirmState {
  groups: MergeGroup[];
  toKeep: Client[];
  updatedInvoices: Invoice[];
}

export const RenderMergeAssistant = ({
  mergeConfirm,
  setMergeConfirm,
  prepareMerge,
  confirmMerge,
}: {
  mergeConfirm: MergeConfirmState | null;
  setMergeConfirm: (v: MergeConfirmState | null) => void;
  prepareMerge: () => void;
  confirmMerge: () => void;
}) => {
  if (mergeConfirm) {
    return (
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl space-y-3">
        <div className="flex items-start gap-2">
          <User
            size={16}
            className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
          />
          <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
            {mergeConfirm.groups.length} groupe(s) —{" "}
            {mergeConfirm.groups.reduce(
              (acc, g) => acc + g.duplicates.length,
              0,
            )}{" "}
            client(s)
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setMergeConfirm(null)}
            className="px-3 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-600 rounded-xl hover:bg-brand-50"
          >
            Annuler
          </button>
          <button
            onClick={confirmMerge}
            className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors"
          >
            Confirmer la fusion
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={prepareMerge}
      className="w-full flex items-center justify-between p-4 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-700 rounded-2xl hover:bg-brand-100 transition-all group"
    >
      <div className="text-left">
        <p className="text-sm font-bold text-brand-900 dark:text-white">
          Clients en doublon
        </p>
        <p className="text-[10px] text-brand-400 mt-0.5">
          Fusionner par nom identique
        </p>
      </div>
      <User
        size={16}
        className="text-brand-300 group-hover:translate-x-1 transition-transform"
      />
    </button>
  );
};

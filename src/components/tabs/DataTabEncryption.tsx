import React from "react";
import { Eye, EyeOff, Lock, RefreshCw, Zap } from "lucide-react";

interface EncryptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  password: string;
  setPassword: (v: string) => void;
  confirm: string;
  setConfirm: (v: string) => void;
  isVisible: boolean;
  setVisible: (v: boolean) => void;
  isEncrypting: boolean;
  onEncrypt: () => void;
}

export const EncryptionModal: React.FC<EncryptionModalProps> = ({
  isOpen,
  onClose,
  password,
  setPassword,
  confirm,
  setConfirm,
  isVisible,
  setVisible,
  isEncrypting,
  onEncrypt,
}) => {
  if (!isOpen) return null;

  const matches = password === confirm && password.length >= 8;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-100 dark:bg-brand-900/40 rounded-2xl">
            <Lock className="text-brand-600 dark:text-brand-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Chiffrer l'export</h3>
            <p className="text-xs text-zinc-500">Ajouter une protection AES-256 à vos données</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5 font-sans">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1">Mot de passe (min. 8 car.)</label>
            <div className="relative">
              <input
                type={isVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 transition-all font-mono"
                placeholder="••••••••"
                autoFocus
                disabled={isEncrypting}
              />
              <button
                type="button"
                onClick={() => setVisible(!isVisible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1">Confirmer mot de passe</label>
            <input
              type={isVisible ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 transition-all font-mono"
              placeholder="••••••••"
              disabled={isEncrypting}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all"
            disabled={isEncrypting}
          >
            Annuler
          </button>
          <button
            onClick={onEncrypt}
            disabled={!matches || isEncrypting}
            className="flex-1 px-4 py-3 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isEncrypting ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <Zap size={16} />
            )}
            {isEncrypting ? "Chiffrement..." : "Chiffrer et Télécharger"}
          </button>
        </div>
      </div>
    </div>
  );
};

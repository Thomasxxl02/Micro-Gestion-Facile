import { create } from "zustand";
import type { LogEntry } from "../types";

interface LogStoreState {
  activityLogs: LogEntry[];
  addLog: (
    _action: string,
    _category: LogEntry["category"],
    _severity: LogEntry["severity"],
    _details?: string,
    _metadata?: Record<string, unknown>,
  ) => void;
  clearLogs: () => void;
  reset: () => void;
}

export const useLogStore = create<LogStoreState>()((set) => ({
  activityLogs: [],
  addLog: (action, category, severity, details = "", metadata = {}) =>
    set((state) => ({
      activityLogs: [
        ...state.activityLogs,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          action,
          category,
          severity,
          details,
          timestamp: Date.now(),
          metadata,
          device: navigator.userAgent.split(" ").slice(-2).join(" "), // Simple proxy for device
          // En production, l'IP serait gérée côté serveur
        },
      ].slice(-500), // Garde les 500 derniers logs
    })),
  clearLogs: () => set({ activityLogs: [] }),
  reset: () => set({ activityLogs: [] }),
}));

export default useLogStore;

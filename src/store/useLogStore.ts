import { create } from "zustand";
import type { LogEntry } from "../types";

interface LogStoreState {
  activityLogs: LogEntry[];
  addLog: (
    action: string,
    category: LogEntry["category"],
    severity: LogEntry["severity"],
    details?: string,
  ) => void;
  clearLogs: () => void;
  reset: () => void;
}

export const useLogStore = create<LogStoreState>()((set) => ({
  activityLogs: [],
  addLog: (action, category, severity, details = "") =>
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
        },
      ].slice(-500), // Garde les 500 derniers logs
    })),
  clearLogs: () => set({ activityLogs: [] }),
  reset: () => set({ activityLogs: [] }),
}));

export default useLogStore;

/**
 * useLogStore.ts
 * Dedicated store for activity logs
 *
 * Handles: audit trail, activity history
 * Consumed by: ActivityLogger, AuditView, LogViewer
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { LogEntry } from '../types';

export interface LogStoreState {
  // Activity Logs
  activityLogs: LogEntry[];
  addLog: (
    action: string,
    category: LogEntry['category'],
    severity: LogEntry['severity'],
    details?: string
  ) => void;
  clearLogs: () => void;

  // Reset
  reset: () => void;
}

export const useLogStore = create<LogStoreState>()(
  devtools(
    persist(
      (set) => ({
        // Activity Logs
        activityLogs: [],
        addLog: (action, category, severity, details) =>
          set((state) => ({
            activityLogs: [
              {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                action,
                category,
                severity,
                details: details || '',
              },
              ...state.activityLogs,
            ].slice(0, 50), // Keep only last 50 logs
          })),
        clearLogs: () => set({ activityLogs: [] }),

        // Reset
        reset: () =>
          set({
            activityLogs: [],
          }),
      }),
      {
        name: 'log-store',
        partialize: (state) => ({
          activityLogs: state.activityLogs,
        }),
      }
    )
  )
);

export default useLogStore;

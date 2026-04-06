/**
 * Store barrel exports
 * Phase 2.2: Store decomposition into 4 domain stores
 *
 * Import structure:
 * - Single store (all): import { useAppStore } from './store'
 * - Optimized (recommended): import { useDataStore, useUIStore } from './store'
 */

export { useAppStore, type AppStoreState } from './appStore';
export { useAuthStore, type AuthStoreState } from './useAuthStore';
export { useDataStore, type DataStoreState } from './useDataStore';
export { useLogStore, type LogStoreState } from './useLogStore';
export { useUIStore, type UIStoreState } from './useUIStore';

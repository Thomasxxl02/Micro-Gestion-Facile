/**
 * @deprecated Use zod-schemas.ts instead
 * This file is kept for backward compatibility during migration.
 * All new validation should use the centralized Zod schemas in zod-schemas.ts
 *
 * Migration guide:
 * - Replace: import { ClientSchema } from './schemas'
 * - With: import { ClientSchema } from './zod-schemas'
 */

// Re-export from zod-schemas for backward compatibility
export * from './zod-schemas';

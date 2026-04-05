// Barrel re-export — compatibilité descendante pour `from '../types'`
// Les types sont définis dans src/types/<module>.ts pour une meilleure maintenabilité
// Nouveaux fichiers : préférer `from '../types/invoice'` etc. pour des imports plus explicites
export * from './types/calendar';
export * from './types/client';
export * from './types/common';
export * from './types/email';
export * from './types/expense';
export * from './types/invoice';
export * from './types/product';
export * from './types/supplier';
export * from './types/user';

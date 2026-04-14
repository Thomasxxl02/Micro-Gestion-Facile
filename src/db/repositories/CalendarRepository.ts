/**
 * Repository pour les événements du calendrier
 *
 * Centralise tous les accès Dexie pour l'entité CalendarEvent.
 * Ref schéma : calendarEvents '&id, clientId, invoiceId, start, type'
 */

import type { CalendarEvent } from '../../types';
import { db } from '../invoiceDB';

export const calendarRepository = {
  /** Tous les événements */
  findAll: (): Promise<CalendarEvent[]> => db.calendarEvents.toArray(),

  /** Événement par identifiant */
  findById: (id: string): Promise<CalendarEvent | undefined> => db.calendarEvents.get(id),

  /** Événements liés à un client (index clientId) */
  findByClient: (clientId: string): Promise<CalendarEvent[]> =>
    db.calendarEvents.where('clientId').equals(clientId).toArray(),

  /** Événements liés à une facture (index invoiceId) */
  findByInvoice: (invoiceId: string): Promise<CalendarEvent[]> =>
    db.calendarEvents.where('invoiceId').equals(invoiceId).toArray(),

  /** Événements par type (ex: 'meeting', 'deadline') */
  findByType: (type: string): Promise<CalendarEvent[]> =>
    db.calendarEvents.where('type').equals(type).toArray(),

  /** Événements compris entre deux dates ISO sur le champ 'start' (inclusif) */
  findByDateRange: (from: string, to: string): Promise<CalendarEvent[]> =>
    db.calendarEvents.where('start').between(from, to, true, true).toArray(),

  /** Persiste (insert ou update) un événement */
  save: (event: CalendarEvent): Promise<string> => db.calendarEvents.put(event),

  /** Persiste plusieurs événements en une seule transaction */
  saveBulk: (events: CalendarEvent[]): Promise<string> => db.calendarEvents.bulkPut(events),

  /** Supprime un événement par identifiant */
  delete: (id: string): Promise<void> => db.calendarEvents.delete(id),

  /** Nombre total d'événements */
  count: (): Promise<number> => db.calendarEvents.count(),
};

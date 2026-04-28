/**
 * Repository pour les clients
 *
 * Centralise tous les accès Dexie pour l'entité Client.
 * Ref schéma : clients '&id, name, email, archived'
 */

import type { Client } from "../../types";
import { db } from "../invoiceDB";

export const clientRepository = {
  /** Tous les clients (actifs + archivés) */
  findAll: (): Promise<Client[]> => db.clients.toArray(),

  /** Clients non archivés uniquement */
  findAllActive: (): Promise<Client[]> =>
    db.clients.filter((c) => !c.archived).toArray(),

  /** Client par identifiant */
  findById: (id: string): Promise<Client | undefined> => db.clients.get(id),

  /** Clients correspondant à un email (index email) */
  findByEmail: (email: string): Promise<Client[]> =>
    db.clients.where("email").equals(email).toArray(),

  /** Persiste (insert ou update) un client */
  save: (client: Client): Promise<string> => db.clients.put(client),

  /** Persiste plusieurs clients en une seule transaction */
  saveBulk: (clients: Client[]): Promise<string> => db.clients.bulkPut(clients),

  /** Supprime un client par identifiant */
  delete: (id: string): Promise<void> => db.clients.delete(id),

  /** Nombre total de clients */
  count: (): Promise<number> => db.clients.count(),
};

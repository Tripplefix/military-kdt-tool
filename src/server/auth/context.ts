import { getDb, type Db } from "@/server/db/client";

/**
 * Request-Kontext für Services. Lokal gibt es keinen angemeldeten Benutzer.
 * Beim späteren Hosting wird hier die Session gelesen (userId, roles).
 */
export interface RequestContext {
  db: Db;
  userId: string | null;
  roles: string[];
}

export function getRequestContext(_req?: Request): RequestContext {
  return { db: getDb(), userId: null, roles: [] };
}

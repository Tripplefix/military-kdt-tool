import { asc, eq } from "drizzle-orm";
import type { Db } from "@/server/db/client";
import * as s from "@/server/db/schema";

export const wkRepo = {
  list(db: Db) {
    return db.select().from(s.wk).orderBy(asc(s.wk.startDate)).all();
  },
  byId(db: Db, id: string) {
    return db.select().from(s.wk).where(eq(s.wk.id, id)).get() ?? null;
  },
  update(db: Db, id: string, patch: Partial<s.Wk>) {
    db.update(s.wk).set(patch).where(eq(s.wk.id, id)).run();
  },
  remove(db: Db, id: string) {
    db.delete(s.wk).where(eq(s.wk.id, id)).run();
  },
  settings(db: Db, wkId: string) {
    return db.select().from(s.settings).where(eq(s.settings.wkId, wkId)).get() ?? null;
  },
  updateSettings(db: Db, wkId: string, patch: Partial<s.Settings>) {
    db.update(s.settings).set(patch).where(eq(s.settings.wkId, wkId)).run();
  },
  units(db: Db, wkId: string) {
    return db.select().from(s.unit).where(eq(s.unit.wkId, wkId)).orderBy(asc(s.unit.order), asc(s.unit.label)).all();
  },
  personnel(db: Db, wkId: string) {
    return db
      .select()
      .from(s.personnel)
      .where(eq(s.personnel.wkId, wkId))
      .orderBy(asc(s.personnel.order), asc(s.personnel.name))
      .all();
  },
  categories(db: Db, wkId: string) {
    return db.select().from(s.category).where(eq(s.category.wkId, wkId)).orderBy(asc(s.category.order)).all();
  },
  terms(db: Db, wkId: string) {
    return db
      .select()
      .from(s.termTemplate)
      .where(eq(s.termTemplate.wkId, wkId))
      .orderBy(asc(s.termTemplate.kind), asc(s.termTemplate.order), asc(s.termTemplate.de))
      .all();
  },
  weeks(db: Db, wkId: string) {
    return db.select().from(s.week).where(eq(s.week.wkId, wkId)).orderBy(asc(s.week.index)).all();
  },
};

/** Generische CRUD-Helfer für Stammdaten-Tabellen (unit, personnel, category, term_template). */
type MasterTable = typeof s.unit | typeof s.personnel | typeof s.category | typeof s.termTemplate;

export function masterRepo<T extends MasterTable>(table: T) {
  return {
    byId(db: Db, id: string): T["$inferSelect"] | null {
      return (db.select().from(table).where(eq(table.id, id)).get() as T["$inferSelect"] | undefined) ?? null;
    },
    insert(db: Db, values: T["$inferInsert"]): T["$inferSelect"] {
      return db.insert(table).values(values as never).returning().get() as T["$inferSelect"];
    },
    update(db: Db, id: string, patch: Partial<T["$inferInsert"]>): T["$inferSelect"] | null {
      return (db.update(table).set(patch as never).where(eq(table.id, id)).returning().get() as T["$inferSelect"] | undefined) ?? null;
    },
    remove(db: Db, id: string): void {
      db.delete(table).where(eq(table.id, id)).run();
    },
  };
}

export const unitRepo = masterRepo(s.unit);
export const personnelRepo = masterRepo(s.personnel);
export const categoryRepo = masterRepo(s.category);
export const termRepo = masterRepo(s.termTemplate);

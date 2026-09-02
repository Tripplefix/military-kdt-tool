import { asc, eq } from "drizzle-orm";
import type { Db } from "@/server/db/client";
import * as s from "@/server/db/schema";

export const tagesbefehlRepo = {
  byDay(db: Db, dayId: string) {
    return db.select().from(s.tagesbefehl).where(eq(s.tagesbefehl.dayId, dayId)).get() ?? null;
  },
  byId(db: Db, id: string) {
    return db.select().from(s.tagesbefehl).where(eq(s.tagesbefehl.id, id)).get() ?? null;
  },
  insert(db: Db, values: typeof s.tagesbefehl.$inferInsert) {
    return db.insert(s.tagesbefehl).values(values).returning().get();
  },
  update(db: Db, id: string, patch: Partial<typeof s.tagesbefehl.$inferInsert>) {
    return db.update(s.tagesbefehl).set(patch).where(eq(s.tagesbefehl.id, id)).returning().get() ?? null;
  },
  rows(db: Db, tagesbefehlId: string) {
    return db.select().from(s.tagesbefehlRow).where(eq(s.tagesbefehlRow.tagesbefehlId, tagesbefehlId)).orderBy(asc(s.tagesbefehlRow.order)).all();
  },
  rowById(db: Db, id: string) {
    return db.select().from(s.tagesbefehlRow).where(eq(s.tagesbefehlRow.id, id)).get() ?? null;
  },
  insertRow(db: Db, values: typeof s.tagesbefehlRow.$inferInsert) {
    return db.insert(s.tagesbefehlRow).values(values).returning().get();
  },
  updateRow(db: Db, id: string, patch: Partial<typeof s.tagesbefehlRow.$inferInsert>) {
    return db.update(s.tagesbefehlRow).set(patch).where(eq(s.tagesbefehlRow.id, id)).returning().get() ?? null;
  },
  deleteRow(db: Db, id: string) {
    db.delete(s.tagesbefehlRow).where(eq(s.tagesbefehlRow.id, id)).run();
  },
};

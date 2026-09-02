import { eq } from "drizzle-orm";
import type { Db } from "@/server/db/client";
import * as s from "@/server/db/schema";

export const blockRepo = {
  byId(db: Db, id: string) {
    return db.select().from(s.block).where(eq(s.block.id, id)).get() ?? null;
  },
  insert(db: Db, values: typeof s.block.$inferInsert) {
    return db.insert(s.block).values(values).returning().get();
  },
  update(db: Db, id: string, patch: Partial<typeof s.block.$inferInsert>) {
    return db.update(s.block).set(patch).where(eq(s.block.id, id)).returning().get() ?? null;
  },
  remove(db: Db, id: string) {
    db.delete(s.block).where(eq(s.block.id, id)).run();
  },
};

export const footnoteRepo = {
  byId(db: Db, id: string) {
    return db.select().from(s.footnote).where(eq(s.footnote.id, id)).get() ?? null;
  },
  insert(db: Db, values: typeof s.footnote.$inferInsert) {
    return db.insert(s.footnote).values(values).returning().get();
  },
  update(db: Db, id: string, patch: Partial<typeof s.footnote.$inferInsert>) {
    return db.update(s.footnote).set(patch).where(eq(s.footnote.id, id)).returning().get() ?? null;
  },
  remove(db: Db, id: string) {
    db.delete(s.footnote).where(eq(s.footnote.id, id)).run();
  },
};

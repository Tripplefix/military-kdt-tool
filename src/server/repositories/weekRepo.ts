import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import type { Db } from "@/server/db/client";
import * as s from "@/server/db/schema";

export const weekRepo = {
  byId(db: Db, id: string) {
    return db.select().from(s.week).where(eq(s.week.id, id)).get() ?? null;
  },
  byWkAndIndex(db: Db, wkId: string, index: number) {
    return db.select().from(s.week).where(and(eq(s.week.wkId, wkId), eq(s.week.index, index))).get() ?? null;
  },
  update(db: Db, id: string, patch: Partial<s.Week>) {
    return db.update(s.week).set(patch).where(eq(s.week.id, id)).returning().get() ?? null;
  },
  remove(db: Db, id: string) {
    db.delete(s.week).where(eq(s.week.id, id)).run();
  },
  days(db: Db, weekId: string) {
    return db.select().from(s.day).where(eq(s.day.weekId, weekId)).orderBy(asc(s.day.date)).all();
  },
  dayById(db: Db, id: string) {
    return db.select().from(s.day).where(eq(s.day.id, id)).get() ?? null;
  },
  dayByDate(db: Db, wkId: string, date: string) {
    return (
      db
        .select({ day: s.day })
        .from(s.day)
        .innerJoin(s.week, eq(s.day.weekId, s.week.id))
        .where(and(eq(s.week.wkId, wkId), eq(s.day.date, date)))
        .get()?.day ?? null
    );
  },
  updateDay(db: Db, id: string, patch: Partial<s.Day>) {
    return db.update(s.day).set(patch).where(eq(s.day.id, id)).returning().get() ?? null;
  },
  lanes(db: Db, weekId: string) {
    return db.select().from(s.lane).where(eq(s.lane.weekId, weekId)).orderBy(asc(s.lane.order)).all();
  },
  weekLanes(db: Db, weekId: string) {
    return db
      .select()
      .from(s.lane)
      .where(and(eq(s.lane.weekId, weekId), isNull(s.lane.dayId)))
      .orderBy(asc(s.lane.order))
      .all();
  },
  blocksForWeek(db: Db, weekId: string) {
    return db
      .select({ block: s.block })
      .from(s.block)
      .innerJoin(s.day, eq(s.block.dayId, s.day.id))
      .where(eq(s.day.weekId, weekId))
      .orderBy(asc(s.block.startMin), asc(s.block.sortKey))
      .all()
      .map((r) => r.block);
  },
  blocksForDay(db: Db, dayId: string) {
    return db.select().from(s.block).where(eq(s.block.dayId, dayId)).orderBy(asc(s.block.startMin), asc(s.block.sortKey)).all();
  },
  footnotesForWeek(db: Db, weekId: string) {
    return db
      .select({ footnote: s.footnote })
      .from(s.footnote)
      .innerJoin(s.day, eq(s.footnote.dayId, s.day.id))
      .where(eq(s.day.weekId, weekId))
      .orderBy(asc(s.footnote.number), asc(s.footnote.order))
      .all()
      .map((r) => r.footnote);
  },
  footnotesForDay(db: Db, dayId: string) {
    return db.select().from(s.footnote).where(eq(s.footnote.dayId, dayId)).orderBy(asc(s.footnote.number), asc(s.footnote.order)).all();
  },
  tagesbefehlDayIds(db: Db, dayIds: string[]) {
    if (dayIds.length === 0) return [];
    return db
      .select({ dayId: s.tagesbefehl.dayId })
      .from(s.tagesbefehl)
      .where(inArray(s.tagesbefehl.dayId, dayIds))
      .all()
      .map((r) => r.dayId);
  },
};

import type { RequestContext } from "@/server/auth/context";
import { assertCanEditWk } from "@/server/auth/authorize";
import { badRequest, notFound } from "@/server/http/handler";
import { eq, inArray } from "drizzle-orm";
import * as s from "@/server/db/schema";
import { weekRepo } from "@/server/repositories/weekRepo";
import { wkRepo } from "@/server/repositories/wkRepo";
import type { WeekCreate } from "@/shared/schemas";
import { createWeekWithDays } from "./weekService";

export const weekAdminService = {
  create(ctx: RequestContext, input: WeekCreate) {
    assertCanEditWk(ctx, input.wkId);
    if (!wkRepo.byId(ctx.db, input.wkId)) throw notFound("WK nicht gefunden");
    const weeks = wkRepo.weeks(ctx.db, input.wkId);
    if (weeks.some((w) => w.startDate === input.startDate)) throw badRequest("Für dieses Startdatum existiert bereits eine Woche");
    const index = weeks.length === 0 ? 0 : Math.max(...weeks.map((w) => w.index)) + 1;
    let weekId = "";
    ctx.db.transaction((tx) => {
      weekId = createWeekWithDays(tx, { ...input, index }).weekId;
    });
    return weekRepo.byId(ctx.db, weekId)!;
  },
  /**
   * Kopiert Lanes, Blöcke und Termine/Info von einer Woche in eine andere
   * (Wochentag auf Wochentag). Ziel muss leer sein oder overwrite = true.
   */
  copy(ctx: RequestContext, sourceWeekId: string, targetWeekId: string, overwrite: boolean): { copiedBlocks: number; copiedFootnotes: number } {
    const source = weekRepo.byId(ctx.db, sourceWeekId);
    const target = weekRepo.byId(ctx.db, targetWeekId);
    if (!source || !target) throw notFound("Woche nicht gefunden");
    if (source.id === target.id) throw badRequest("Quelle und Ziel sind identisch");
    assertCanEditWk(ctx, target.wkId);
    const targetBlocks = weekRepo.blocksForWeek(ctx.db, targetWeekId);
    if (targetBlocks.length > 0 && !overwrite) throw badRequest("Zielwoche enthält bereits Blöcke. Überschreiben bestätigen.");

    const sourceDays = weekRepo.days(ctx.db, sourceWeekId);
    const targetDays = weekRepo.days(ctx.db, targetWeekId);
    const dayMap = new Map<string, string>();
    sourceDays.forEach((sd) => {
      const td = targetDays.find((d) => d.weekday === sd.weekday);
      if (td) dayMap.set(sd.id, td.id);
    });
    let copiedBlocks = 0;
    let copiedFootnotes = 0;
    ctx.db.transaction((tx) => {
      const targetDayIds = targetDays.map((d) => d.id);
      if (targetDayIds.length) {
        tx.delete(s.block).where(inArray(s.block.dayId, targetDayIds)).run();
        tx.delete(s.footnote).where(inArray(s.footnote.dayId, targetDayIds)).run();
      }
      tx.delete(s.lane).where(eq(s.lane.weekId, targetWeekId)).run();
      for (const l of weekRepo.lanes(ctx.db, sourceWeekId)) {
        const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = l;
        const dayId = l.dayId ? dayMap.get(l.dayId) : null;
        if (l.dayId && !dayId) continue;
        tx.insert(s.lane).values({ ...rest, weekId: targetWeekId, dayId: dayId ?? null }).run();
      }
      const footnoteMap = new Map<string, string>();
      for (const f of weekRepo.footnotesForWeek(ctx.db, sourceWeekId)) {
        const dayId = dayMap.get(f.dayId);
        if (!dayId) continue;
        const { id, createdAt: _c, updatedAt: _u, ...rest } = f;
        const newId = crypto.randomUUID();
        footnoteMap.set(id, newId);
        tx.insert(s.footnote).values({ ...rest, id: newId, dayId }).run();
        copiedFootnotes++;
      }
      for (const b of weekRepo.blocksForWeek(ctx.db, sourceWeekId)) {
        const dayId = dayMap.get(b.dayId);
        if (!dayId) continue;
        const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = b;
        tx.insert(s.block).values({ ...rest, dayId, footnoteId: b.footnoteId ? (footnoteMap.get(b.footnoteId) ?? null) : null }).run();
        copiedBlocks++;
      }
      tx.update(s.week).set({ kind: source.kind }).where(eq(s.week.id, targetWeekId)).run();
    });
    return { copiedBlocks, copiedFootnotes };
  },

  remove(ctx: RequestContext, weekId: string) {
    const week = weekRepo.byId(ctx.db, weekId);
    if (!week) throw notFound("Woche nicht gefunden");
    assertCanEditWk(ctx, week.wkId);
    weekRepo.remove(ctx.db, weekId);
  },
};

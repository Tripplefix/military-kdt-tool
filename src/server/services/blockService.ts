import type { RequestContext } from "@/server/auth/context";
import { assertCanEditWk, assertCanViewWk } from "@/server/auth/authorize";
import * as s from "@/server/db/schema";
import { badRequest, conflict, notFound } from "@/server/http/handler";
import { blockRepo, footnoteRepo } from "@/server/repositories/blockRepo";
import { weekRepo } from "@/server/repositories/weekRepo";
import { wkRepo } from "@/server/repositories/wkRepo";
import type { LaneConfigInput } from "@/shared/schemas";
import type { BlockInput, BlockPatch, FootnoteInput, FootnotePatch, WeekPatch, DayPatch } from "@/shared/schemas";
import { clampSpan, isValidSpan } from "@/shared/lanes";
import type { BlockDto, FootnoteDto, LaneDto, WeekBundle } from "@/shared/types";
import { GRID_END_MIN, GRID_START_MIN, SLOT_MIN } from "@/shared/constants";
import { applyLaneProfile, insertLanesFromProfile, resolveLanesForDay } from "./weekService";
import { toSettingsDto, toWkDto } from "./wkService";
import { and, eq, isNull } from "drizzle-orm";

function strip<T extends { createdAt: string; updatedAt: string }>(row: T): Omit<T, "createdAt"> {
  const { createdAt: _c, ...rest } = row;
  return rest;
}
const toLaneDto = (l: s.Lane): LaneDto => {
  const { createdAt: _c, updatedAt: _u, ...rest } = l;
  return rest;
};
const toBlockDto = (b: s.Block): BlockDto => strip(b);
const toFootnoteDto = (f: s.Footnote): FootnoteDto => {
  const { createdAt: _c, updatedAt: _u, ...rest } = f;
  return rest;
};

/** Woche + Tag + wkId für Berechtigung und Lane-Auflösung. */
function loadDayContext(ctx: RequestContext, dayId: string) {
  const day = weekRepo.dayById(ctx.db, dayId);
  if (!day) throw notFound("Tag nicht gefunden");
  const week = weekRepo.byId(ctx.db, day.weekId)!;
  const lanes = resolveLanesForDay(weekRepo.lanes(ctx.db, week.id), day.id);
  return { day, week, lanes };
}

function validateTimes(startMin: number, endMin: number) {
  if (endMin - startMin < SLOT_MIN) throw badRequest("Ein Block dauert mindestens 15 Minuten");
  if (startMin < GRID_START_MIN || endMin > GRID_END_MIN) throw badRequest("Block liegt ausserhalb des Rasters 0500–2300");
}

export const weekService = {
  bundle(ctx: RequestContext, weekId: string): WeekBundle {
    const week = weekRepo.byId(ctx.db, weekId);
    if (!week) throw notFound("Woche nicht gefunden");
    assertCanViewWk(ctx, week.wkId);
    const wk = wkRepo.byId(ctx.db, week.wkId)!;
    const settings = wkRepo.settings(ctx.db, week.wkId)!;
    const days = weekRepo.days(ctx.db, weekId);
    const allLanes = weekRepo.lanes(ctx.db, weekId);
    const lanesByDay: Record<string, LaneDto[]> = {};
    for (const d of days) lanesByDay[d.id] = resolveLanesForDay(allLanes, d.id).map(toLaneDto);
    return {
      wk: toWkDto(wk),
      week: strip(week),
      weeks: wkRepo.weeks(ctx.db, week.wkId).map((w) => ({ id: w.id, index: w.index, label: w.label, startDate: w.startDate, kind: w.kind })),
      days: days.map((d) => {
        const { createdAt: _c, updatedAt: _u, ...rest } = d;
        return rest;
      }),
      lanesByDay,
      weekLanes: allLanes.filter((l) => l.dayId === null).map(toLaneDto),
      blocks: weekRepo.blocksForWeek(ctx.db, weekId).map(toBlockDto),
      footnotes: weekRepo.footnotesForWeek(ctx.db, weekId).map(toFootnoteDto),
      categories: wkRepo.categories(ctx.db, week.wkId).map((c) => {
        const { createdAt: _c, updatedAt: _u, ...rest } = c;
        return rest;
      }),
      personnel: wkRepo.personnel(ctx.db, week.wkId).map((p) => {
        const { createdAt: _c, updatedAt: _u, ...rest } = p;
        return rest;
      }),
      settings: toSettingsDto(settings),
      terms: wkRepo.terms(ctx.db, week.wkId).map((t) => {
        const { createdAt: _c, updatedAt: _u, ...rest } = t;
        return rest;
      }),
      units: wkRepo.units(ctx.db, week.wkId).map((u) => {
        const { createdAt: _c, updatedAt: _u, ...rest } = u;
        return rest;
      }),
      tagesbefehlDayIds: weekRepo.tagesbefehlDayIds(
        ctx.db,
        days.map((d) => d.id),
      ),
    };
  },

  update(ctx: RequestContext, weekId: string, patch: WeekPatch) {
    const week = weekRepo.byId(ctx.db, weekId);
    if (!week) throw notFound("Woche nicht gefunden");
    assertCanEditWk(ctx, week.wkId);
    return strip(weekRepo.update(ctx.db, weekId, patch)!);
  },

  updateDay(ctx: RequestContext, dayId: string, patch: DayPatch) {
    const { week } = loadDayContext(ctx, dayId);
    assertCanEditWk(ctx, week.wkId);
    const d = weekRepo.updateDay(ctx.db, dayId, patch)!;
    const { createdAt: _c, updatedAt: _u, ...rest } = d;
    return rest;
  },

  /** Lanes konfigurieren und Blöcke des betroffenen Bereichs in die neue Lane-Anzahl klemmen. */
  configureLanes(ctx: RequestContext, weekId: string, input: LaneConfigInput): { affectedBlocks: number } {
    const week = weekRepo.byId(ctx.db, weekId);
    if (!week) throw notFound("Woche nicht gefunden");
    assertCanEditWk(ctx, week.wkId);
    let affected = 0;
    ctx.db.transaction((tx) => {
      const where = input.dayId ? and(eq(s.lane.weekId, weekId), eq(s.lane.dayId, input.dayId)) : and(eq(s.lane.weekId, weekId), isNull(s.lane.dayId));
      if (input.clearOverride && input.dayId) {
        tx.delete(s.lane).where(where).run();
      } else if (input.profile) {
        tx.delete(s.lane).where(where).run();
        insertLanesFromProfile(tx, weekId, input.dayId ?? null, input.profile);
      } else if (input.lanes) {
        tx.delete(s.lane).where(where).run();
        input.lanes.forEach((l, order) => {
          tx.insert(s.lane).values({ weekId, dayId: input.dayId ?? null, order, ...l }).run();
        });
      } else {
        throw badRequest("profile, lanes oder clearOverride angeben");
      }
      // Blöcke klemmen
      const allLanes = tx.select().from(s.lane).where(eq(s.lane.weekId, weekId)).all();
      const days = tx.select().from(s.day).where(eq(s.day.weekId, weekId)).all();
      for (const d of days) {
        if (input.dayId && d.id !== input.dayId) continue;
        const laneCount = resolveLanesForDay(allLanes, d.id).length;
        const blocks = tx.select().from(s.block).where(eq(s.block.dayId, d.id)).all();
        for (const b of blocks) {
          if (isValidSpan(b, laneCount)) continue;
          const c = clampSpan(b, laneCount);
          tx.update(s.block).set(c).where(eq(s.block.id, b.id)).run();
          affected++;
        }
      }
    });
    void applyLaneProfile;
    return { affectedBlocks: affected };
  },
};

export const blockService = {
  create(ctx: RequestContext, input: BlockInput): BlockDto {
    const { week, lanes } = loadDayContext(ctx, input.dayId);
    assertCanEditWk(ctx, week.wkId);
    validateTimes(input.startMin, input.endMin);
    if (!isValidSpan(input, lanes.length)) throw badRequest("Spalten-Auswahl passt nicht zu den Spalten des Tages");
    return toBlockDto(blockRepo.insert(ctx.db, input));
  },

  update(ctx: RequestContext, id: string, patch: BlockPatch): BlockDto {
    const existing = blockRepo.byId(ctx.db, id);
    if (!existing) throw notFound("Block nicht gefunden");
    const { week } = loadDayContext(ctx, existing.dayId);
    assertCanEditWk(ctx, week.wkId);
    if (patch.expectedUpdatedAt && patch.expectedUpdatedAt !== existing.updatedAt) {
      throw conflict("Der Block wurde inzwischen geändert. Bitte neu laden.");
    }
    const { expectedUpdatedAt: _e, ...changes } = patch;
    const next = { ...existing, ...changes };
    validateTimes(next.startMin, next.endMin);
    const targetLanes = loadDayContext(ctx, next.dayId).lanes;
    if (!isValidSpan(next, targetLanes.length)) {
      // Beim Verschieben auf einen Tag mit weniger Spalten: klemmen statt ablehnen
      Object.assign(next, clampSpan(next, targetLanes.length));
    }
    const { id: _id, createdAt: _c, updatedAt: _u, ...values } = next;
    return toBlockDto(blockRepo.update(ctx.db, id, values)!);
  },

  duplicate(ctx: RequestContext, id: string): BlockDto {
    const existing = blockRepo.byId(ctx.db, id);
    if (!existing) throw notFound("Block nicht gefunden");
    const { week } = loadDayContext(ctx, existing.dayId);
    assertCanEditWk(ctx, week.wkId);
    const { id: _id, createdAt: _c, updatedAt: _u, ...values } = existing;
    return toBlockDto(blockRepo.insert(ctx.db, { ...values, sortKey: existing.sortKey + 1 }));
  },

  remove(ctx: RequestContext, id: string) {
    const existing = blockRepo.byId(ctx.db, id);
    if (!existing) throw notFound("Block nicht gefunden");
    const { week } = loadDayContext(ctx, existing.dayId);
    assertCanEditWk(ctx, week.wkId);
    blockRepo.remove(ctx.db, id);
  },
};

/** Nächste freie Termine/Info-Nummer eines Tages: Wochentag*10 + n (Mo=1 … So=7). */
export function nextFootnoteNumber(existing: number[], weekday: number): number {
  const base = (weekday === 0 ? 7 : weekday) * 10;
  let n = base;
  const used = new Set(existing);
  while (used.has(n)) n++;
  return n;
}

export const footnoteService = {
  create(ctx: RequestContext, input: FootnoteInput): FootnoteDto {
    const { day, week } = loadDayContext(ctx, input.dayId);
    assertCanEditWk(ctx, week.wkId);
    const existing = weekRepo.footnotesForDay(ctx.db, day.id);
    const number = input.number ?? nextFootnoteNumber(existing.map((f) => f.number), day.weekday);
    return toFootnoteDto(
      footnoteRepo.insert(ctx.db, { ...input, number, order: existing.length }),
    );
  },
  update(ctx: RequestContext, id: string, patch: FootnotePatch): FootnoteDto {
    const existing = footnoteRepo.byId(ctx.db, id);
    if (!existing) throw notFound("Termin/Info nicht gefunden");
    const { week } = loadDayContext(ctx, existing.dayId);
    assertCanEditWk(ctx, week.wkId);
    return toFootnoteDto(footnoteRepo.update(ctx.db, id, patch)!);
  },
  remove(ctx: RequestContext, id: string) {
    const existing = footnoteRepo.byId(ctx.db, id);
    if (!existing) throw notFound("Termin/Info nicht gefunden");
    const { week } = loadDayContext(ctx, existing.dayId);
    assertCanEditWk(ctx, week.wkId);
    footnoteRepo.remove(ctx.db, id);
  },
};

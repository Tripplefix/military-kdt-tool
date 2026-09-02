import { eq, inArray } from "drizzle-orm";
import type { RequestContext } from "@/server/auth/context";
import { assertCanEditWk, assertCanViewWk } from "@/server/auth/authorize";
import * as s from "@/server/db/schema";
import { badRequest, notFound } from "@/server/http/handler";
import { tagesbefehlRepo } from "@/server/repositories/tagesbefehlRepo";
import { weekRepo } from "@/server/repositories/weekRepo";
import { wkRepo } from "@/server/repositories/wkRepo";
import type { TagesbefehlPatch, TagesbefehlRowInput, TagesbefehlRowPatch } from "@/shared/schemas";
import { generateTagesbefehl, tagesbefehlGroups, type GenerateInput } from "@/shared/tagesbefehl/generate";
import { mergeRows } from "@/shared/tagesbefehl/merge";
import { parseTimeText, todayIso } from "@/shared/time";
import type { TagesbefehlBundle, TagesbefehlDto, TagesbefehlRowDto } from "@/shared/types";
import { resolveLanesForDay } from "./weekService";
import { toSettingsDto, toWkDto } from "./wkService";

function strip<T extends { createdAt: string; updatedAt: string }>(row: T): Omit<T, "createdAt" | "updatedAt"> {
  const { createdAt: _c, updatedAt: _u, ...rest } = row;
  return rest;
}
const toRowDto = (r: s.TagesbefehlRow): TagesbefehlRowDto => strip(r);
const toTbDto = (t: s.Tagesbefehl): TagesbefehlDto => {
  const { createdAt: _c, ...rest } = t;
  return rest;
};

function loadContext(ctx: RequestContext, dayId: string) {
  const day = weekRepo.dayById(ctx.db, dayId);
  if (!day) throw notFound("Tag nicht gefunden");
  const week = weekRepo.byId(ctx.db, day.weekId)!;
  const wk = wkRepo.byId(ctx.db, week.wkId)!;
  const settings = wkRepo.settings(ctx.db, week.wkId)!;
  const lanes = resolveLanesForDay(weekRepo.lanes(ctx.db, week.id), day.id);
  const units = wkRepo.units(ctx.db, week.wkId).map(strip);
  const personnel = wkRepo.personnel(ctx.db, week.wkId).map(strip);
  return { day, week, wk, settings, lanes, units, personnel };
}

function generateInput(ctx: RequestContext, c: ReturnType<typeof loadContext>): GenerateInput {
  return {
    day: strip(c.day),
    week: (({ createdAt: _c, ...rest }) => rest)(c.week),
    lanes: c.lanes.map(strip),
    blocks: weekRepo.blocksForDay(ctx.db, c.day.id).map((b) => (({ createdAt: _c, ...rest }) => rest)(b)),
    footnotes: weekRepo.footnotesForDay(ctx.db, c.day.id).map(strip),
    categories: wkRepo.categories(ctx.db, c.week.wkId).map(strip),
    settings: toSettingsDto(c.settings),
    units: c.units,
    personnel: c.personnel,
  };
}

/** Laufende Nummer = Tag innerhalb der Dienstleistung (1 = erster Tag). */
function dayNumber(wkStart: string, date: string): number {
  const a = new Date(wkStart + "T00:00:00Z").getTime();
  const b = new Date(date + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000) + 1;
}

/** Zeilen persistieren (Merge-Resultat): Update bestehende, Insert neue, Delete entfernte. */
function persistMerge(ctx: RequestContext, tagesbefehlId: string, result: ReturnType<typeof mergeRows>) {
  ctx.db.transaction((tx) => {
    if (result.removeIds.length) tx.delete(s.tagesbefehlRow).where(inArray(s.tagesbefehlRow.id, result.removeIds)).run();
    for (const r of result.rows) {
      const { id, ...values } = r;
      if (id) tx.update(s.tagesbefehlRow).set(values).where(eq(s.tagesbefehlRow.id, id)).run();
      else tx.insert(s.tagesbefehlRow).values({ ...values, tagesbefehlId }).run();
    }
  });
}

export const tagesbefehlService = {
  bundle(ctx: RequestContext, dayId: string): TagesbefehlBundle {
    const c = loadContext(ctx, dayId);
    assertCanViewWk(ctx, c.week.wkId);
    const tb = tagesbefehlRepo.byDay(ctx.db, dayId);
    return {
      wk: toWkDto(c.wk),
      settings: toSettingsDto(c.settings),
      week: (({ createdAt: _c, ...rest }) => rest)(c.week),
      day: strip(c.day),
      tagesbefehl: tb ? toTbDto(tb) : null,
      rows: tb ? tagesbefehlRepo.rows(ctx.db, tb.id).map(toRowDto) : [],
      units: c.units,
      personnel: c.personnel,
      terms: wkRepo.terms(ctx.db, c.week.wkId).map(strip),
      groups: tagesbefehlGroups(c.lanes.map(strip), c.units),
    };
  },

  /** Erstellt den Tagesbefehl (falls nötig) und generiert/aktualisiert die Zeilen aus dem WAP. */
  regenerate(ctx: RequestContext, dayId: string): TagesbefehlBundle {
    const c = loadContext(ctx, dayId);
    assertCanEditWk(ctx, c.week.wkId);
    let tb = tagesbefehlRepo.byDay(ctx.db, dayId);
    const now = new Date().toISOString();
    if (!tb) {
      tb = tagesbefehlRepo.insert(ctx.db, {
        dayId,
        number: dayNumber(c.wk.startDate, c.day.date),
        validFrom: todayIso(),
        generatedAt: now,
        lastRegeneratedAt: now,
      });
    } else {
      const patch: Partial<typeof s.tagesbefehl.$inferInsert> = { lastRegeneratedAt: now };
      if (tb.status === "genehmigt") {
        // Genehmigter Befehl wird zur neuen Revision im Entwurf
        patch.revision = tb.revision + 1;
        patch.replacesVersion = `Rev ${tb.revision}`;
        patch.status = "entwurf";
      }
      tb = tagesbefehlRepo.update(ctx.db, tb.id, patch)!;
    }
    const existing = tagesbefehlRepo.rows(ctx.db, tb.id).map(toRowDto);
    const input = generateInput(ctx, c);
    const generated = generateTagesbefehl(input);
    const result = mergeRows(existing, generated, tagesbefehlGroups(input.lanes, input.units));
    persistMerge(ctx, tb.id, result);
    return this.bundle(ctx, dayId);
  },

  patch(ctx: RequestContext, dayId: string, patch: TagesbefehlPatch): TagesbefehlDto {
    const c = loadContext(ctx, dayId);
    assertCanEditWk(ctx, c.week.wkId);
    const tb = tagesbefehlRepo.byDay(ctx.db, dayId);
    if (!tb) throw notFound("Tagesbefehl nicht gefunden");
    return toTbDto(tagesbefehlRepo.update(ctx.db, tb.id, patch)!);
  },

  addRow(ctx: RequestContext, dayId: string, input: TagesbefehlRowInput): TagesbefehlRowDto {
    const c = loadContext(ctx, dayId);
    assertCanEditWk(ctx, c.week.wkId);
    const tb = tagesbefehlRepo.byDay(ctx.db, dayId);
    if (!tb) throw notFound("Tagesbefehl nicht gefunden");
    const rows = tagesbefehlRepo.rows(ctx.db, tb.id);
    const parsed = parseTimeText(input.timeText);
    const groupLabel = input.groupLabel || (input.groupKey ? (this.bundle(ctx, dayId).groups.find((g) => g.key === input.groupKey)?.label ?? "") : "");
    const order = input.order ?? Math.max(0, ...rows.filter((r) => r.section === input.section).map((r) => r.order)) + 1;
    return toRowDto(
      tagesbefehlRepo.insertRow(ctx.db, { ...input, groupLabel, order, tagesbefehlId: tb.id, startMin: parsed.startMin, endMin: parsed.endMin, sourceKind: "manual", sourceKey: null }),
    );
  },

  patchRow(ctx: RequestContext, rowId: string, patch: TagesbefehlRowPatch): TagesbefehlRowDto {
    const row = tagesbefehlRepo.rowById(ctx.db, rowId);
    if (!row) throw notFound("Zeile nicht gefunden");
    const tb = tagesbefehlRepo.byId(ctx.db, row.tagesbefehlId)!;
    const c = loadContext(ctx, tb.dayId);
    assertCanEditWk(ctx, c.week.wkId);

    if (patch.resetToSource) {
      if (!row.sourceSnapshot) throw badRequest("Keine Quellwerte vorhanden");
      const snap = row.sourceSnapshot;
      const parsed = parseTimeText(snap.timeText);
      return toRowDto(
        tagesbefehlRepo.updateRow(ctx.db, rowId, {
          timeText: snap.timeText,
          activity: snap.activity,
          responsibility: snap.responsibility,
          location: snap.location,
          groupKey: snap.groupKey,
          startMin: parsed.startMin,
          endMin: parsed.endMin,
          overridden: false,
          sourceChanged: false,
        })!,
      );
    }
    const { resetToSource: _r, ...changes } = patch;
    const next = { ...row, ...changes };
    if (changes.timeText !== undefined) {
      const parsed = parseTimeText(changes.timeText);
      next.startMin = parsed.startMin;
      next.endMin = parsed.endMin;
    }
    // Generierte Zeile: Override, sobald sie von der Quelle abweicht
    if (row.sourceKind !== "manual" && row.sourceSnapshot) {
      const snap = row.sourceSnapshot;
      const differs = next.timeText !== snap.timeText || next.activity !== snap.activity || next.responsibility !== snap.responsibility || next.location !== snap.location || next.groupKey !== snap.groupKey;
      next.overridden = differs;
      if (!differs) next.sourceChanged = false;
    }
    const { id: _id, createdAt: _c, updatedAt: _u, ...values } = next;
    return toRowDto(tagesbefehlRepo.updateRow(ctx.db, rowId, values)!);
  },

  /** Manuelle Zeilen werden gelöscht, generierte als gelöscht markiert (kehren beim Neu-Generieren nicht zurück). */
  deleteRow(ctx: RequestContext, rowId: string): TagesbefehlRowDto | null {
    const row = tagesbefehlRepo.rowById(ctx.db, rowId);
    if (!row) throw notFound("Zeile nicht gefunden");
    const tb = tagesbefehlRepo.byId(ctx.db, row.tagesbefehlId)!;
    const c = loadContext(ctx, tb.dayId);
    assertCanEditWk(ctx, c.week.wkId);
    if (row.sourceKind === "manual" || row.orphan) {
      tagesbefehlRepo.deleteRow(ctx.db, rowId);
      return null;
    }
    return toRowDto(tagesbefehlRepo.updateRow(ctx.db, rowId, { deleted: true })!);
  },

  restoreRow(ctx: RequestContext, rowId: string): TagesbefehlRowDto {
    const row = tagesbefehlRepo.rowById(ctx.db, rowId);
    if (!row) throw notFound("Zeile nicht gefunden");
    const tb = tagesbefehlRepo.byId(ctx.db, row.tagesbefehlId)!;
    const c = loadContext(ctx, tb.dayId);
    assertCanEditWk(ctx, c.week.wkId);
    return toRowDto(tagesbefehlRepo.updateRow(ctx.db, rowId, { deleted: false })!);
  },

  /** Zeile innerhalb ihres Abschnitts (und ihrer Gruppe) um eine Position verschieben. */
  moveRow(ctx: RequestContext, rowId: string, dir: -1 | 1): void {
    const row = tagesbefehlRepo.rowById(ctx.db, rowId);
    if (!row) throw notFound("Zeile nicht gefunden");
    const tb = tagesbefehlRepo.byId(ctx.db, row.tagesbefehlId)!;
    const c = loadContext(ctx, tb.dayId);
    assertCanEditWk(ctx, c.week.wkId);
    const siblings = tagesbefehlRepo
      .rows(ctx.db, tb.id)
      .filter((r) => r.section === row.section && r.groupKey === row.groupKey && !r.deleted)
      .sort((a, b) => a.order - b.order);
    const i = siblings.findIndex((r) => r.id === rowId);
    const j = i + dir;
    if (i === -1 || j < 0 || j >= siblings.length) return;
    const other = siblings[j];
    ctx.db.transaction((tx) => {
      tx.update(s.tagesbefehlRow).set({ order: other.order }).where(eq(s.tagesbefehlRow.id, row.id)).run();
      tx.update(s.tagesbefehlRow).set({ order: row.order }).where(eq(s.tagesbefehlRow.id, other.id)).run();
    });
  },
};

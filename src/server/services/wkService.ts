import type { RequestContext } from "@/server/auth/context";
import { assertCanEditWk, assertCanViewWk } from "@/server/auth/authorize";
import * as s from "@/server/db/schema";
import { DEFAULT_CATEGORIES, DEFAULT_STANDARD_REPORTS, DEFAULT_STANDARD_TIMES, DEFAULT_TERMS, DEFAULT_UNITS } from "@/server/db/defaults";
import { notFound } from "@/server/http/handler";
import { wkRepo } from "@/server/repositories/wkRepo";
import type { SettingsPatch, WkCreate } from "@/shared/schemas";
import type { WkBundle } from "@/shared/types";
import { addDaysIso } from "@/shared/time";
import { createWeekWithDays } from "./weekService";

export function toWkDto(w: s.Wk) {
  return { id: w.id, name: w.name, startDate: w.startDate, endDate: w.endDate };
}

export function toSettingsDto(st: s.Settings) {
  const { createdAt: _c, updatedAt: _u, ...rest } = st;
  return rest;
}

function stripTs<T extends { createdAt: string; updatedAt: string }>(row: T): Omit<T, "createdAt" | "updatedAt"> {
  const { createdAt: _c, updatedAt: _u, ...rest } = row;
  return rest;
}

export const wkService = {
  list(ctx: RequestContext) {
    return wkRepo.list(ctx.db).map(toWkDto);
  },

  bundle(ctx: RequestContext, wkId: string): WkBundle {
    assertCanViewWk(ctx, wkId);
    const wk = wkRepo.byId(ctx.db, wkId);
    const settings = wkRepo.settings(ctx.db, wkId);
    if (!wk || !settings) throw notFound("WK nicht gefunden");
    return {
      wk: toWkDto(wk),
      settings: toSettingsDto(settings),
      units: wkRepo.units(ctx.db, wkId).map(stripTs),
      personnel: wkRepo.personnel(ctx.db, wkId).map(stripTs),
      categories: wkRepo.categories(ctx.db, wkId).map(stripTs),
      terms: wkRepo.terms(ctx.db, wkId).map(stripTs),
      weeks: wkRepo.weeks(ctx.db, wkId).map((w) => {
        const { createdAt: _c, ...rest } = w;
        return rest;
      }),
    };
  },

  updateSettings(ctx: RequestContext, wkId: string, patch: SettingsPatch) {
    assertCanEditWk(ctx, wkId);
    if (!wkRepo.settings(ctx.db, wkId)) throw notFound("WK nicht gefunden");
    wkRepo.updateSettings(ctx.db, wkId, patch);
    return toSettingsDto(wkRepo.settings(ctx.db, wkId)!);
  },

  update(ctx: RequestContext, wkId: string, patch: Partial<Pick<s.Wk, "name" | "startDate" | "endDate">>) {
    assertCanEditWk(ctx, wkId);
    if (!wkRepo.byId(ctx.db, wkId)) throw notFound("WK nicht gefunden");
    wkRepo.update(ctx.db, wkId, patch);
    return toWkDto(wkRepo.byId(ctx.db, wkId)!);
  },

  remove(ctx: RequestContext, wkId: string) {
    assertCanEditWk(ctx, wkId);
    wkRepo.remove(ctx.db, wkId);
  },

  /** Neuer WK mit Standard-Stammdaten und n Wochen. */
  create(ctx: RequestContext, input: WkCreate) {
    const wkId = crypto.randomUUID();
    ctx.db.transaction((tx) => {
      tx.insert(s.wk)
        .values({
          id: wkId,
          name: input.name,
          startDate: input.startDate,
          endDate: addDaysIso(input.startDate, input.weeks * 7 - 1),
          ownerId: ctx.userId,
        })
        .run();
      tx.insert(s.settings)
        .values({
          wkId,
          companyName: input.companyName,
          standardTimes: DEFAULT_STANDARD_TIMES,
          standardReports: DEFAULT_STANDARD_REPORTS,
          distribution: { eingesehenVon: "Bat Kdt", gehtAn: ["Kader", "Truppe (via Anschlagsbrett)"], zKAn: ["Bat Kanzlei"] },
          remarksDefault: "Rapporte:\nBR: Bataillonsrapport\nKR: Kompanierapport\nDR: Dienstrapport\nAR: Ausbildungsrapport",
        })
        .run();
      DEFAULT_UNITS.forEach((u, order) => tx.insert(s.unit).values({ wkId, order, ...u }).run());
      DEFAULT_CATEGORIES.forEach((c, order) => tx.insert(s.category).values({ wkId, order, ...c }).run());
      DEFAULT_TERMS.forEach((t, order) => tx.insert(s.termTemplate).values({ wkId, order, ...t }).run());
      for (let i = 0; i < input.weeks; i++) {
        const kvk = input.firstWeekKvk && i === 0;
        createWeekWithDays(tx, {
          wkId,
          index: i,
          label: `WKW${i}`,
          title: kvk ? "Wochenarbeitsplan KVK" : `Wochenarbeitsplan Woche ${i}`,
          startDate: addDaysIso(input.startDate, i * 7),
          kind: kvk ? "kvk" : "normal",
        });
      }
    });
    return toWkDto(wkRepo.byId(ctx.db, wkId)!);
  },
};

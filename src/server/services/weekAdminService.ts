import type { RequestContext } from "@/server/auth/context";
import { assertCanEditWk } from "@/server/auth/authorize";
import { badRequest, notFound } from "@/server/http/handler";
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
  remove(ctx: RequestContext, weekId: string) {
    const week = weekRepo.byId(ctx.db, weekId);
    if (!week) throw notFound("Woche nicht gefunden");
    assertCanEditWk(ctx, week.wkId);
    weekRepo.remove(ctx.db, weekId);
  },
};

import type { RequestContext } from "@/server/auth/context";
import { assertCanEditWk } from "@/server/auth/authorize";
import { notFound } from "@/server/http/handler";
import { categoryRepo, personnelRepo, termRepo, unitRepo } from "@/server/repositories/wkRepo";
import type { CategoryInput, PersonnelInput, TermInput, UnitInput } from "@/shared/schemas";

type Repo<TInsert, TRow> = {
  byId(db: RequestContext["db"], id: string): TRow | null;
  insert(db: RequestContext["db"], values: TInsert): TRow;
  update(db: RequestContext["db"], id: string, patch: Partial<TInsert>): TRow | null;
  remove(db: RequestContext["db"], id: string): void;
};

function crud<TInput extends object, TRow extends { wkId: string; createdAt: string; updatedAt: string }>(
  repo: Repo<TInput & { wkId: string }, TRow>,
  label: string,
) {
  const strip = (row: TRow) => {
    const { createdAt: _c, updatedAt: _u, ...rest } = row;
    return rest;
  };
  return {
    create(ctx: RequestContext, wkId: string, input: TInput) {
      assertCanEditWk(ctx, wkId);
      return strip(repo.insert(ctx.db, { ...input, wkId }));
    },
    update(ctx: RequestContext, id: string, patch: Partial<TInput>) {
      const existing = repo.byId(ctx.db, id);
      if (!existing) throw notFound(`${label} nicht gefunden`);
      assertCanEditWk(ctx, existing.wkId);
      return strip(repo.update(ctx.db, id, patch as Partial<TInput & { wkId: string }>)!);
    },
    remove(ctx: RequestContext, id: string) {
      const existing = repo.byId(ctx.db, id);
      if (!existing) throw notFound(`${label} nicht gefunden`);
      assertCanEditWk(ctx, existing.wkId);
      repo.remove(ctx.db, id);
    },
  };
}

export const unitService = crud<UnitInput, NonNullable<ReturnType<typeof unitRepo.byId>>>(unitRepo, "Zug");
export const personnelService = crud<PersonnelInput, NonNullable<ReturnType<typeof personnelRepo.byId>>>(personnelRepo, "Person");
export const categoryService = crud<CategoryInput, NonNullable<ReturnType<typeof categoryRepo.byId>>>(categoryRepo, "Kategorie");
export const termService = crud<TermInput, NonNullable<ReturnType<typeof termRepo.byId>>>(termRepo, "Begriff");

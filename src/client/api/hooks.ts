"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  BlockInput,
  BlockPatch,
  CategoryInput,
  DayPatch,
  FootnoteInput,
  FootnotePatch,
  LaneConfigInput,
  PersonnelInput,
  SettingsPatch,
  TermInput,
  UnitInput,
  WeekCreate,
  WeekPatch,
  WkCreate,
} from "@/shared/schemas";
import type {
  BlockDto,
  CategoryDto,
  DayDto,
  FootnoteDto,
  PersonnelDto,
  SettingsDto,
  TermTemplateDto,
  UnitDto,
  WeekBundle,
  WeekDto,
  WkBundle,
  WkDto,
} from "@/shared/types";
import { api } from "./http";

export const keys = {
  wks: ["wks"] as const,
  wk: (wkId: string) => ["wk", wkId] as const,
  week: (weekId: string) => ["week", weekId] as const,
  tagesbefehl: (dayId: string) => ["tagesbefehl", dayId] as const,
};

function onError(err: unknown) {
  toast.error(err instanceof Error ? err.message : "Unbekannter Fehler");
}

export function useWks() {
  return useQuery({ queryKey: keys.wks, queryFn: () => api.get<WkDto[]>("/api/wks") });
}

export function useWkBundle(wkId: string, initialData?: WkBundle) {
  return useQuery({ queryKey: keys.wk(wkId), queryFn: () => api.get<WkBundle>(`/api/wks/${wkId}`), initialData });
}

export function useCreateWk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WkCreate) => api.post<WkDto>("/api/wks", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.wks }),
    onError,
  });
}

export function useUpdateSettings(wkId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: SettingsPatch) => api.patch<SettingsDto>(`/api/wks/${wkId}/settings`, patch),
    onSuccess: (settings) => {
      qc.setQueryData<WkBundle>(keys.wk(wkId), (old) => (old ? { ...old, settings } : old));
      toast.success("Gespeichert");
    },
    onError,
  });
}

/** Generische Stammdaten-Mutationen (Personal, Züge, Kategorien, Begriffe). */
function useMasterCrud<TInput, TDto extends { id: string }>(wkId: string, segment: string, bundleKey: keyof WkBundle) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: keys.wk(wkId) });
  const create = useMutation({
    mutationFn: (input: TInput) => api.post<TDto>(`/api/wks/${wkId}/${segment}`, input),
    onSuccess: invalidate,
    onError,
  });
  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<TInput> }) => api.patch<TDto>(`/api/${segment}/${id}`, patch),
    onSuccess: invalidate,
    onError,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/api/${segment}/${id}`),
    onSuccess: invalidate,
    onError,
  });
  void bundleKey;
  return { create, update, remove };
}

export const usePersonnelCrud = (wkId: string) => useMasterCrud<PersonnelInput, PersonnelDto>(wkId, "personnel", "personnel");
export const useUnitCrud = (wkId: string) => useMasterCrud<UnitInput, UnitDto>(wkId, "units", "units");
export const useCategoryCrud = (wkId: string) => useMasterCrud<CategoryInput, CategoryDto>(wkId, "categories", "categories");
export const useTermCrud = (wkId: string) => useMasterCrud<TermInput, TermTemplateDto>(wkId, "terms", "terms");

export function useCreateWeek(wkId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<WeekCreate, "wkId">) => api.post<WeekDto>(`/api/wks/${wkId}/weeks`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.wk(wkId) }),
    onError,
  });
}

export function useDeleteWeek(wkId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (weekId: string) => api.del(`/api/weeks/${weekId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.wk(wkId) }),
    onError,
  });
}

// ---------- Wochenraster ----------

export function useWeekBundle(weekId: string, initialData?: WeekBundle) {
  return useQuery({ queryKey: keys.week(weekId), queryFn: () => api.get<WeekBundle>(`/api/weeks/${weekId}`), initialData });
}

function patchBundle(qc: ReturnType<typeof useQueryClient>, weekId: string, fn: (b: WeekBundle) => WeekBundle) {
  qc.setQueryData<WeekBundle>(keys.week(weekId), (old) => (old ? fn(old) : old));
}

export function useUpdateWeek(weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: WeekPatch) => api.patch<WeekDto>(`/api/weeks/${weekId}`, patch),
    onSuccess: (week) => patchBundle(qc, weekId, (b) => ({ ...b, week })),
    onError,
  });
}

export function useUpdateDay(weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dayId, patch }: { dayId: string; patch: DayPatch }) => api.patch<DayDto>(`/api/days/${dayId}`, patch),
    onSuccess: (day) => patchBundle(qc, weekId, (b) => ({ ...b, days: b.days.map((d) => (d.id === day.id ? day : d)) })),
    onError,
  });
}

export function useConfigureLanes(weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LaneConfigInput) => api.put<{ affectedBlocks: number }>(`/api/weeks/${weekId}/lanes`, input),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: keys.week(weekId) });
      if (res.affectedBlocks > 0) toast.info(`${res.affectedBlocks} Block/Blöcke wurden an die neuen Spalten angepasst`);
    },
    onError,
  });
}

export function useCreateBlock(weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BlockInput) => api.post<BlockDto>("/api/blocks", input),
    onSuccess: (block) => patchBundle(qc, weekId, (b) => ({ ...b, blocks: [...b.blocks, block] })),
    onError,
  });
}

export function useUpdateBlock(weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: BlockPatch }) => api.patch<BlockDto>(`/api/blocks/${id}`, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: keys.week(weekId) });
      const previous = qc.getQueryData<WeekBundle>(keys.week(weekId));
      const { expectedUpdatedAt: _e, ...changes } = patch;
      patchBundle(qc, weekId, (b) => ({ ...b, blocks: b.blocks.map((x) => (x.id === id ? { ...x, ...changes } : x)) }));
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.week(weekId), ctx.previous);
      onError(err);
      qc.invalidateQueries({ queryKey: keys.week(weekId) });
    },
    onSuccess: (block) => patchBundle(qc, weekId, (b) => ({ ...b, blocks: b.blocks.map((x) => (x.id === block.id ? block : x)) })),
  });
}

export function useDuplicateBlock(weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<BlockDto>(`/api/blocks/${id}/duplicate`),
    onSuccess: (block) => patchBundle(qc, weekId, (b) => ({ ...b, blocks: [...b.blocks, block] })),
    onError,
  });
}

export function useDeleteBlock(weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/blocks/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.week(weekId) });
      const previous = qc.getQueryData<WeekBundle>(keys.week(weekId));
      patchBundle(qc, weekId, (b) => ({ ...b, blocks: b.blocks.filter((x) => x.id !== id) }));
      return { previous };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.week(weekId), ctx.previous);
      onError(err);
    },
  });
}

export function useCreateFootnote(weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FootnoteInput) => api.post<FootnoteDto>("/api/footnotes", input),
    onSuccess: (fn) => patchBundle(qc, weekId, (b) => ({ ...b, footnotes: [...b.footnotes, fn] })),
    onError,
  });
}

export function useUpdateFootnote(weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: FootnotePatch }) => api.patch<FootnoteDto>(`/api/footnotes/${id}`, patch),
    onMutate: async ({ id, patch }) => {
      const previous = qc.getQueryData<WeekBundle>(keys.week(weekId));
      patchBundle(qc, weekId, (b) => ({ ...b, footnotes: b.footnotes.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
      return { previous };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.week(weekId), ctx.previous);
      onError(err);
    },
    onSuccess: (fn) => patchBundle(qc, weekId, (b) => ({ ...b, footnotes: b.footnotes.map((f) => (f.id === fn.id ? fn : f)) })),
  });
}

export function useDeleteFootnote(weekId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/footnotes/${id}`),
    onSuccess: (_r, id) => patchBundle(qc, weekId, (b) => ({ ...b, footnotes: b.footnotes.filter((f) => f.id !== id) })),
    onError,
  });
}

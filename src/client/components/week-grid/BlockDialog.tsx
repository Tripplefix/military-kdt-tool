"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/client/components/common/Field";
import { NativeSelect } from "@/client/components/common/NativeSelect";
import { TimeInput } from "@/client/components/common/TimeInput";
import { cn } from "@/lib/utils";
import type { BlockInput } from "@/shared/schemas";
import type { BlockDto, CategoryDto, DayDto, FootnoteDto, LaneDto, TermTemplateDto } from "@/shared/types";
import { formatIsoDe } from "@/shared/time";
import { WEEKDAY_NAMES_DE } from "@/shared/constants";

export interface BlockDialogState {
  mode: "create" | "edit";
  block: Partial<BlockDto> & Pick<BlockDto, "dayId" | "startMin" | "endMin" | "laneStartOrder" | "laneSpan">;
}

interface Props {
  state: BlockDialogState | null;
  onClose: () => void;
  days: DayDto[];
  lanesByDay: Record<string, LaneDto[]>;
  categories: CategoryDto[];
  footnotes: FootnoteDto[];
  terms: TermTemplateDto[];
  defaultCategoryId?: string | null;
  onSave: (input: BlockInput, id?: string) => void;
  onDelete?: (id: string) => void;
}

function termOptions(terms: TermTemplateDto[], kind: TermTemplateDto["kind"]) {
  return terms.filter((t) => t.kind === kind).map((t) => (t.it ? `${t.de} / ${t.it}` : t.de));
}

export function BlockDialog(props: Props) {
  if (!props.state) return null;
  // key erzwingt ein frisches Formular je Block bzw. je neuem Dialog
  return <BlockForm key={props.state.block.id ?? `new-${props.state.block.dayId}-${props.state.block.startMin}-${props.state.block.laneStartOrder}`} {...props} state={props.state} />;
}

function BlockForm({ state, onClose, days, lanesByDay, categories, footnotes, terms, defaultCategoryId, onSave, onDelete }: Props & { state: BlockDialogState }) {
  const [form, setForm] = useState<BlockInput>(() => {
    const b = state.block;
    return {
      dayId: b.dayId,
      title: b.title ?? "",
      startMin: b.startMin,
      endMin: b.endMin,
      categoryId: b.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? null,
      location: b.location ?? "",
      responsibility: b.responsibility ?? "",
      remark: b.remark ?? "",
      footnoteId: b.footnoteId ?? null,
      laneStartOrder: b.laneStartOrder,
      laneSpan: b.laneSpan,
      sortKey: b.sortKey ?? 0,
    };
  });
  const [error, setError] = useState<string | null>(null);

  const lanes = lanesByDay[form.dayId] ?? [];
  const dayFootnotes = footnotes.filter((f) => f.dayId === form.dayId);
  const set = <K extends keyof BlockInput>(k: K, v: BlockInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  function toggleLane(i: number) {
    const start = form.laneStartOrder;
    const end = start + form.laneSpan - 1;
    if (i < start) return setForm((f) => ({ ...f, laneStartOrder: i, laneSpan: end - i + 1 }));
    if (i > end) return setForm((f) => ({ ...f, laneSpan: i - start + 1 }));
    if (i === start && form.laneSpan > 1) return setForm((f) => ({ ...f, laneStartOrder: i + 1, laneSpan: f.laneSpan - 1 }));
    if (i === end && form.laneSpan > 1) return setForm((f) => ({ ...f, laneSpan: f.laneSpan - 1 }));
    setForm((f) => ({ ...f, laneStartOrder: i, laneSpan: 1 }));
  }

  function submit() {
    if (!form.title.trim()) return setError("Aktivität fehlt");
    if (form.endMin <= form.startMin) return setError("Ende muss nach Beginn liegen");
    if (form.laneStartOrder + form.laneSpan > lanes.length) return setError("Spalten-Auswahl passt nicht zum Tag");
    onSave({ ...form, title: form.title.trim() }, state.block.id);
  }

  const dayOptions = days.map((d) => ({ value: d.id, label: `${WEEKDAY_NAMES_DE[d.weekday].slice(0, 2)} ${formatIsoDe(d.date)}` }));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit();
        }}
      >
        <DialogHeader>
          <DialogTitle>{state.mode === "create" ? "Neuer Block" : "Block bearbeiten"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Aktivität" className="sm:col-span-2">
            <Input list="terms-activity" value={form.title} autoFocus onChange={(e) => set("title", e.target.value)} />
            <datalist id="terms-activity">{termOptions(terms, "activity").map((t) => <option key={t} value={t} />)}</datalist>
          </Field>
          <Field label="Tag">
            <NativeSelect
              options={dayOptions}
              value={form.dayId}
              onChange={(e) => {
                const newLanes = lanesByDay[e.target.value] ?? [];
                const span = Math.min(form.laneSpan, newLanes.length);
                set("dayId", e.target.value);
                setForm((f) => ({ ...f, dayId: e.target.value, laneSpan: span, laneStartOrder: Math.min(f.laneStartOrder, Math.max(0, newLanes.length - span)) }));
              }}
              className="w-full"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Von"><TimeInput value={form.startMin} snap onChange={(v) => v != null && set("startMin", v)} /></Field>
            <Field label="Bis"><TimeInput value={form.endMin} snap onChange={(v) => v != null && set("endMin", v)} /></Field>
          </div>
          <Field label="Spalten (Klick = Bereich erweitern/verkürzen)" className="sm:col-span-2">
            <div className="flex flex-wrap gap-1">
              {lanes.map((l, i) => {
                const active = i >= form.laneStartOrder && i < form.laneStartOrder + form.laneSpan;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => toggleLane(i)}
                    className={cn("rounded-md border px-2 py-1 text-xs", active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted")}
                  >
                    {l.label}
                  </button>
                );
              })}
              <button
                type="button"
                className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                onClick={() => {
                  const units = lanes.filter((l) => l.kind === "unit").length;
                  setForm((f) => ({ ...f, laneStartOrder: 0, laneSpan: Math.max(1, units) }));
                }}
              >
                Alle Züge
              </button>
            </div>
          </Field>
          <Field label="Kategorie">
            <div className="flex items-center gap-2">
              <span className="inline-block size-5 rounded border" style={{ background: categories.find((c) => c.id === form.categoryId)?.color ?? "#fff" }} />
              <NativeSelect
                options={categories.map((c) => ({ value: c.id, label: c.label }))}
                placeholder="–"
                value={form.categoryId ?? ""}
                onChange={(e) => set("categoryId", e.target.value || null)}
                className="w-full"
              />
            </div>
          </Field>
          <Field label="Termine / Info (Nummer)">
            <NativeSelect
              options={dayFootnotes.map((f) => ({ value: f.id, label: `${f.number} – ${f.text || "(ohne Text)"}` }))}
              placeholder="–"
              value={form.footnoteId ?? ""}
              onChange={(e) => set("footnoteId", e.target.value || null)}
              className="w-full"
            />
          </Field>
          <Field label="Standort">
            <Input list="terms-location" value={form.location} onChange={(e) => set("location", e.target.value)} />
            <datalist id="terms-location">{termOptions(terms, "location").map((t) => <option key={t} value={t} />)}</datalist>
          </Field>
          <Field label="Verantwortung">
            <Input list="terms-responsibility" value={form.responsibility} onChange={(e) => set("responsibility", e.target.value)} />
            <datalist id="terms-responsibility">{termOptions(terms, "responsibility").map((t) => <option key={t} value={t} />)}</datalist>
          </Field>
          <Field label="Bemerkung (intern, nicht gedruckt)" className="sm:col-span-2">
            <Textarea rows={2} value={form.remark} onChange={(e) => set("remark", e.target.value)} />
          </Field>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div>
            {state.mode === "edit" && state.block.id && onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(state.block.id!)}>
                <Trash2 /> Löschen
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button onClick={submit}>Speichern</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Columns3, Copy, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BlurInput } from "@/client/components/common/BlurInput";
import { NativeSelect } from "@/client/components/common/NativeSelect";
import {
  useConfigureLanes,
  useCopyWeek,
  useCreateBlock,
  useCreateFootnote,
  useDeleteBlock,
  useDeleteFootnote,
  useUpdateBlock,
  useUpdateDay,
  useUpdateFootnote,
  useUpdateWeek,
  useWeekBundle,
} from "@/client/api/hooks";
import { GRID_SLOTS, WEEKDAY_NAMES_DE, WEEKDAY_NAMES_IT } from "@/shared/constants";
import { hourLabels, minutesToOffset } from "@/shared/gridGeometry";
import { formatIsoDe } from "@/shared/time";
import type { BlockDto, DayDto, FootnoteDto, LaneDto, WeekBundle } from "@/shared/types";
import { BlockDialog, type BlockDialogState } from "./BlockDialog";
import { DayColumn } from "./DayColumn";
import { DayFooter } from "./DayFooter";
import { FootnoteDialog, type FootnoteDialogState } from "./FootnoteDialog";
import { LaneConfigDialog } from "./LaneConfigDialog";
import { WeekSidebar } from "./WeekSidebar";
import { useGridInteractions } from "./useGridInteractions";
import "./grid.css";

const ZOOM_STEPS = [8, 11, 14, 18, 24];
const TIME_COL = 44;
const SIDEBAR_COL = 230;

interface Props {
  wkId: string;
  weekId: string;
  initialData: WeekBundle;
}

function TimeAxis({ rowPx }: { rowPx: number }) {
  return (
    <div className="relative border-r border-black/40 bg-muted/40" style={{ height: GRID_SLOTS * rowPx }}>
      {hourLabels().map((h) => (
        <div key={h.min} className="absolute right-1 -translate-y-1/2 font-mono text-[10px] leading-none" style={{ top: minutesToOffset(h.min, rowPx) }}>
          {h.label}
        </div>
      ))}
    </div>
  );
}

function dayWeight(lanes: LaneDto[]): number {
  return lanes.reduce((s, l) => s + l.widthWeight, 0) || 1;
}

export function WeekGrid({ wkId, weekId, initialData }: Props) {
  const { data } = useWeekBundle(weekId, initialData);
  const bundle = data ?? initialData;
  const { week, days, lanesByDay, blocks, footnotes, categories, personnel, settings, terms, units } = bundle;

  const [zoom, setZoom] = useState(2);
  const rowPx = ZOOM_STEPS[zoom];
  const [blockDialog, setBlockDialog] = useState<BlockDialogState | null>(null);
  const [footnoteDialog, setFootnoteDialog] = useState<FootnoteDialogState | null>(null);
  const [laneDialog, setLaneDialog] = useState(false);
  const [copyTarget, setCopyTarget] = useState("");
  const [lastCategoryId, setLastCategoryId] = useState<string | null>(null);
  const dayRefs = useRef(new Map<string, HTMLDivElement>());

  const createBlock = useCreateBlock(weekId);
  const updateBlock = useUpdateBlock(weekId);
  const deleteBlock = useDeleteBlock(weekId);
  const createFootnote = useCreateFootnote(weekId);
  const updateFootnote = useUpdateFootnote(weekId);
  const deleteFootnote = useDeleteFootnote(weekId);
  const updateDay = useUpdateDay(weekId);
  const updateWeek = useUpdateWeek(weekId);
  const configureLanes = useConfigureLanes(weekId);
  const copyWeek = useCopyWeek();

  const openBlock = useCallback((block: BlockDto) => setBlockDialog({ mode: "edit", block }), []);
  const openFootnote = useCallback((fn: FootnoteDto) => setFootnoteDialog({ mode: "edit", footnote: fn }), []);

  const removeBlockWithUndo = useCallback(
    (block: BlockDto) => {
      deleteBlock.mutate(block.id);
      const { id: _id, updatedAt: _u, ...data } = block;
      toast("Block gelöscht", {
        action: { label: "Rückgängig", onClick: () => createBlock.mutate(data) },
        duration: 6000,
      });
    },
    [createBlock, deleteBlock],
  );

  const interactions = useGridInteractions({
    rowPx,
    days,
    lanesByDay,
    dayRefs,
    onMoveBlock: (block, target, { duplicate }) => {
      if (duplicate) {
        const { id: _id, updatedAt: _u, ...data } = block;
        createBlock.mutate({ ...data, ...target });
      } else {
        updateBlock.mutate({ id: block.id, patch: { ...target, expectedUpdatedAt: block.updatedAt } });
      }
    },
    onResizeBlock: (block, patch) => updateBlock.mutate({ id: block.id, patch: { ...patch, expectedUpdatedAt: block.updatedAt } }),
    onMoveFootnote: (fn, patch) => updateFootnote.mutate({ id: fn.id, patch }),
    onMarqueeEnd: (m) => {
      if (m.laneKind === "info") setFootnoteDialog({ mode: "create", footnote: { dayId: m.dayId, startMin: m.startMin, endMin: m.endMin } });
      else setBlockDialog({ mode: "create", block: { dayId: m.dayId, startMin: m.startMin, endMin: m.endMin, laneStartOrder: m.laneStartOrder, laneSpan: m.laneSpan } });
    },
    onEmptyClick: (day: DayDto, laneIndex: number, startMin: number, lane) => {
      const endMin = Math.min(startMin + 30, 23 * 60);
      if (lane?.kind === "info") setFootnoteDialog({ mode: "create", footnote: { dayId: day.id, startMin, endMin } });
      else setBlockDialog({ mode: "create", block: { dayId: day.id, startMin, endMin, laneStartOrder: laneIndex, laneSpan: 1 } });
    },
  });

  // Vorschau während Drag/Resize auf die Daten anwenden
  const effectiveBlocks = useMemo(() => {
    const p = interactions.preview;
    if (!p?.blockId) return blocks;
    return blocks.map((b) => (b.id === p.blockId ? { ...b, ...p.target } : b));
  }, [blocks, interactions.preview]);
  const effectiveFootnotes = useMemo(() => {
    const p = interactions.preview;
    if (!p?.footnoteId) return footnotes;
    return footnotes.map((f) => (f.id === p.footnoteId ? { ...f, startMin: p.target.startMin, endMin: p.target.endMin } : f));
  }, [footnotes, interactions.preview]);

  const blocksByDay = useMemo(() => {
    const m: Record<string, BlockDto[]> = {};
    for (const b of effectiveBlocks) (m[b.dayId] ??= []).push(b);
    return m;
  }, [effectiveBlocks]);
  const footnotesByDay = useMemo(() => {
    const m: Record<string, FootnoteDto[]> = {};
    for (const f of effectiveFootnotes) (m[f.dayId] ??= []).push(f);
    return m;
  }, [effectiveFootnotes]);

  const gridTemplateColumns = useMemo(
    () => `${TIME_COL}px ${days.map((d) => `${dayWeight(lanesByDay[d.id] ?? [])}fr`).join(" ")} ${TIME_COL}px ${SIDEBAR_COL}px`,
    [days, lanesByDay],
  );

  const prevWeek = bundle.weeks.find((w) => w.index === week.index - 1);
  const nextWeek = bundle.weeks.find((w) => w.index === week.index + 1);
  const registerRef = useCallback((dayId: string, el: HTMLDivElement | null) => {
    if (el) dayRefs.current.set(dayId, el);
    else dayRefs.current.delete(dayId);
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      {/* Kopfzeile */}
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" disabled={!prevWeek} nativeButton={!prevWeek} render={prevWeek ? <Link href={`/wk/${wkId}/week/${prevWeek.index}`} /> : undefined}>
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" disabled={!nextWeek} nativeButton={!nextWeek} render={nextWeek ? <Link href={`/wk/${wkId}/week/${nextWeek.index}`} /> : undefined}>
            <ChevronRight />
          </Button>
        </div>
        <BlurInput className="h-8 w-72 text-base font-semibold" value={week.title} onCommit={(title) => updateWeek.mutate({ title })} />
        <span className="text-sm text-muted-foreground">
          {formatIsoDe(days[0]?.date ?? week.startDate)} bis {formatIsoDe(days[6]?.date ?? week.startDate)} · {week.label}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setLaneDialog(true)}>
            <Columns3 /> Spalten
          </Button>
          <div className="flex items-center gap-1">
            <NativeSelect
              size="sm"
              options={bundle.weeks.filter((w) => w.id !== weekId).map((w) => ({ value: w.id, label: w.label }))}
              placeholder="Kopieren nach…"
              value={copyTarget}
              onChange={(e) => setCopyTarget(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={!copyTarget || copyWeek.isPending}
              title="Spalten, Blöcke und Termine/Info dieser Woche in die Zielwoche kopieren"
              onClick={() => {
                copyWeek.mutate(
                  { sourceWeekId: weekId, targetWeekId: copyTarget, overwrite: false },
                  {
                    onError: (err: unknown) => {
                      if (err instanceof Error && err.message.includes("Überschreiben") && window.confirm("Die Zielwoche enthält bereits Blöcke. Alles überschreiben?")) {
                        copyWeek.mutate({ sourceWeekId: weekId, targetWeekId: copyTarget, overwrite: true });
                      }
                    },
                  },
                );
              }}
            >
              <Copy /> Kopieren
            </Button>
          </div>
          <Button variant="ghost" size="icon-sm" disabled={zoom === 0} onClick={() => setZoom((z) => Math.max(0, z - 1))} title="Verkleinern">
            <ZoomOut />
          </Button>
          <Button variant="ghost" size="icon-sm" disabled={zoom === ZOOM_STEPS.length - 1} onClick={() => setZoom((z) => Math.min(ZOOM_STEPS.length - 1, z + 1))} title="Vergrössern">
            <ZoomIn />
          </Button>
        </div>
      </div>

      {/* Raster */}
      <div className="flex-1 overflow-auto">
        <div className="grid min-w-[1100px] text-xs" style={{ gridTemplateColumns }}>
          {/* Zeile 1: Tagesköpfe */}
          <div className="border-b border-r border-black/40 bg-muted/40 p-1 text-center leading-tight">
            Zeit
            <br />
            heure
          </div>
          {days.map((d) => (
            <div key={d.id} className="border-b border-r border-black/40 bg-muted/40 p-1 text-center leading-tight">
              <div className="font-semibold">
                {WEEKDAY_NAMES_DE[d.weekday]} / {WEEKDAY_NAMES_IT[d.weekday]}
              </div>
              <div>{formatIsoDe(d.date)}</div>
            </div>
          ))}
          <div className="border-b border-r border-black/40 bg-muted/40 p-1 text-center leading-tight">
            Zeit
            <br />
            heure
          </div>
          <div className="border-b border-black/40 bg-muted/40 p-1 text-center font-semibold">Bemerkungen / Observations</div>

          {/* Zeile 2: Spaltenköpfe (Lanes) */}
          <div className="border-b border-r border-black/40 bg-muted/40" />
          {days.map((d) => {
            const lanes = lanesByDay[d.id] ?? [];
            const total = dayWeight(lanes);
            return (
              <div key={d.id} className="flex h-[72px] border-b border-r border-black/40 bg-muted/20">
                {lanes.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-end justify-center overflow-hidden border-r border-black/15 pb-1 last:border-r-0"
                    style={{ width: `${(l.widthWeight / total) * 100}%` }}
                    title={l.label}
                  >
                    <span className={l.widthWeight < 0.9 || lanes.length > 4 ? "wap-vertical-text text-[10px] leading-none" : "text-[10px] leading-none"}>{l.label}</span>
                  </div>
                ))}
              </div>
            );
          })}
          <div className="border-b border-r border-black/40 bg-muted/40" />
          <div className="border-b border-black/40 bg-muted/20 p-1 text-[10px] text-muted-foreground">
            Stand: {week.standDate ? formatIsoDe(week.standDate) : "–"} · Einheit: {settings.companyName}
          </div>

          {/* Zeile 3: Zeitachse, Tage, Seitenleiste */}
          <TimeAxis rowPx={rowPx} />
          {days.map((d) => (
            <DayColumn
              key={d.id}
              day={d}
              lanes={lanesByDay[d.id] ?? []}
              blocks={blocksByDay[d.id] ?? []}
              footnotes={footnotesByDay[d.id] ?? []}
              categories={categories}
              rowPx={rowPx}
              selectedBlockId={blockDialog?.block.id ?? interactions.preview?.blockId ?? null}
              registerRef={registerRef}
              marquee={interactions.marquee?.dayId === d.id ? interactions.marquee : null}
              onEmptyPointerDown={interactions.onEmptyPointerDown}
              onBlockPointerDown={interactions.onBlockPointerDown}
              onResizeStart={interactions.onResizeStart}
              onFootnotePointerDown={interactions.onFootnotePointerDown}
              onOpenBlock={openBlock}
              onOpenFootnote={openFootnote}
            />
          ))}
          <TimeAxis rowPx={rowPx} />
          <div className="row-span-2 border-l border-black/20">
            <WeekSidebar week={week} settings={settings} personnel={personnel} onPatch={(patch) => updateWeek.mutate(patch)} />
          </div>

          {/* Zeile 4: Fusszeile Termine/Info + Tagesof */}
          <div className="flex flex-col items-center justify-center border-r border-t border-black/40 bg-muted/40 p-1 text-center text-[10px] leading-tight">
            <span className="wap-vertical-text">Termine / Info</span>
            <span className="mt-2 border-t border-black/40 pt-1">Tagesof</span>
          </div>
          {days.map((d) => (
            <div key={d.id} className="min-h-[110px] border-t border-black/40">
              <DayFooter
                day={d}
                footnotes={footnotesByDay[d.id] ?? []}
                personnel={personnel}
                onOpenFootnote={openFootnote}
                onAddFootnote={(day) => setFootnoteDialog({ mode: "create", footnote: { dayId: day.id, startMin: 12 * 60, endMin: 12 * 60 + 30 } })}
                onTagesofChange={(day, personnelId) => updateDay.mutate({ dayId: day.id, patch: { tagesofPersonnelId: personnelId } })}
              />
            </div>
          ))}
          <div className="border-r border-t border-black/40 bg-muted/40" />
        </div>
      </div>

      <p className="border-t px-3 py-1 text-[11px] text-muted-foreground">
        Klick auf freie Fläche = neuer Block (30 min) · Aufziehen = Block über Zeit und Spalten · Ziehen = verschieben (Shift: nur Zeit, Alt: duplizieren) · Ränder ziehen = Dauer/Spalten ändern · Klick auf Block = bearbeiten · Beso-Spalte = Termine/Info
      </p>

      <BlockDialog
        state={blockDialog}
        onClose={() => setBlockDialog(null)}
        days={days}
        lanesByDay={lanesByDay}
        categories={categories}
        footnotes={footnotes}
        terms={terms}
        defaultCategoryId={lastCategoryId}
        onSave={(input, id) => {
          setLastCategoryId(input.categoryId);
          if (id) updateBlock.mutate({ id, patch: input }, { onSuccess: () => setBlockDialog(null) });
          else createBlock.mutate(input, { onSuccess: () => setBlockDialog(null) });
        }}
        onDelete={(id) => {
          const block = blocks.find((b) => b.id === id);
          if (block) removeBlockWithUndo(block);
          setBlockDialog(null);
        }}
      />
      <FootnoteDialog
        state={footnoteDialog}
        onClose={() => setFootnoteDialog(null)}
        onSave={(data, id) => {
          if (id) updateFootnote.mutate({ id, patch: { number: data.number, text: data.text, startMin: data.startMin, endMin: data.endMin } }, { onSuccess: () => setFootnoteDialog(null) });
          else createFootnote.mutate(data, { onSuccess: () => setFootnoteDialog(null) });
        }}
        onDelete={(id) => {
          deleteFootnote.mutate(id);
          setFootnoteDialog(null);
        }}
      />
      <LaneConfigDialog
        open={laneDialog}
        onClose={() => setLaneDialog(false)}
        days={days}
        weekLanes={bundle.weekLanes}
        lanesByDay={lanesByDay}
        units={units}
        onApply={(input) => {
          configureLanes.mutate(input);
          setLaneDialog(false);
        }}
      />
    </div>
  );
}

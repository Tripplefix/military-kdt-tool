"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlurInput } from "@/client/components/common/BlurInput";
import {
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
import { WeekSidebar } from "./WeekSidebar";
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
  const { week, days, lanesByDay, blocks, footnotes, categories, personnel, settings, terms } = bundle;

  const [zoom, setZoom] = useState(2);
  const rowPx = ZOOM_STEPS[zoom];
  const [blockDialog, setBlockDialog] = useState<BlockDialogState | null>(null);
  const [footnoteDialog, setFootnoteDialog] = useState<FootnoteDialogState | null>(null);
  const [lastCategoryId, setLastCategoryId] = useState<string | null>(null);

  const createBlock = useCreateBlock(weekId);
  const updateBlock = useUpdateBlock(weekId);
  const deleteBlock = useDeleteBlock(weekId);
  const createFootnote = useCreateFootnote(weekId);
  const updateFootnote = useUpdateFootnote(weekId);
  const deleteFootnote = useDeleteFootnote(weekId);
  const updateDay = useUpdateDay(weekId);
  const updateWeek = useUpdateWeek(weekId);

  const blocksByDay = useMemo(() => {
    const m: Record<string, BlockDto[]> = {};
    for (const b of blocks) (m[b.dayId] ??= []).push(b);
    return m;
  }, [blocks]);
  const footnotesByDay = useMemo(() => {
    const m: Record<string, FootnoteDto[]> = {};
    for (const f of footnotes) (m[f.dayId] ??= []).push(f);
    return m;
  }, [footnotes]);

  const gridTemplateColumns = useMemo(
    () => `${TIME_COL}px ${days.map((d) => `${dayWeight(lanesByDay[d.id] ?? [])}fr`).join(" ")} ${TIME_COL}px ${SIDEBAR_COL}px`,
    [days, lanesByDay],
  );

  const prevWeek = bundle.weeks.find((w) => w.index === week.index - 1);
  const nextWeek = bundle.weeks.find((w) => w.index === week.index + 1);

  const onEmptyClick = useCallback(
    (day: DayDto, laneIndex: number, startMin: number, lane: LaneDto) => {
      const endMin = Math.min(startMin + 30, 23 * 60);
      if (lane?.kind === "info") {
        setFootnoteDialog({ mode: "create", footnote: { dayId: day.id, startMin, endMin } });
        return;
      }
      setBlockDialog({ mode: "create", block: { dayId: day.id, startMin, endMin, laneStartOrder: laneIndex, laneSpan: 1 } });
    },
    [],
  );

  const openBlock = useCallback((block: BlockDto) => setBlockDialog({ mode: "edit", block }), []);
  const openFootnote = useCallback((fn: FootnoteDto) => setFootnoteDialog({ mode: "edit", footnote: fn }), []);

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
          <Button variant="ghost" size="icon-sm" disabled={zoom === 0} onClick={() => setZoom((z) => Math.max(0, z - 1))} title="Verkleinern">
            <ZoomOut />
          </Button>
          <Button variant="ghost" size="icon-sm" disabled={zoom === ZOOM_STEPS.length - 1} onClick={() => setZoom((z) => Math.min(ZOOM_STEPS.length - 1, z + 1))} title="Vergrössern">
            <ZoomIn />
          </Button>
          <span className="ml-2 text-xs text-muted-foreground">Einheit: {settings.companyName}</span>
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
                    <span className={l.widthWeight < 0.7 || lanes.length > 5 ? "wap-vertical-text text-[10px] leading-none" : "text-[10px] leading-none"}>{l.label}</span>
                  </div>
                ))}
              </div>
            );
          })}
          <div className="border-b border-r border-black/40 bg-muted/40" />
          <div className="border-b border-black/40 bg-muted/20 p-1 text-[10px] text-muted-foreground">
            Stand: {week.standDate ? formatIsoDe(week.standDate) : "–"}
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
              selectedBlockId={blockDialog?.block.id ?? null}
              onEmptyClick={onEmptyClick}
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
          deleteBlock.mutate(id);
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
    </div>
  );
}

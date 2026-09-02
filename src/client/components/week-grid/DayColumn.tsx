"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { GRID_SLOTS } from "@/shared/constants";
import { durationToSize, minutesToOffset, offsetToMinutes } from "@/shared/gridGeometry";
import { laneAtFraction, laneSlots, layoutOverlaps, spanSlot } from "@/shared/gridLayout";
import type { BlockDto, CategoryDto, DayDto, FootnoteDto, LaneDto } from "@/shared/types";
import { BlockView } from "./BlockView";
import { FootnoteMarker } from "./FootnoteMarker";

export interface DayColumnProps {
  day: DayDto;
  lanes: LaneDto[];
  blocks: BlockDto[];
  footnotes: FootnoteDto[];
  categories: CategoryDto[];
  rowPx: number;
  selectedBlockId?: string | null;
  printMode?: boolean;
  onEmptyPointerDown?: (e: ReactPointerEvent<HTMLDivElement>, day: DayDto, laneIndex: number, startMin: number) => void;
  onOpenBlock?: (block: BlockDto) => void;
  onBlockPointerDown?: (e: ReactPointerEvent<HTMLDivElement>, block: BlockDto) => void;
  onResizeStart?: (e: ReactPointerEvent<HTMLDivElement>, block: BlockDto, edge: "top" | "bottom" | "left" | "right") => void;
  onOpenFootnote?: (fn: FootnoteDto) => void;
  onFootnotePointerDown?: (e: ReactPointerEvent<HTMLDivElement>, fn: FootnoteDto) => void;
  /** Aufzieh-Rechteck (neuer Block) */
  marquee?: { startMin: number; endMin: number; laneStartOrder: number; laneSpan: number } | null;
  registerRef?: (dayId: string, el: HTMLDivElement | null) => void;
}

export function DayColumn(props: DayColumnProps) {
  const { day, lanes, blocks, footnotes, categories, rowPx, selectedBlockId, printMode } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [widthPx, setWidthPx] = useState(0);
  const slots = useMemo(() => laneSlots(lanes), [lanes]);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const placements = useMemo(() => layoutOverlaps(blocks), [blocks]);
  const infoLaneIndex = Math.max(
    0,
    lanes.findIndex((l) => l.kind === "info") === -1 ? lanes.length - 1 : lanes.findIndex((l) => l.kind === "info"),
  );

  useEffect(() => {
    const el = ref.current;
    props.registerRef?.(day.id, el);
    if (!el) return;
    const ro = new ResizeObserver(() => setWidthPx(el.clientWidth));
    ro.observe(el);
    setWidthPx(el.clientWidth);
    return () => {
      ro.disconnect();
      props.registerRef?.(day.id, null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day.id]);

  const height = GRID_SLOTS * rowPx;

  function hitTest(e: ReactPointerDown) {
    const rect = ref.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = e.clientY - rect.top;
    return { laneIndex: laneAtFraction(slots, x), startMin: offsetToMinutes(y, rowPx) };
  }
  type ReactPointerDown = { clientX: number; clientY: number };

  return (
    <div
      ref={ref}
      className="wap-day-body relative border-r border-black/40"
      style={{ height, ["--row" as string]: `${rowPx}px` }}
      onPointerDown={(e) => {
        if (printMode || e.target !== e.currentTarget) return;
        const { laneIndex, startMin } = hitTest(e);
        props.onEmptyPointerDown?.(e, day, laneIndex, startMin);
      }}
    >
      {/* Lane-Hintergründe und Trennlinien */}
      {slots.map((s, i) => (
        <div
          key={lanes[i].id}
          className="wap-lane-bg pointer-events-none absolute inset-y-0 border-r border-black/15 last:border-r-0"
          data-kind={lanes[i].kind}
          style={{ left: `${s.left * 100}%`, width: `${s.width * 100}%` }}
        />
      ))}

      {blocks.map((b) => {
        const span = spanSlot(slots, b.laneStartOrder, b.laneSpan);
        const pl = placements.get(b.id) ?? { column: 0, columns: 1 };
        const colW = span.width / pl.columns;
        const left = span.left + colW * pl.column;
        const top = minutesToOffset(b.startMin, rowPx);
        const h = durationToSize(b.startMin, b.endMin, rowPx);
        const style: CSSProperties = {
          left: `calc(${left * 100}% + 1px)`,
          width: `calc(${colW * 100}% - 2px)`,
          top: top + 1,
          height: Math.max(h - 2, 4),
          zIndex: b.laneSpan > 1 ? 5 : 10 + pl.column,
        };
        return (
          <BlockView
            key={b.id}
            block={b}
            category={b.categoryId ? catById.get(b.categoryId) : undefined}
            style={style}
            widthPx={widthPx * colW}
            heightPx={h}
            selected={selectedBlockId === b.id}
            printMode={printMode}
            onOpen={props.onOpenBlock}
            onPointerDown={props.onBlockPointerDown}
            onResizeStart={props.onResizeStart}
          />
        );
      })}

      {footnotes.map((f) => {
        const slot = slots[infoLaneIndex] ?? { left: 0.9, width: 0.1 };
        const top = minutesToOffset(f.startMin, rowPx);
        const h = durationToSize(f.startMin, f.endMin, rowPx);
        return (
          <FootnoteMarker
            key={f.id}
            footnote={f}
            style={{ left: `calc(${slot.left * 100}% + 1px)`, width: `calc(${slot.width * 100}% - 2px)`, top: top + 1, height: Math.max(h - 2, 10), zIndex: 20 }}
            printMode={printMode}
            onOpen={props.onOpenFootnote}
            onPointerDown={props.onFootnotePointerDown}
          />
        );
      })}
      {props.marquee && (() => {
        const span = spanSlot(slots, props.marquee.laneStartOrder, props.marquee.laneSpan);
        return (
          <div
            className="pointer-events-none absolute rounded-sm border-2 border-dashed border-blue-500 bg-blue-500/15"
            style={{
              left: `${span.left * 100}%`,
              width: `${span.width * 100}%`,
              top: minutesToOffset(props.marquee.startMin, rowPx),
              height: durationToSize(props.marquee.startMin, props.marquee.endMin, rowPx),
              zIndex: 40,
            }}
          />
        );
      })()}
    </div>
  );
}

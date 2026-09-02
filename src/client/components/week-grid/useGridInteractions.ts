"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { GRID_END_MIN, GRID_START_MIN, SLOT_MIN } from "@/shared/constants";
import { offsetToMinutes } from "@/shared/gridGeometry";
import { laneAtFraction, laneSlots } from "@/shared/gridLayout";
import { clampSpan } from "@/shared/lanes";
import { snap15 } from "@/shared/time";
import type { BlockDto, DayDto, FootnoteDto, LaneDto } from "@/shared/types";

export interface BlockPreview {
  dayId: string;
  startMin: number;
  endMin: number;
  laneStartOrder: number;
  laneSpan: number;
}

export interface Marquee extends BlockPreview {
  laneKind: LaneDto["kind"] | undefined;
}

export type ResizeEdge = "top" | "bottom" | "left" | "right";

interface Options {
  rowPx: number;
  days: DayDto[];
  lanesByDay: Record<string, LaneDto[]>;
  /** Tages-Container für Treffer-Tests */
  dayRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onMoveBlock: (block: BlockDto, target: BlockPreview, opts: { duplicate: boolean }) => void;
  onResizeBlock: (block: BlockDto, patch: Partial<BlockPreview>) => void;
  onMoveFootnote: (fn: FootnoteDto, patch: { startMin: number; endMin: number }) => void;
  onMarqueeEnd: (m: Marquee) => void;
  onEmptyClick: (day: DayDto, laneIndex: number, startMin: number, lane: LaneDto | undefined) => void;
}

type Drag =
  | { kind: "move"; block: BlockDto; grabOffsetPx: number; grabLaneOffset: number; startX: number; startY: number; moved: boolean; el: HTMLElement }
  | { kind: "resize"; block: BlockDto; edge: ResizeEdge; startX: number; startY: number; moved: boolean; el: HTMLElement }
  | { kind: "footnote"; footnote: FootnoteDto; grabOffsetPx: number; startX: number; startY: number; moved: boolean; el: HTMLElement }
  | { kind: "marquee"; day: DayDto; laneIndex: number; startMin: number; startX: number; startY: number; moved: boolean };

const THRESHOLD = 4;

/**
 * Pointer-basierte Interaktionen im Wochenraster: Verschieben (auch über Tage),
 * Grössenänderung (Zeit und Spalten), Aufziehen neuer Blöcke, Termine/Info verschieben.
 * Shift = nur Zeitachse, Alt = duplizieren.
 */
export function useGridInteractions(o: Options) {
  type Preview = { blockId?: string; footnoteId?: string; target: BlockPreview };
  const dragRef = useRef<Drag | null>(null);
  const [preview, setPreviewState] = useState<Preview | null>(null);
  const [marquee, setMarqueeState] = useState<Marquee | null>(null);
  // Refs spiegeln den letzten Stand für Event-Handler (kein Zugriff im Render, keine Seiteneffekte in Updatern)
  const previewRef = useRef<Preview | null>(null);
  const marqueeRef = useRef<Marquee | null>(null);
  const optsRef = useRef(o);
  useEffect(() => {
    optsRef.current = o;
  });
  const setPreview = useCallback((p: Preview | null) => {
    previewRef.current = p;
    setPreviewState(p);
  }, []);
  const setMarquee = useCallback((m: Marquee | null) => {
    marqueeRef.current = m;
    setMarqueeState(m);
  }, []);

  /** Tag + Position (Lane-Index, Minuten) unter dem Zeiger. */
  const hit = useCallback((clientX: number, clientY: number, offsetPx = 0) => {
    const { dayRefs, lanesByDay, days, rowPx } = optsRef.current;
    let best: { day: DayDto; rect: DOMRect } | null = null;
    for (const day of days) {
      const el = dayRefs.current.get(day.id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX < rect.right) {
        best = { day, rect };
        break;
      }
      // ausserhalb: nächstgelegener Tag
      if (!best || Math.abs(clientX - (rect.left + rect.width / 2)) < Math.abs(clientX - (best.rect.left + best.rect.width / 2))) best = { day, rect };
    }
    if (!best) return null;
    const lanes = lanesByDay[best.day.id] ?? [];
    const slots = laneSlots(lanes);
    const x = (clientX - best.rect.left) / best.rect.width;
    const laneIndex = laneAtFraction(slots, Math.max(0, Math.min(0.999, x)));
    const min = offsetToMinutes(clientY - best.rect.top - offsetPx, rowPx);
    return { day: best.day, lanes, laneIndex, min, rect: best.rect };
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;
      if (!d.moved) {
        if (Math.abs(e.clientX - d.startX) < THRESHOLD && Math.abs(e.clientY - d.startY) < THRESHOLD) return;
        d.moved = true;
        if ("el" in d) d.el.dataset.dragged = "1";
      }
      const { lanesByDay } = optsRef.current;

      if (d.kind === "move") {
        const h = hit(e.clientX, e.clientY, d.grabOffsetPx);
        if (!h) return;
        const b = d.block;
        const duration = b.endMin - b.startMin;
        const timeOnly = e.shiftKey;
        const dayId = timeOnly ? b.dayId : h.day.id;
        const lanes = lanesByDay[dayId] ?? [];
        const laneStart = timeOnly ? b.laneStartOrder : h.laneIndex - d.grabLaneOffset;
        const span = clampSpan({ laneStartOrder: laneStart, laneSpan: b.laneSpan }, lanes.length);
        const startMin = Math.max(GRID_START_MIN, Math.min(h.min, GRID_END_MIN - duration));
        setPreview({ blockId: b.id, target: { dayId, startMin, endMin: startMin + duration, ...span } });
      } else if (d.kind === "resize") {
        const b = d.block;
        const h = hit(e.clientX, e.clientY);
        if (!h) return;
        const dayEl = optsRef.current.dayRefs.current.get(b.dayId);
        const rect = dayEl?.getBoundingClientRect();
        const minAtPointer = rect ? offsetToMinutes(e.clientY - rect.top, optsRef.current.rowPx) : h.min;
        const lanes = lanesByDay[b.dayId] ?? [];
        let target: BlockPreview = { dayId: b.dayId, startMin: b.startMin, endMin: b.endMin, laneStartOrder: b.laneStartOrder, laneSpan: b.laneSpan };
        if (d.edge === "top") target.startMin = Math.min(snap15(minAtPointer), b.endMin - SLOT_MIN);
        if (d.edge === "bottom") target.endMin = Math.max(snap15(minAtPointer), b.startMin + SLOT_MIN);
        if (d.edge === "left" || d.edge === "right") {
          // Lane unter dem Zeiger innerhalb des eigenen Tages
          const slots = laneSlots(lanes);
          const x = rect ? (e.clientX - rect.left) / rect.width : 0;
          const li = laneAtFraction(slots, Math.max(0, Math.min(0.999, x)));
          const end = b.laneStartOrder + b.laneSpan - 1;
          if (d.edge === "left") {
            const ns = Math.min(li, end);
            target = { ...target, laneStartOrder: ns, laneSpan: end - ns + 1 };
          } else {
            target = { ...target, laneSpan: Math.max(1, li - b.laneStartOrder + 1) };
          }
          target = { ...target, ...clampSpan(target, lanes.length) };
        }
        setPreview({ blockId: b.id, target });
      } else if (d.kind === "footnote") {
        const f = d.footnote;
        const dayEl = optsRef.current.dayRefs.current.get(f.dayId);
        const rect = dayEl?.getBoundingClientRect();
        if (!rect) return;
        const duration = f.endMin - f.startMin;
        const startMin = Math.max(GRID_START_MIN, Math.min(offsetToMinutes(e.clientY - rect.top - d.grabOffsetPx, optsRef.current.rowPx), GRID_END_MIN - duration));
        setPreview({ footnoteId: f.id, target: { dayId: f.dayId, startMin, endMin: startMin + duration, laneStartOrder: 0, laneSpan: 1 } });
      } else if (d.kind === "marquee") {
        const dayEl = optsRef.current.dayRefs.current.get(d.day.id);
        const rect = dayEl?.getBoundingClientRect();
        if (!rect) return;
        const lanes = lanesByDay[d.day.id] ?? [];
        const slots = laneSlots(lanes);
        const x = (e.clientX - rect.left) / rect.width;
        const li = laneAtFraction(slots, Math.max(0, Math.min(0.999, x)));
        const cur = offsetToMinutes(e.clientY - rect.top, optsRef.current.rowPx);
        const a = Math.min(d.startMin, cur);
        const bmin = Math.max(d.startMin, cur);
        const laneStartOrder = Math.min(d.laneIndex, li);
        const laneSpan = Math.abs(li - d.laneIndex) + 1;
        setMarquee({ dayId: d.day.id, startMin: a, endMin: Math.max(bmin, a + SLOT_MIN), laneStartOrder, laneSpan, laneKind: lanes[d.laneIndex]?.kind });
      }
    }

    function onUp(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;
      const cb = optsRef.current;
      if ("el" in d) {
        const el = d.el;
        setTimeout(() => delete el.dataset.dragged, 0);
      }
      const p = previewRef.current;
      const m = marqueeRef.current;
      setPreview(null);
      setMarquee(null);
      if (d.moved && p) {
        if (d.kind === "move") cb.onMoveBlock(d.block, p.target, { duplicate: e.altKey });
        else if (d.kind === "resize") cb.onResizeBlock(d.block, p.target);
        else if (d.kind === "footnote") cb.onMoveFootnote(d.footnote, { startMin: p.target.startMin, endMin: p.target.endMin });
      }
      if (d.kind === "marquee") {
        if (d.moved && m) cb.onMarqueeEnd(m);
        else if (!d.moved) {
          const lanes = cb.lanesByDay[d.day.id] ?? [];
          cb.onEmptyClick(d.day, d.laneIndex, d.startMin, lanes[d.laneIndex]);
        }
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [hit, setPreview, setMarquee]);

  const onBlockPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, block: BlockDto) => {
      if (e.button !== 0) return;
      const h = hit(e.clientX, e.clientY);
      const dayEl = optsRef.current.dayRefs.current.get(block.dayId);
      const rect = dayEl?.getBoundingClientRect();
      const blockTopPx = rect ? ((block.startMin - GRID_START_MIN) / SLOT_MIN) * optsRef.current.rowPx : 0;
      const grabOffsetPx = rect ? e.clientY - rect.top - blockTopPx : 0;
      const grabLaneOffset = h ? Math.max(0, Math.min(block.laneSpan - 1, h.laneIndex - block.laneStartOrder)) : 0;
      dragRef.current = { kind: "move", block, grabOffsetPx, grabLaneOffset, startX: e.clientX, startY: e.clientY, moved: false, el: e.currentTarget };
    },
    [hit],
  );

  const onResizeStart = useCallback((e: ReactPointerEvent<HTMLDivElement>, block: BlockDto, edge: ResizeEdge) => {
    if (e.button !== 0) return;
    const el = (e.currentTarget.parentElement ?? e.currentTarget) as HTMLElement;
    dragRef.current = { kind: "resize", block, edge, startX: e.clientX, startY: e.clientY, moved: false, el };
  }, []);

  const onFootnotePointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>, footnote: FootnoteDto) => {
    if (e.button !== 0) return;
    const dayEl = optsRef.current.dayRefs.current.get(footnote.dayId);
    const rect = dayEl?.getBoundingClientRect();
    const topPx = ((footnote.startMin - GRID_START_MIN) / SLOT_MIN) * optsRef.current.rowPx;
    const grabOffsetPx = rect ? e.clientY - rect.top - topPx : 0;
    dragRef.current = { kind: "footnote", footnote, grabOffsetPx, startX: e.clientX, startY: e.clientY, moved: false, el: e.currentTarget };
  }, []);

  const onEmptyPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>, day: DayDto, laneIndex: number, startMin: number) => {
    if (e.button !== 0) return;
    dragRef.current = { kind: "marquee", day, laneIndex, startMin, startX: e.clientX, startY: e.clientY, moved: false };
  }, []);

  return { preview, marquee, onBlockPointerDown, onResizeStart, onFootnotePointerDown, onEmptyPointerDown };
}

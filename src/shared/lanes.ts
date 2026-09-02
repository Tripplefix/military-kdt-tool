import type { LaneKind } from "./constants";

export interface LaneDef {
  key: string;
  label: string;
  kind: LaneKind;
  widthWeight: number;
  zugKey: string | null;
}

export type LaneProfileKey = "kvk" | "normal" | "weekend";

const RAP: LaneDef = { key: "rap", label: "Rap", kind: "report", widthWeight: 0.4, zugKey: null };
const BESO: LaneDef = { key: "beso", label: "Beso", kind: "info", widthWeight: 0.4, zugKey: null };

export const LANE_PROFILES: Record<LaneProfileKey, LaneDef[]> = {
  kvk: [
    { key: "kdo", label: "Kdo", kind: "unit", widthWeight: 1, zugKey: "kdo" },
    { key: "log", label: "Log", kind: "unit", widthWeight: 1, zugKey: "log" },
    { key: "stabszBat", label: "Stabsz Bat", kind: "unit", widthWeight: 1, zugKey: "stabszBat" },
    { key: "wachDet", label: "Wach Det", kind: "unit", widthWeight: 1, zugKey: "wachDet" },
    { key: "of", label: "Of", kind: "unit", widthWeight: 1, zugKey: "of" },
    { key: "uof", label: "Uof", kind: "unit", widthWeight: 1, zugKey: "uof" },
    RAP,
    BESO,
  ],
  normal: [
    { key: "kdo", label: "Kdo Z", kind: "unit", widthWeight: 1, zugKey: "kdo" },
    { key: "log", label: "Log & VT", kind: "unit", widthWeight: 1, zugKey: "log" },
    { key: "stabszBat", label: "Stabsz Bat", kind: "unit", widthWeight: 1, zugKey: "stabszBat" },
    { key: "stabszGsVb", label: "Stabsz Gs Vb", kind: "unit", widthWeight: 1, zugKey: "stabszGsVb" },
    { key: "syst", label: "Syst Z", kind: "unit", widthWeight: 1, zugKey: "syst" },
    RAP,
    BESO,
  ],
  weekend: [{ key: "kp", label: "Kp", kind: "unit", widthWeight: 3, zugKey: null }, RAP, BESO],
};

export const LANE_PROFILE_LABELS: Record<LaneProfileKey, string> = {
  kvk: "KVK-Woche",
  normal: "Normale Woche",
  weekend: "Wochenende",
};

export interface LaneLike {
  key: string;
  kind: LaneKind;
  order: number;
  zugKey: string | null;
}

export interface SpanLike {
  laneStartOrder: number;
  laneSpan: number;
}

/** Lanes sortiert nach order. */
export function sortLanes<T extends { order: number }>(lanes: T[]): T[] {
  return [...lanes].sort((a, b) => a.order - b.order);
}

/** Alle Lanes, die ein Block überdeckt (nach order sortiert). */
export function coveredLanes<T extends LaneLike>(span: SpanLike, lanes: T[]): T[] {
  const sorted = sortLanes(lanes);
  return sorted.slice(span.laneStartOrder, span.laneStartOrder + span.laneSpan);
}

export function unitLanes<T extends LaneLike>(lanes: T[]): T[] {
  return sortLanes(lanes).filter((l) => l.kind === "unit");
}

/** Überdeckt der Block sämtliche Unit-Lanes des Tages? */
export function spansAllUnitLanes(span: SpanLike, lanes: LaneLike[]): boolean {
  const units = unitLanes(lanes);
  if (units.length === 0) return false;
  const covered = coveredLanes(span, lanes).filter((l) => l.kind === "unit");
  return covered.length === units.length;
}

/** Klemmt Start und Spannweite in die verfügbare Lane-Anzahl. */
export function clampSpan(span: SpanLike, laneCount: number): SpanLike {
  if (laneCount <= 0) return { laneStartOrder: 0, laneSpan: 1 };
  const laneSpan = Math.max(1, Math.min(span.laneSpan, laneCount));
  const laneStartOrder = Math.max(0, Math.min(span.laneStartOrder, laneCount - laneSpan));
  return { laneStartOrder, laneSpan };
}

export function isValidSpan(span: SpanLike, laneCount: number): boolean {
  return (
    Number.isInteger(span.laneStartOrder) &&
    Number.isInteger(span.laneSpan) &&
    span.laneSpan >= 1 &&
    span.laneStartOrder >= 0 &&
    span.laneStartOrder + span.laneSpan <= laneCount
  );
}

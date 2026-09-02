import type { LaneDto } from "./types";

/**
 * Reine Layout-Logik für das Wochenraster (ohne DOM), damit sie testbar und
 * im Druck (mm) wie am Bildschirm (px) identisch ist.
 */

export interface LaneSlot {
  /** Anteil an der Tagesbreite (0..1) */
  left: number;
  width: number;
}

/** Relative horizontale Position jeder Lane innerhalb der Tagesspalte. */
export function laneSlots(lanes: LaneDto[]): LaneSlot[] {
  const total = lanes.reduce((s, l) => s + l.widthWeight, 0) || 1;
  let acc = 0;
  return lanes.map((l) => {
    const slot = { left: acc / total, width: l.widthWeight / total };
    acc += l.widthWeight;
    return slot;
  });
}

/** Horizontale Ausdehnung eines Blocks (Anteil 0..1) aus Start-Lane und Spannweite. */
export function spanSlot(slots: LaneSlot[], laneStartOrder: number, laneSpan: number): LaneSlot {
  const first = slots[Math.min(laneStartOrder, slots.length - 1)];
  const last = slots[Math.min(laneStartOrder + laneSpan - 1, slots.length - 1)];
  if (!first || !last) return { left: 0, width: 1 };
  return { left: first.left, width: last.left + last.width - first.left };
}

/** Welche Lane liegt an horizontaler Position x (0..1)? */
export function laneAtFraction(slots: LaneSlot[], x: number): number {
  if (slots.length === 0) return 0;
  for (let i = 0; i < slots.length; i++) {
    if (x < slots[i].left + slots[i].width) return i;
  }
  return slots.length - 1;
}

export interface OverlapItem {
  id: string;
  startMin: number;
  endMin: number;
  laneStartOrder: number;
  laneSpan: number;
}

export interface OverlapPlacement {
  /** Index innerhalb der überlappenden Gruppe */
  column: number;
  /** Anzahl Spalten in der Gruppe */
  columns: number;
}

/**
 * Überlappende Blöcke, die dieselben Lanes berühren, nebeneinander anordnen
 * (wie Google Calendar). Blöcke mit unterschiedlichen Lanes stören sich nicht.
 */
export function layoutOverlaps(items: OverlapItem[]): Map<string, OverlapPlacement> {
  const result = new Map<string, OverlapPlacement>();
  const lanesOverlap = (a: OverlapItem, b: OverlapItem) =>
    a.laneStartOrder < b.laneStartOrder + b.laneSpan && b.laneStartOrder < a.laneStartOrder + a.laneSpan;
  const timeOverlap = (a: OverlapItem, b: OverlapItem) => a.startMin < b.endMin && b.startMin < a.endMin;

  const sorted = [...items].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
  const visited = new Set<string>();

  for (const seed of sorted) {
    if (visited.has(seed.id)) continue;
    // Cluster über transitive Überlappung bilden
    const cluster: OverlapItem[] = [];
    const stack = [seed];
    while (stack.length) {
      const cur = stack.pop()!;
      if (visited.has(cur.id)) continue;
      visited.add(cur.id);
      cluster.push(cur);
      for (const other of sorted) {
        if (!visited.has(other.id) && lanesOverlap(cur, other) && timeOverlap(cur, other)) stack.push(other);
      }
    }
    if (cluster.length === 1) {
      result.set(cluster[0].id, { column: 0, columns: 1 });
      continue;
    }
    // Spalten greedy zuweisen
    cluster.sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
    const columns: OverlapItem[][] = [];
    const colOf = new Map<string, number>();
    for (const item of cluster) {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const conflict = columns[c].some((o) => lanesOverlap(o, item) && timeOverlap(o, item));
        if (!conflict) {
          columns[c].push(item);
          colOf.set(item.id, c);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([item]);
        colOf.set(item.id, columns.length - 1);
      }
    }
    for (const item of cluster) result.set(item.id, { column: colOf.get(item.id)!, columns: columns.length });
  }
  return result;
}

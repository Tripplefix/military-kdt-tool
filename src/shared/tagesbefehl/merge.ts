import type { RowSnapshotDto, TagesbefehlRowDto } from "../types";
import { assignOrder, type GeneratedRow, type Group } from "./generate";

/** Zeile nach dem Merge: bestehend (mit id) oder neu (ohne id). */
export interface MergedRow extends Omit<TagesbefehlRowDto, "id" | "tagesbefehlId"> {
  id?: string;
}

export interface MergeResult {
  rows: MergedRow[];
  /** IDs bestehender Zeilen, die gelöscht werden. */
  removeIds: string[];
}

export function snapshotOf(r: Pick<GeneratedRow, "timeText" | "activity" | "responsibility" | "location" | "groupKey">): RowSnapshotDto {
  return { timeText: r.timeText, activity: r.activity, responsibility: r.responsibility, location: r.location, groupKey: r.groupKey };
}

function sameSnapshot(a: RowSnapshotDto | null, b: RowSnapshotDto): boolean {
  return !!a && a.timeText === b.timeText && a.activity === b.activity && a.responsibility === b.responsibility && a.location === b.location && a.groupKey === b.groupKey;
}

/**
 * Führt neu generierte Zeilen mit dem bestehenden Tagesbefehl zusammen.
 * - manuelle Zeilen bleiben immer
 * - gelöschte generierte Zeilen bleiben gelöscht (Tombstone)
 * - überschriebene Zeilen behalten die Benutzerwerte; hat sich die Quelle
 *   inzwischen geändert, wird sourceChanged gesetzt
 * - nicht überschriebene Zeilen werden aktualisiert
 * - generierte Zeilen ohne Gegenstück verschwinden (überschriebene bleiben als orphan)
 */
export function mergeRows(existing: TagesbefehlRowDto[], generated: GeneratedRow[], groups: Group[]): MergeResult {
  const byKey = new Map<string, TagesbefehlRowDto>();
  for (const e of existing) if (e.sourceKind !== "manual" && e.sourceKey) byKey.set(e.sourceKey, e);

  const out: MergedRow[] = [];
  const matched = new Set<string>();

  for (const g of generated) {
    const e = byKey.get(g.sourceKey);
    const snap = snapshotOf(g);
    if (!e) {
      out.push({ ...g, sourceSnapshot: snap, overridden: false, deleted: false, sourceChanged: false, orphan: false });
      continue;
    }
    matched.add(e.id);
    if (e.deleted) {
      out.push({ ...e, sourceSnapshot: snap, sourceBlockId: g.sourceBlockId, orphan: false });
      continue;
    }
    if (e.overridden) {
      const changed = e.sourceChanged || !sameSnapshot(e.sourceSnapshot, snap);
      out.push({ ...e, section: g.section, sourceBlockId: g.sourceBlockId, sourceSnapshot: snap, sourceChanged: changed, orphan: false });
      continue;
    }
    out.push({
      ...e,
      section: g.section,
      groupKey: g.groupKey,
      groupLabel: g.groupLabel,
      timeText: g.timeText,
      startMin: g.startMin,
      endMin: g.endMin,
      activity: g.activity,
      responsibility: g.responsibility,
      location: g.location,
      sourceBlockId: g.sourceBlockId,
      sourceKind: g.sourceKind,
      sourceSnapshot: snap,
      sourceChanged: false,
      orphan: false,
    });
  }

  const removeIds: string[] = [];
  for (const e of existing) {
    if (matched.has(e.id)) continue;
    if (e.sourceKind === "manual") {
      out.push({ ...e });
      continue;
    }
    if (e.overridden && !e.deleted) {
      out.push({ ...e, orphan: true, sourceBlockId: null });
      continue;
    }
    removeIds.push(e.id);
  }

  return { rows: assignOrder(out, groups), removeIds };
}

import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/server/db/client";
import * as s from "@/server/db/schema";
import type { WeekKind } from "@/shared/constants";
import { LANE_PROFILES, type LaneProfileKey } from "@/shared/lanes";
import { addDaysIso, isWeekend, weekdayOfIso } from "@/shared/time";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0] | Db;

export interface CreateWeekInput {
  wkId: string;
  index: number;
  label: string;
  title?: string;
  startDate: string;
  kind: WeekKind;
  wachtofPersonnelId?: string | null;
  wochenziele?: string;
}

/** Legt Lanes für eine Woche (dayId = null) oder einen Tag (Override) nach Profil an. */
export function insertLanesFromProfile(tx: Tx, weekId: string, dayId: string | null, profile: LaneProfileKey): void {
  LANE_PROFILES[profile].forEach((l, order) => {
    tx.insert(s.lane)
      .values({ weekId, dayId, key: l.key, label: l.label, order, widthWeight: l.widthWeight, kind: l.kind, zugKey: l.zugKey })
      .run();
  });
}

/**
 * Erstellt eine Woche mit 7 Tagen, Standard-Lanes (Profil nach Wochentyp) und
 * Wochenend-Overrides für Samstag und Sonntag.
 */
export function createWeekWithDays(tx: Tx, input: CreateWeekInput): { weekId: string; dayIds: string[] } {
  const weekId = crypto.randomUUID();
  tx.insert(s.week)
    .values({
      id: weekId,
      wkId: input.wkId,
      index: input.index,
      label: input.label,
      title: input.title ?? `Wochenarbeitsplan ${input.label}`,
      startDate: input.startDate,
      kind: input.kind,
      wachtofPersonnelId: input.wachtofPersonnelId ?? null,
      wochenziele: input.wochenziele ?? "",
    })
    .run();

  insertLanesFromProfile(tx, weekId, null, input.kind === "kvk" ? "kvk" : "normal");

  const dayIds: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDaysIso(input.startDate, i);
    const weekday = weekdayOfIso(date);
    const dayId = crypto.randomUUID();
    tx.insert(s.day).values({ id: dayId, weekId, date, weekday }).run();
    if (isWeekend(weekday)) insertLanesFromProfile(tx, weekId, dayId, "weekend");
    dayIds.push(dayId);
  }
  return { weekId, dayIds };
}

/** Effektive Lanes eines Tages: Tages-Override, sonst Wochen-Lanes. */
export function resolveLanesForDay(allLanes: s.Lane[], dayId: string): s.Lane[] {
  const dayLanes = allLanes.filter((l) => l.dayId === dayId);
  const source = dayLanes.length > 0 ? dayLanes : allLanes.filter((l) => l.dayId === null);
  return [...source].sort((a, b) => a.order - b.order);
}

/** Setzt die Lanes einer Woche (oder eines Tages) auf ein Profil zurück. */
export function applyLaneProfile(db: Db, weekId: string, dayId: string | null, profile: LaneProfileKey): void {
  db.transaction((tx) => {
    tx.delete(s.lane)
      .where(dayId ? and(eq(s.lane.weekId, weekId), eq(s.lane.dayId, dayId)) : and(eq(s.lane.weekId, weekId), isNull(s.lane.dayId)))
      .run();
    insertLanesFromProfile(tx, weekId, dayId, profile);
  });
}

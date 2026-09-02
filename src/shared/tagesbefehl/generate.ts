import { GROUP_ALLE, TB_SECTIONS, type RowSourceKind, type TbSection } from "../constants";
import { coveredLanes, spansAllUnitLanes, unitLanes } from "../lanes";
import { formatRange, isWeekend, parseTimeText } from "../time";
import type {
  BlockDto,
  CategoryDto,
  DayDto,
  FootnoteDto,
  LaneDto,
  PersonnelDto,
  SettingsDto,
  StandardReportDto,
  StandardTimeDto,
  UnitDto,
  WeekDto,
} from "../types";

export interface GenerateInput {
  day: DayDto;
  week: WeekDto;
  lanes: LaneDto[];
  blocks: BlockDto[];
  footnotes: FootnoteDto[];
  categories: CategoryDto[];
  settings: SettingsDto;
  units: UnitDto[];
  personnel: PersonnelDto[];
}

export interface GeneratedRow {
  section: TbSection;
  groupKey: string | null;
  groupLabel: string;
  order: number;
  timeText: string;
  startMin: number | null;
  endMin: number | null;
  activity: string;
  responsibility: string;
  location: string;
  sourceBlockId: string | null;
  sourceKind: RowSourceKind;
  sourceKey: string;
}

export interface Group {
  key: string;
  label: string;
}

export function personDisplayName(p: PersonnelDto | undefined): string {
  if (!p) return "";
  const short = p.name.split(",")[0].trim();
  return p.rank ? `${p.rank} ${short}` : short;
}

function appliesToDay(days: StandardTimeDto["days"], weekday: number): boolean {
  if (days === "all") return true;
  return days === "weekend" ? isWeekend(weekday) : !isWeekend(weekday);
}

/** Gruppen in Abschnitt 1: «Alle» plus die Züge der Spalten dieses Tages (in Zug-Reihenfolge). */
export function tagesbefehlGroups(lanes: LaneDto[], units: UnitDto[]): Group[] {
  const groups: Group[] = [{ key: GROUP_ALLE, label: "Alle" }];
  const seen = new Set<string>([GROUP_ALLE]);
  const laneGroups: Array<{ key: string; label: string; order: number }> = [];
  for (const lane of unitLanes(lanes)) {
    const g = groupForLane(lane, units);
    if (!g || seen.has(g.key)) continue;
    seen.add(g.key);
    const unit = units.find((u) => u.key === g.key);
    laneGroups.push({ ...g, order: unit ? unit.order : 1000 + lane.order });
  }
  laneGroups.sort((a, b) => a.order - b.order);
  return [...groups, ...laneGroups.map(({ key, label }) => ({ key, label }))];
}

/** Gruppe (Zug) einer Lane: über zugKey → Unit, sonst Lane selbst. Lanes ohne Zug in Ein-Lane-Tagen (Kp) → null = Alle. */
function groupForLane(lane: LaneDto, units: UnitDto[]): Group | null {
  if (lane.zugKey) {
    const unit = units.find((u) => u.key === lane.zugKey);
    return { key: lane.zugKey, label: unit?.tagesbefehlLabel ?? lane.label };
  }
  return null;
}

/** Erzeugt die Zeilen eines Tagesbefehls aus WAP-Blöcken, Standardzeiten, Rapporten und Kontakten. */
export function generateTagesbefehl(input: GenerateInput): GeneratedRow[] {
  const { day, week, lanes, blocks, footnotes, categories, settings, units, personnel } = input;
  const rows: GeneratedRow[] = [];
  const catById = new Map(categories.map((c) => [c.id, c]));
  const groups = tagesbefehlGroups(lanes, units);
  const groupLabel = (key: string | null) => (key ? (groups.find((g) => g.key === key)?.label ?? key) : "");

  // 1) Standardzeiten -> Gruppe Alle
  for (const st of [...settings.standardTimes].sort((a, b) => a.order - b.order)) {
    if (!st.inTagesbefehl || !appliesToDay(st.days, day.weekday)) continue;
    rows.push({
      section: "dienstbetrieb",
      groupKey: GROUP_ALLE,
      groupLabel: "Alle",
      order: 0,
      timeText: formatRange(st.startMin, st.endMin),
      startMin: st.startMin,
      endMin: st.endMin,
      activity: st.label,
      responsibility: st.responsibility,
      location: st.location,
      sourceBlockId: null,
      sourceKind: "standardTime",
      sourceKey: `standard:${st.key}`,
    });
  }

  // 2) Blöcke
  for (const b of blocks) {
    const cat = b.categoryId ? catById.get(b.categoryId) : undefined;
    if (cat?.excludeFromTagesbefehl) continue;
    const covered = coveredLanes(b, lanes);
    if (covered.length > 0 && covered.every((l) => l.kind === "info")) continue;
    const inReportLane = covered.length > 0 && covered.every((l) => l.kind === "report");
    const section: TbSection = inReportLane ? "rapporte" : (cat?.tagesbefehlSection ?? "dienstbetrieb");
    const base = {
      order: 0,
      timeText: formatRange(b.startMin, b.endMin),
      startMin: b.startMin,
      endMin: b.endMin,
      activity: b.title,
      responsibility: b.responsibility,
      location: b.location,
      sourceBlockId: b.id,
      sourceKind: "block" as const,
    };
    if (section !== "dienstbetrieb") {
      rows.push({ ...base, section, groupKey: null, groupLabel: "", sourceKey: `block:${b.id}` });
      continue;
    }
    if (spansAllUnitLanes(b, lanes)) {
      rows.push({ ...base, section, groupKey: GROUP_ALLE, groupLabel: "Alle", sourceKey: `block:${b.id}:${GROUP_ALLE}` });
      continue;
    }
    const groupKeys = new Set<string>();
    for (const lane of covered.filter((l) => l.kind === "unit")) {
      const g = groupForLane(lane, units);
      if (g) groupKeys.add(g.key);
    }
    if (groupKeys.size === 0) {
      rows.push({ ...base, section, groupKey: GROUP_ALLE, groupLabel: "Alle", sourceKey: `block:${b.id}:${GROUP_ALLE}` });
      continue;
    }
    for (const key of groupKeys) {
      rows.push({ ...base, section, groupKey: key, groupLabel: groupLabel(key), sourceKey: `block:${b.id}:${key}` });
    }
  }

  // 3) Termine/Info -> Besonderes
  for (const f of [...footnotes].sort((a, b) => a.number - b.number)) {
    if (!f.text.trim()) continue;
    rows.push({
      section: "besonderes",
      groupKey: null,
      groupLabel: "",
      order: 0,
      timeText: formatRange(f.startMin, f.endMin),
      startMin: f.startMin,
      endMin: f.endMin,
      activity: f.text,
      responsibility: "",
      location: "",
      sourceBlockId: null,
      sourceKind: "footnote",
      sourceKey: `footnote:${f.id}`,
    });
  }

  // 4) Standardrapporte
  for (const r of [...settings.standardReports].sort((a, b) => a.order - b.order) as StandardReportDto[]) {
    if (!appliesToDay(r.days, day.weekday)) continue;
    const parsed = parseTimeText(r.timeText);
    rows.push({
      section: "rapporte",
      groupKey: null,
      groupLabel: "",
      order: 0,
      timeText: r.timeText,
      startMin: parsed.startMin,
      endMin: parsed.endMin,
      activity: r.label,
      responsibility: r.responsibility,
      location: r.location,
      sourceBlockId: null,
      sourceKind: "standardReport",
      sourceKey: `standardReport:${r.key}`,
    });
  }

  // 5) Kommandierungen & Kontakte
  const wachtof = personnel.find((p) => p.id === week.wachtofPersonnelId);
  const tagesof = personnel.find((p) => p.id === day.tagesofPersonnelId);
  const contact = (key: string, timeText: string, activity: string, responsibility: string, location: string): GeneratedRow => ({
    section: "kommandierungen",
    groupKey: null,
    groupLabel: "",
    order: 0,
    timeText,
    startMin: null,
    endMin: null,
    activity,
    responsibility,
    location,
    sourceBlockId: null,
    sourceKind: "contact",
    sourceKey: `contact:${key}`,
  });
  rows.push(contact("kp", "ständig", `KP ${settings.companyName}`, "-", `Tel: ${settings.phoneKp || "-"}`));
  rows.push(contact("lvzMcc", "ständig", "LVZ / MCC", "-", `Tel: ${settings.phoneLvzMcc || "-"}`));
  rows.push(contact("wachtof", "gz Woche", "Wachtof", personDisplayName(wachtof) || "-", `Tel: ${wachtof?.phone || settings.phoneWachtof || "-"}`));
  rows.push(contact("tagesof", "gz Tag", "Tagesof", personDisplayName(tagesof) || "-", `Tel: ${tagesof?.phone || settings.phoneTagesof || "-"}`));

  return assignOrder(dedupeAgainstStandard(rows), groups);
}

const norm = (t: string) => t.toLowerCase().replace(/\s+/g, " ").trim();

/** Block-Zeilen in «Alle», die eine Standardzeit doppeln (gleiche Zeit, gleicher Titel), entfallen. */
function dedupeAgainstStandard(rows: GeneratedRow[]): GeneratedRow[] {
  const standard = rows.filter((r) => r.sourceKind === "standardTime");
  return rows.filter((r) => {
    if (r.sourceKind !== "block" || r.groupKey !== GROUP_ALLE) return true;
    return !standard.some((s) => s.timeText === r.timeText && (norm(s.activity) === norm(r.activity) || norm(s.activity).startsWith(norm(r.activity) + " /")));
  });
}

/** Sortiert je Abschnitt nach Gruppe (Alle zuerst, dann Züge), dann Zeit (ohne Zeit zuletzt) und vergibt order. */
export function assignOrder<T extends { section: TbSection; groupKey: string | null; startMin: number | null; order: number }>(rows: T[], groups: Group[]): T[] {
  const groupIndex = (key: string | null) => {
    if (key == null) return 9999;
    const i = groups.findIndex((g) => g.key === key);
    return i === -1 ? 5000 : i;
  };
  const sorted = [...rows].sort((a, b) => {
    const si = TB_SECTIONS.indexOf(a.section) - TB_SECTIONS.indexOf(b.section);
    if (si !== 0) return si;
    const gi = groupIndex(a.groupKey) - groupIndex(b.groupKey);
    if (gi !== 0) return gi;
    const sa = a.startMin ?? Number.MAX_SAFE_INTEGER;
    const sb = b.startMin ?? Number.MAX_SAFE_INTEGER;
    if (sa !== sb) return sa - sb;
    return a.order - b.order;
  });
  const counters: Record<string, number> = {};
  return sorted.map((r) => ({ ...r, order: (counters[r.section] = (counters[r.section] ?? 0) + 1) }));
}

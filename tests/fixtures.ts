import type { BlockDto, CategoryDto, DayDto, FootnoteDto, LaneDto, PersonnelDto, SettingsDto, UnitDto, WeekDto } from "@/shared/types";
import { LANE_PROFILES, type LaneProfileKey } from "@/shared/lanes";

export const settings: SettingsDto = {
  wkId: "wk",
  companyName: "Stabskp 3",
  battalionName: "Stabsbat 3",
  kpKdtName: "Hptm Isler",
  kdtStvName: "",
  batKdtName: "",
  standardTimes: [
    { key: "tagwache", label: "Tagwache", startMin: 345, endMin: null, responsibility: "Tagesof", location: "Ukft", days: "all", inTagesbefehl: true, order: 0 },
    { key: "morgenessen", label: "Morgenessen", startMin: 360, endMin: 420, responsibility: "Fur", location: "Esssaal", days: "all", inTagesbefehl: true, order: 1 },
    { key: "av", label: "AV", startMin: 435, endMin: null, responsibility: "Einh Fw", location: "Ukft", days: "weekday", inTagesbefehl: true, order: 2 },
    { key: "mittagessen", label: "Mittagessen", startMin: 720, endMin: 780, responsibility: "Fur", location: "Esssaal", days: "all", inTagesbefehl: true, order: 3 },
    { key: "hvUrlaub", label: "HV Urlaub", startMin: 1080, endMin: null, responsibility: "Einh Fw", location: "AV-Platz", days: "weekend", inTagesbefehl: true, order: 4 },
    { key: "hvGross", label: "HV gross", startMin: 1125, endMin: null, responsibility: "Einh Fw", location: "AV-Platz", days: "weekday", inTagesbefehl: false, order: 5 },
  ],
  standardReports: [
    { key: "dienstrapport", label: "Dienstrapport", timeText: "0730-0800", responsibility: "Kp Kdt", location: "Rapportraum", days: "weekday", order: 0 },
  ],
  phoneKp: "058 1",
  phoneLvzMcc: "058 2",
  phoneTagesof: "",
  phoneWachtof: "",
  distribution: { eingesehenVon: "Bat Kdt", gehtAn: [], zKAn: [] },
  remarksDefault: "",
  wochenzieleDefault: "",
};

export const units: UnitDto[] = [
  { id: "u1", wkId: "wk", key: "kdo", label: "Kdo Zug", tagesbefehlLabel: "Kdo Z", order: 0, kvkOnly: false },
  { id: "u2", wkId: "wk", key: "log", label: "Log Zug", tagesbefehlLabel: "Log Z", order: 1, kvkOnly: false },
  { id: "u3", wkId: "wk", key: "stabszBat", label: "Stabsz Bat", tagesbefehlLabel: "Stabsz Bat", order: 3, kvkOnly: false },
  { id: "u4", wkId: "wk", key: "stabszGsVb", label: "Stabsz Gs Vb", tagesbefehlLabel: "Stabsz Gs Vb", order: 4, kvkOnly: false },
  { id: "u5", wkId: "wk", key: "syst", label: "Syst Z", tagesbefehlLabel: "Syst Z", order: 5, kvkOnly: false },
];

export const personnel: PersonnelDto[] = [
  { id: "p1", wkId: "wk", name: "Sieber, Dario", rank: "Oblt", role: "kdtStv", unitId: null, phone: "079 1", order: 0 },
  { id: "p2", wkId: "wk", name: "Lopez-Polo", rank: "Lt", role: "zfhr", unitId: null, phone: "079 2", order: 1 },
];

export const categories: CategoryDto[] = [
  { id: "c-dienst", wkId: "wk", key: "dienst", label: "Dienst", color: "#fff", textColor: "#000", shape: "rect", excludeFromTagesbefehl: false, tagesbefehlSection: "dienstbetrieb", order: 0 },
  { id: "c-meal", wkId: "wk", key: "meal", label: "Essen", color: "#0f0", textColor: "#000", shape: "rect", excludeFromTagesbefehl: true, tagesbefehlSection: "dienstbetrieb", order: 1 },
  { id: "c-rapport", wkId: "wk", key: "rapport", label: "Rapport", color: "#f99", textColor: "#000", shape: "rect", excludeFromTagesbefehl: false, tagesbefehlSection: "rapporte", order: 2 },
  { id: "c-beso", wkId: "wk", key: "beso", label: "Besonderes", color: "#fc9", textColor: "#000", shape: "rect", excludeFromTagesbefehl: false, tagesbefehlSection: "besonderes", order: 3 },
];

export const week: WeekDto = {
  id: "w1", wkId: "wk", index: 1, label: "WKW1", title: "Woche 1", startDate: "2026-09-28", kind: "normal", wachtofPersonnelId: "p2",
  wochenziele: "", remarks: "", standDate: null, status: "entwurf", updatedAt: "",
};

export function lanesFor(profile: LaneProfileKey, dayId = "d1"): LaneDto[] {
  return LANE_PROFILES[profile].map((l, order) => ({ id: `${dayId}-${l.key}`, weekId: "w1", dayId: null, order, ...l }));
}

export const monday: DayDto = { id: "d1", weekId: "w1", date: "2026-09-28", weekday: 1, tagesofPersonnelId: "p1" };
export const saturday: DayDto = { id: "d6", weekId: "w1", date: "2026-10-03", weekday: 6, tagesofPersonnelId: null };

export function block(partial: Partial<BlockDto> & Pick<BlockDto, "id" | "startMin" | "endMin" | "laneStartOrder" | "laneSpan">): BlockDto {
  return { dayId: "d1", title: partial.id, categoryId: "c-dienst", location: "", responsibility: "", remark: "", footnoteId: null, sortKey: 0, updatedAt: "", ...partial };
}

export function footnote(partial: Partial<FootnoteDto> & Pick<FootnoteDto, "id" | "number" | "text">): FootnoteDto {
  return { dayId: "d1", startMin: 600, endMin: 630, order: 0, ...partial };
}

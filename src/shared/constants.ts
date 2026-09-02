export const GRID_START_MIN = 5 * 60; // 0500
export const GRID_END_MIN = 23 * 60; // 2300
export const SLOT_MIN = 15;
export const GRID_SLOTS = (GRID_END_MIN - GRID_START_MIN) / SLOT_MIN; // 72

export const WEEK_KINDS = ["kvk", "normal"] as const;
export type WeekKind = (typeof WEEK_KINDS)[number];

export const LANE_KINDS = ["unit", "report", "info"] as const;
export type LaneKind = (typeof LANE_KINDS)[number];

export const STATUSES = ["entwurf", "bereit", "genehmigt", "verworfen"] as const;
export type Status = (typeof STATUSES)[number];
export const STATUS_LABELS: Record<Status, string> = {
  entwurf: "Entwurf",
  bereit: "Bereit für Kdt",
  genehmigt: "Genehmigt durch Kdt",
  verworfen: "Verworfen",
};

export const CATEGORY_SHAPES = ["rect", "bar", "chevron"] as const;
export type CategoryShape = (typeof CATEGORY_SHAPES)[number];

export const TB_SECTIONS = ["dienstbetrieb", "besonderes", "rapporte", "kommandierungen"] as const;
export type TbSection = (typeof TB_SECTIONS)[number];
export const TB_SECTION_TITLES: Record<TbSection, string> = {
  dienstbetrieb: "1 Dienstbetrieb / Ausbildung   -   Operazioni di servizio / formazione",
  besonderes: "2 Besonderes   -   Caratteristiche speciali",
  rapporte: "3 Rapporte   -  Rapporti",
  kommandierungen: "4 Kommandierungen & Kontakte   -  Comandi e Contatti",
};

export const ROW_SOURCE_KINDS = [
  "block",
  "standardTime",
  "standardReport",
  "contact",
  "footnote",
  "manual",
] as const;
export type RowSourceKind = (typeof ROW_SOURCE_KINDS)[number];

export const TERM_KINDS = ["activity", "report", "location", "responsibility"] as const;
export type TermKind = (typeof TERM_KINDS)[number];
export const TERM_KIND_LABELS: Record<TermKind, string> = {
  activity: "Tätigkeiten",
  report: "Rapporte",
  location: "Räumlichkeiten",
  responsibility: "Verantwortung",
};

export const PERSONNEL_ROLES = [
  "kpKdt",
  "kdtStv",
  "hoehererKader",
  "zfhr",
  "einhFw",
  "einhFur",
  "batKdt",
  "other",
] as const;
export type PersonnelRole = (typeof PERSONNEL_ROLES)[number];
export const PERSONNEL_ROLE_LABELS: Record<PersonnelRole, string> = {
  kpKdt: "Kp Kdt",
  kdtStv: "Kp Kdt Stv",
  hoehererKader: "Höheres Kader",
  zfhr: "Zugführer",
  einhFw: "Einh Fw",
  einhFur: "Einh Fur",
  batKdt: "Bat Kdt",
  other: "Andere",
};

export const DAY_APPLICABILITY = ["all", "weekday", "weekend"] as const;
export type DayApplicability = (typeof DAY_APPLICABILITY)[number];

export const GROUP_ALLE = "alle";

export const WEEKDAY_NAMES_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
export const WEEKDAY_NAMES_IT = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

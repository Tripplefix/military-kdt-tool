import type {
  CategoryShape,
  DayApplicability,
  LaneKind,
  PersonnelRole,
  RowSourceKind,
  Status,
  TbSection,
  TermKind,
  WeekKind,
} from "./constants";

export interface WkDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface StandardTimeDto {
  key: string;
  label: string;
  startMin: number;
  endMin: number | null;
  responsibility: string;
  location: string;
  days: DayApplicability;
  inTagesbefehl: boolean;
  order: number;
}

export interface StandardReportDto {
  key: string;
  label: string;
  timeText: string;
  responsibility: string;
  location: string;
  days: DayApplicability;
  order: number;
}

export interface DistributionDto {
  eingesehenVon: string;
  gehtAn: string[];
  zKAn: string[];
}

export interface SettingsDto {
  wkId: string;
  companyName: string;
  battalionName: string;
  kpKdtName: string;
  kdtStvName: string;
  batKdtName: string;
  standardTimes: StandardTimeDto[];
  standardReports: StandardReportDto[];
  phoneKp: string;
  phoneLvzMcc: string;
  phoneTagesof: string;
  phoneWachtof: string;
  distribution: DistributionDto;
  remarksDefault: string;
  wochenzieleDefault: string;
}

export interface UnitDto {
  id: string;
  wkId: string;
  key: string;
  label: string;
  tagesbefehlLabel: string;
  order: number;
  kvkOnly: boolean;
}

export interface PersonnelDto {
  id: string;
  wkId: string;
  name: string;
  rank: string;
  role: PersonnelRole;
  unitId: string | null;
  phone: string;
  order: number;
}

export interface CategoryDto {
  id: string;
  wkId: string;
  key: string;
  label: string;
  color: string;
  textColor: string;
  shape: CategoryShape;
  excludeFromTagesbefehl: boolean;
  tagesbefehlSection: TbSection;
  order: number;
}

export interface TermTemplateDto {
  id: string;
  wkId: string;
  kind: TermKind;
  de: string;
  it: string;
  order: number;
}

export interface WeekDto {
  id: string;
  wkId: string;
  index: number;
  label: string;
  title: string;
  startDate: string;
  kind: WeekKind;
  wachtofPersonnelId: string | null;
  wochenziele: string;
  remarks: string;
  standDate: string | null;
  status: Status;
  updatedAt: string;
}

export interface DayDto {
  id: string;
  weekId: string;
  date: string;
  weekday: number;
  tagesofPersonnelId: string | null;
}

export interface LaneDto {
  id: string;
  weekId: string;
  dayId: string | null;
  key: string;
  label: string;
  order: number;
  widthWeight: number;
  kind: LaneKind;
  zugKey: string | null;
}

export interface FootnoteDto {
  id: string;
  dayId: string;
  number: number;
  text: string;
  startMin: number;
  endMin: number;
  order: number;
}

export interface BlockDto {
  id: string;
  dayId: string;
  title: string;
  startMin: number;
  endMin: number;
  categoryId: string | null;
  location: string;
  responsibility: string;
  remark: string;
  footnoteId: string | null;
  laneStartOrder: number;
  laneSpan: number;
  sortKey: number;
  updatedAt: string;
}

/** Alles, was das Wochenraster braucht. */
export interface WeekBundle {
  wk: WkDto;
  week: WeekDto;
  weeks: Array<Pick<WeekDto, "id" | "index" | "label" | "startDate" | "kind">>;
  days: DayDto[];
  /** Effektive Lanes je Tag (Override oder Wochen-Lanes), nach order sortiert. */
  lanesByDay: Record<string, LaneDto[]>;
  /** Wochen-Lanes (dayId = null) für die Konfiguration. */
  weekLanes: LaneDto[];
  blocks: BlockDto[];
  footnotes: FootnoteDto[];
  categories: CategoryDto[];
  personnel: PersonnelDto[];
  settings: SettingsDto;
  /** Tage, die bereits einen Tagesbefehl haben. */
  tagesbefehlDayIds: string[];
}

/** Stammdaten eines WK für Einstellungen und Auswahlfelder. */
export interface WkBundle {
  wk: WkDto;
  settings: SettingsDto;
  units: UnitDto[];
  personnel: PersonnelDto[];
  categories: CategoryDto[];
  terms: TermTemplateDto[];
  weeks: WeekDto[];
}

export interface RowSnapshotDto {
  timeText: string;
  activity: string;
  responsibility: string;
  location: string;
  groupKey: string | null;
}

export interface TagesbefehlRowDto {
  id: string;
  tagesbefehlId: string;
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
  sourceKey: string | null;
  sourceSnapshot: RowSnapshotDto | null;
  overridden: boolean;
  deleted: boolean;
  /** Berechnet: Quelle hat sich seit dem Override geändert. */
  staleSource?: boolean;
  /** Berechnet: Quelle existiert nicht mehr. */
  orphan?: boolean;
}

export interface TagesbefehlDto {
  id: string;
  dayId: string;
  number: number;
  status: Status;
  validFrom: string;
  revision: number;
  replacesVersion: string;
  besonderesNote: string;
  generatedAt: string | null;
  lastRegeneratedAt: string | null;
  updatedAt: string;
}

export interface TagesbefehlBundle {
  wk: WkDto;
  settings: SettingsDto;
  week: WeekDto;
  day: DayDto;
  tagesbefehl: TagesbefehlDto | null;
  rows: TagesbefehlRowDto[];
  units: UnitDto[];
  personnel: PersonnelDto[];
  terms: TermTemplateDto[];
  /** Gruppen in Abschnitt 1 in Anzeige-Reihenfolge (Alle + Züge der Woche). */
  groups: Array<{ key: string; label: string }>;
}

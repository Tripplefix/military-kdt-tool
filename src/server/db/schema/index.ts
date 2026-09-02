import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import {
  CATEGORY_SHAPES,
  DAY_APPLICABILITY,
  LANE_KINDS,
  PERSONNEL_ROLES,
  ROW_SOURCE_KINDS,
  STATUSES,
  TB_SECTIONS,
  TERM_KINDS,
  WEEK_KINDS,
} from "@/shared/constants";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
    .$onUpdateFn(() => new Date().toISOString()),
};

/** Dienstleistung (ein WK). Mandanten-Anker für spätere Mehrbenutzer-Nutzung. */
export const wk = sqliteTable("wk", {
  id: id(),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  ownerId: text("owner_id"),
  ...timestamps,
});

export interface StandardTime {
  key: string;
  label: string;
  startMin: number;
  endMin: number | null;
  responsibility: string;
  location: string;
  days: (typeof DAY_APPLICABILITY)[number];
  inTagesbefehl: boolean;
  order: number;
}

export interface StandardReport {
  key: string;
  label: string;
  timeText: string;
  responsibility: string;
  location: string;
  days: (typeof DAY_APPLICABILITY)[number];
  order: number;
}

export interface Distribution {
  eingesehenVon: string;
  gehtAn: string[];
  zKAn: string[];
}

export const settings = sqliteTable("settings", {
  wkId: text("wk_id")
    .primaryKey()
    .references(() => wk.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  battalionName: text("battalion_name").notNull().default(""),
  kpKdtName: text("kp_kdt_name").notNull().default(""),
  kdtStvName: text("kdt_stv_name").notNull().default(""),
  batKdtName: text("bat_kdt_name").notNull().default(""),
  standardTimes: text("standard_times", { mode: "json" }).$type<StandardTime[]>().notNull().default([]),
  standardReports: text("standard_reports", { mode: "json" }).$type<StandardReport[]>().notNull().default([]),
  phoneKp: text("phone_kp").notNull().default(""),
  phoneLvzMcc: text("phone_lvz_mcc").notNull().default(""),
  phoneTagesof: text("phone_tagesof").notNull().default(""),
  phoneWachtof: text("phone_wachtof").notNull().default(""),
  distribution: text("distribution", { mode: "json" })
    .$type<Distribution>()
    .notNull()
    .default({ eingesehenVon: "", gehtAn: [], zKAn: [] }),
  remarksDefault: text("remarks_default").notNull().default(""),
  wochenzieleDefault: text("wochenziele_default").notNull().default(""),
  ...timestamps,
});

export const unit = sqliteTable(
  "unit",
  {
    id: id(),
    wkId: text("wk_id")
      .notNull()
      .references(() => wk.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    tagesbefehlLabel: text("tagesbefehl_label").notNull(),
    order: integer("order").notNull().default(0),
    kvkOnly: integer("kvk_only", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (t) => [uniqueIndex("unit_wk_key").on(t.wkId, t.key)],
);

export const personnel = sqliteTable(
  "personnel",
  {
    id: id(),
    wkId: text("wk_id")
      .notNull()
      .references(() => wk.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    rank: text("rank").notNull().default(""),
    role: text("role", { enum: PERSONNEL_ROLES }).notNull().default("other"),
    unitId: text("unit_id").references(() => unit.id, { onDelete: "set null" }),
    phone: text("phone").notNull().default(""),
    order: integer("order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("personnel_wk").on(t.wkId)],
);

export const category = sqliteTable(
  "category",
  {
    id: id(),
    wkId: text("wk_id")
      .notNull()
      .references(() => wk.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    color: text("color").notNull(),
    textColor: text("text_color").notNull().default("#000000"),
    shape: text("shape", { enum: CATEGORY_SHAPES }).notNull().default("rect"),
    excludeFromTagesbefehl: integer("exclude_from_tagesbefehl", { mode: "boolean" }).notNull().default(false),
    tagesbefehlSection: text("tagesbefehl_section", { enum: TB_SECTIONS }).notNull().default("dienstbetrieb"),
    order: integer("order").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("category_wk_key").on(t.wkId, t.key)],
);

export const termTemplate = sqliteTable(
  "term_template",
  {
    id: id(),
    wkId: text("wk_id")
      .notNull()
      .references(() => wk.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: TERM_KINDS }).notNull(),
    de: text("de").notNull(),
    it: text("it").notNull().default(""),
    order: integer("order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("term_wk_kind").on(t.wkId, t.kind)],
);

export const week = sqliteTable(
  "week",
  {
    id: id(),
    wkId: text("wk_id")
      .notNull()
      .references(() => wk.id, { onDelete: "cascade" }),
    index: integer("index").notNull(),
    label: text("label").notNull(),
    title: text("title").notNull().default(""),
    startDate: text("start_date").notNull(),
    kind: text("kind", { enum: WEEK_KINDS }).notNull().default("normal"),
    wachtofPersonnelId: text("wachtof_personnel_id").references(() => personnel.id, { onDelete: "set null" }),
    wochenziele: text("wochenziele").notNull().default(""),
    remarks: text("remarks").notNull().default(""),
    standDate: text("stand_date"),
    status: text("status", { enum: STATUSES }).notNull().default("entwurf"),
    ...timestamps,
  },
  (t) => [uniqueIndex("week_wk_index").on(t.wkId, t.index)],
);

export const day = sqliteTable(
  "day",
  {
    id: id(),
    weekId: text("week_id")
      .notNull()
      .references(() => week.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    weekday: integer("weekday").notNull(),
    tagesofPersonnelId: text("tagesof_personnel_id").references(() => personnel.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("day_week_date").on(t.weekId, t.date)],
);

export const lane = sqliteTable(
  "lane",
  {
    id: id(),
    weekId: text("week_id")
      .notNull()
      .references(() => week.id, { onDelete: "cascade" }),
    dayId: text("day_id").references(() => day.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    order: integer("order").notNull(),
    widthWeight: real("width_weight").notNull().default(1),
    kind: text("kind", { enum: LANE_KINDS }).notNull().default("unit"),
    zugKey: text("zug_key"),
    ...timestamps,
  },
  (t) => [index("lane_week").on(t.weekId), index("lane_day").on(t.dayId)],
);

export const footnote = sqliteTable(
  "footnote",
  {
    id: id(),
    dayId: text("day_id")
      .notNull()
      .references(() => day.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    text: text("text").notNull().default(""),
    startMin: integer("start_min").notNull(),
    endMin: integer("end_min").notNull(),
    order: integer("order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("footnote_day").on(t.dayId)],
);

export const block = sqliteTable(
  "block",
  {
    id: id(),
    dayId: text("day_id")
      .notNull()
      .references(() => day.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    startMin: integer("start_min").notNull(),
    endMin: integer("end_min").notNull(),
    categoryId: text("category_id").references(() => category.id, { onDelete: "set null" }),
    location: text("location").notNull().default(""),
    responsibility: text("responsibility").notNull().default(""),
    remark: text("remark").notNull().default(""),
    footnoteId: text("footnote_id").references(() => footnote.id, { onDelete: "set null" }),
    laneStartOrder: integer("lane_start_order").notNull().default(0),
    laneSpan: integer("lane_span").notNull().default(1),
    sortKey: integer("sort_key").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("block_day").on(t.dayId)],
);

export const tagesbefehl = sqliteTable(
  "tagesbefehl",
  {
    id: id(),
    dayId: text("day_id")
      .notNull()
      .unique()
      .references(() => day.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    status: text("status", { enum: STATUSES }).notNull().default("entwurf"),
    validFrom: text("valid_from").notNull().default(""),
    revision: integer("revision").notNull().default(0),
    replacesVersion: text("replaces_version").notNull().default("-"),
    besonderesNote: text("besonderes_note").notNull().default(""),
    generatedAt: text("generated_at"),
    lastRegeneratedAt: text("last_regenerated_at"),
    ...timestamps,
  },
);

export const tagesbefehlRow = sqliteTable(
  "tagesbefehl_row",
  {
    id: id(),
    tagesbefehlId: text("tagesbefehl_id")
      .notNull()
      .references(() => tagesbefehl.id, { onDelete: "cascade" }),
    section: text("section", { enum: TB_SECTIONS }).notNull(),
    groupKey: text("group_key"),
    groupLabel: text("group_label").notNull().default(""),
    order: integer("order").notNull().default(0),
    timeText: text("time_text").notNull().default(""),
    startMin: integer("start_min"),
    endMin: integer("end_min"),
    activity: text("activity").notNull().default(""),
    responsibility: text("responsibility").notNull().default(""),
    location: text("location").notNull().default(""),
    sourceBlockId: text("source_block_id").references(() => block.id, { onDelete: "set null" }),
    sourceKind: text("source_kind", { enum: ROW_SOURCE_KINDS }).notNull().default("manual"),
    sourceKey: text("source_key"),
    sourceSnapshot: text("source_snapshot", { mode: "json" }).$type<RowSnapshot | null>(),
    overridden: integer("overridden", { mode: "boolean" }).notNull().default(false),
    deleted: integer("deleted", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (t) => [index("tbrow_tb").on(t.tagesbefehlId), index("tbrow_source").on(t.tagesbefehlId, t.sourceKey)],
);

/** Letzter bekannter Stand der Quelle einer generierten Zeile (für "Quelle geändert"). */
export interface RowSnapshot {
  timeText: string;
  activity: string;
  responsibility: string;
  location: string;
  groupKey: string | null;
}

export type Wk = typeof wk.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Unit = typeof unit.$inferSelect;
export type Personnel = typeof personnel.$inferSelect;
export type Category = typeof category.$inferSelect;
export type TermTemplate = typeof termTemplate.$inferSelect;
export type Week = typeof week.$inferSelect;
export type Day = typeof day.$inferSelect;
export type Lane = typeof lane.$inferSelect;
export type Footnote = typeof footnote.$inferSelect;
export type Block = typeof block.$inferSelect;
export type Tagesbefehl = typeof tagesbefehl.$inferSelect;
export type TagesbefehlRow = typeof tagesbefehlRow.$inferSelect;

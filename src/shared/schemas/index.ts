import { z } from "zod";
import {
  CATEGORY_SHAPES,
  DAY_APPLICABILITY,
  GRID_END_MIN,
  GRID_START_MIN,
  LANE_KINDS,
  PERSONNEL_ROLES,
  STATUSES,
  TB_SECTIONS,
  TERM_KINDS,
  WEEK_KINDS,
} from "../constants";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum im Format YYYY-MM-DD");
const minutes = z.number().int().min(0).max(1440);
const gridMinutes = z
  .number()
  .int()
  .min(GRID_START_MIN, "Frühestens 0500")
  .max(GRID_END_MIN, "Spätestens 2300")
  .refine((v) => v % 15 === 0, "Nur 15-Minuten-Schritte");
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Farbe als #RRGGBB");

export const blockInputSchema = z
  .object({
    dayId: z.string().min(1),
    title: z.string().trim().min(1, "Aktivität fehlt").max(200),
    startMin: gridMinutes,
    endMin: gridMinutes,
    categoryId: z.string().nullable().default(null),
    location: z.string().trim().max(200).default(""),
    responsibility: z.string().trim().max(200).default(""),
    remark: z.string().trim().max(2000).default(""),
    footnoteId: z.string().nullable().default(null),
    laneStartOrder: z.number().int().min(0).default(0),
    laneSpan: z.number().int().min(1).default(1),
    sortKey: z.number().int().default(0),
  })
  .refine((b) => b.endMin > b.startMin, { message: "Ende muss nach Beginn liegen", path: ["endMin"] });
export type BlockInput = z.infer<typeof blockInputSchema>;

export const blockPatchSchema = z
  .object({
    dayId: z.string().min(1).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    startMin: gridMinutes.optional(),
    endMin: gridMinutes.optional(),
    categoryId: z.string().nullable().optional(),
    location: z.string().trim().max(200).optional(),
    responsibility: z.string().trim().max(200).optional(),
    remark: z.string().trim().max(2000).optional(),
    footnoteId: z.string().nullable().optional(),
    laneStartOrder: z.number().int().min(0).optional(),
    laneSpan: z.number().int().min(1).optional(),
    sortKey: z.number().int().optional(),
    /** Optimistische Sperre: updatedAt des bekannten Standes. */
    expectedUpdatedAt: z.string().optional(),
  })
  .strict();
export type BlockPatch = z.infer<typeof blockPatchSchema>;

export const footnoteInputSchema = z.object({
  dayId: z.string().min(1),
  number: z.number().int().min(0).max(999).optional(),
  text: z.string().trim().max(500).default(""),
  startMin: gridMinutes,
  endMin: gridMinutes,
});
export type FootnoteInput = z.infer<typeof footnoteInputSchema>;

export const footnotePatchSchema = z
  .object({
    number: z.number().int().min(0).max(999).optional(),
    text: z.string().trim().max(500).optional(),
    startMin: gridMinutes.optional(),
    endMin: gridMinutes.optional(),
    order: z.number().int().optional(),
  })
  .strict();
export type FootnotePatch = z.infer<typeof footnotePatchSchema>;

export const weekPatchSchema = z
  .object({
    title: z.string().trim().max(200).optional(),
    label: z.string().trim().min(1).max(50).optional(),
    kind: z.enum(WEEK_KINDS).optional(),
    wachtofPersonnelId: z.string().nullable().optional(),
    wochenziele: z.string().max(5000).optional(),
    remarks: z.string().max(5000).optional(),
    standDate: isoDate.nullable().optional(),
    status: z.enum(STATUSES).optional(),
  })
  .strict();
export type WeekPatch = z.infer<typeof weekPatchSchema>;

export const weekCreateSchema = z.object({
  wkId: z.string().min(1),
  label: z.string().trim().min(1).max(50),
  title: z.string().trim().max(200).optional(),
  startDate: isoDate,
  kind: z.enum(WEEK_KINDS).default("normal"),
});
export type WeekCreate = z.infer<typeof weekCreateSchema>;

export const laneDefSchema = z.object({
  key: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(60),
  kind: z.enum(LANE_KINDS),
  widthWeight: z.number().min(0.1).max(5),
  zugKey: z.string().nullable(),
});

export const laneConfigSchema = z.object({
  /** null = Wochen-Lanes, sonst Tages-Override. */
  dayId: z.string().nullable().default(null),
  /** Entweder Profil anwenden ... */
  profile: z.enum(["kvk", "normal", "weekend"]).optional(),
  /** ... oder Lanes explizit setzen. */
  lanes: z.array(laneDefSchema).min(1).optional(),
  /** Tages-Override entfernen (zurück auf Wochen-Lanes). */
  clearOverride: z.boolean().optional(),
});
export type LaneConfigInput = z.infer<typeof laneConfigSchema>;

export const dayPatchSchema = z
  .object({
    tagesofPersonnelId: z.string().nullable().optional(),
  })
  .strict();
export type DayPatch = z.infer<typeof dayPatchSchema>;

export const standardTimeSchema = z.object({
  key: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(120),
  startMin: minutes,
  endMin: minutes.nullable(),
  responsibility: z.string().trim().max(120).default(""),
  location: z.string().trim().max(120).default(""),
  days: z.enum(DAY_APPLICABILITY).default("all"),
  inTagesbefehl: z.boolean().default(true),
  order: z.number().int().default(0),
});

export const standardReportSchema = z.object({
  key: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(120),
  timeText: z.string().trim().max(40).default(""),
  responsibility: z.string().trim().max(120).default(""),
  location: z.string().trim().max(120).default(""),
  days: z.enum(DAY_APPLICABILITY).default("weekday"),
  order: z.number().int().default(0),
});

export const settingsPatchSchema = z
  .object({
    companyName: z.string().trim().min(1).max(120).optional(),
    battalionName: z.string().trim().max(120).optional(),
    kpKdtName: z.string().trim().max(120).optional(),
    kdtStvName: z.string().trim().max(120).optional(),
    batKdtName: z.string().trim().max(120).optional(),
    standardTimes: z.array(standardTimeSchema).optional(),
    standardReports: z.array(standardReportSchema).optional(),
    phoneKp: z.string().trim().max(60).optional(),
    phoneLvzMcc: z.string().trim().max(60).optional(),
    phoneTagesof: z.string().trim().max(60).optional(),
    phoneWachtof: z.string().trim().max(60).optional(),
    distribution: z
      .object({
        eingesehenVon: z.string().trim().max(120),
        gehtAn: z.array(z.string().trim().max(120)),
        zKAn: z.array(z.string().trim().max(120)),
      })
      .optional(),
    remarksDefault: z.string().max(5000).optional(),
    wochenzieleDefault: z.string().max(5000).optional(),
  })
  .strict();
export type SettingsPatch = z.infer<typeof settingsPatchSchema>;

export const wkPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    startDate: isoDate.optional(),
    endDate: isoDate.optional(),
  })
  .strict();

export const wkCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  companyName: z.string().trim().min(1).max(120),
  startDate: isoDate,
  weeks: z.number().int().min(1).max(8).default(3),
  firstWeekKvk: z.boolean().default(true),
});
export type WkCreate = z.infer<typeof wkCreateSchema>;

export const personnelInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  rank: z.string().trim().max(40).default(""),
  role: z.enum(PERSONNEL_ROLES).default("other"),
  unitId: z.string().nullable().default(null),
  phone: z.string().trim().max(60).default(""),
  order: z.number().int().default(0),
});
export type PersonnelInput = z.infer<typeof personnelInputSchema>;
export const personnelPatchSchema = personnelInputSchema.partial().strict();

export const unitInputSchema = z.object({
  key: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(80),
  tagesbefehlLabel: z.string().trim().min(1).max(80),
  order: z.number().int().default(0),
  kvkOnly: z.boolean().default(false),
});
export type UnitInput = z.infer<typeof unitInputSchema>;
export const unitPatchSchema = unitInputSchema.partial().strict();

export const categoryInputSchema = z.object({
  key: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(80),
  color: hex,
  textColor: hex.default("#000000"),
  shape: z.enum(CATEGORY_SHAPES).default("rect"),
  excludeFromTagesbefehl: z.boolean().default(false),
  tagesbefehlSection: z.enum(TB_SECTIONS).default("dienstbetrieb"),
  order: z.number().int().default(0),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;
export const categoryPatchSchema = categoryInputSchema.partial().strict();

export const termInputSchema = z.object({
  kind: z.enum(TERM_KINDS),
  de: z.string().trim().min(1).max(120),
  it: z.string().trim().max(120).default(""),
  order: z.number().int().default(0),
});
export type TermInput = z.infer<typeof termInputSchema>;
export const termPatchSchema = termInputSchema.partial().strict();

export const tagesbefehlRowInputSchema = z.object({
  section: z.enum(TB_SECTIONS),
  groupKey: z.string().nullable().default(null),
  groupLabel: z.string().trim().max(80).default(""),
  order: z.number().int().optional(),
  timeText: z.string().trim().max(40).default(""),
  activity: z.string().trim().max(300).default(""),
  responsibility: z.string().trim().max(200).default(""),
  location: z.string().trim().max(200).default(""),
});
export type TagesbefehlRowInput = z.infer<typeof tagesbefehlRowInputSchema>;

export const tagesbefehlRowPatchSchema = z
  .object({
    groupKey: z.string().nullable().optional(),
    groupLabel: z.string().trim().max(80).optional(),
    order: z.number().int().optional(),
    timeText: z.string().trim().max(40).optional(),
    activity: z.string().trim().max(300).optional(),
    responsibility: z.string().trim().max(200).optional(),
    location: z.string().trim().max(200).optional(),
    /** true = Override aufheben und Quellwerte übernehmen. */
    resetToSource: z.boolean().optional(),
  })
  .strict();
export type TagesbefehlRowPatch = z.infer<typeof tagesbefehlRowPatchSchema>;

export const tagesbefehlPatchSchema = z
  .object({
    number: z.number().int().min(0).optional(),
    status: z.enum(STATUSES).optional(),
    validFrom: z.string().trim().max(40).optional(),
    revision: z.number().int().min(0).optional(),
    replacesVersion: z.string().trim().max(40).optional(),
    besonderesNote: z.string().max(2000).optional(),
  })
  .strict();
export type TagesbefehlPatch = z.infer<typeof tagesbefehlPatchSchema>;

export const rowReorderSchema = z.object({
  rowIds: z.array(z.string().min(1)).min(1),
});

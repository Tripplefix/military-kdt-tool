/**
 * Seed: legt den WK 2026 der Ter Div Stabskp 3 mit Einstellungen, Personal, Zügen,
 * Kategorien, Begriffen, vier Wochen (WKW0 = KVK) und Beispielblöcken an.
 * Idempotent: bricht ab, wenn bereits ein WK existiert (ausser mit --force).
 */
import { eq } from "drizzle-orm";
import { createDb } from "./client";
import * as s from "./schema";
import { LANE_PROFILES } from "@/shared/lanes";
import { addDaysIso, weekdayOfIso, isWeekend } from "@/shared/time";
import { createWeekWithDays } from "@/server/services/weekService";
import { DEFAULT_CATEGORIES, DEFAULT_STANDARD_REPORTS, DEFAULT_STANDARD_TIMES, DEFAULT_TERMS, DEFAULT_UNITS } from "./defaults";

const db = createDb();
const force = process.argv.includes("--force");

const existing = db.select().from(s.wk).all();
if (existing.length > 0 && !force) {
  console.log(`Es existieren bereits ${existing.length} WK(s). Mit --force wird alles gelöscht und neu angelegt.`);
  process.exit(0);
}
if (force) {
  for (const w of existing) db.delete(s.wk).where(eq(s.wk.id, w.id)).run();
}

const START = "2026-09-21"; // Montag WKW0 (KVK)
const wkId = crypto.randomUUID();

db.transaction((tx) => {
  tx.insert(s.wk)
    .values({ id: wkId, name: "WK 2026 – Ter Div Stabskp 3", startDate: START, endDate: addDaysIso(START, 25) })
    .run();

  tx.insert(s.settings)
    .values({
      wkId,
      companyName: "Ter Div Stabskp 3",
      battalionName: "Ter Div Stabsbat 3",
      kpKdtName: "Hptm Isler, Rolf",
      kdtStvName: "Oblt Sieber, Dario",
      batKdtName: "Oberstlt i Gst Ciarulli, Giovanni",
      standardTimes: DEFAULT_STANDARD_TIMES,
      standardReports: DEFAULT_STANDARD_REPORTS,
      phoneKp: "(noch nicht bekannt)",
      phoneLvzMcc: "(noch nicht bekannt)",
      phoneTagesof: "(noch nicht bekannt)",
      phoneWachtof: "(noch nicht bekannt)",
      distribution: {
        eingesehenVon: "Bat Kdt",
        gehtAn: ["Kader Stabskp", "Truppe (via Anschlagsbrett)"],
        zKAn: ["Bat Kanzlei"],
      },
      remarksDefault: "Rapporte:\nBR: Bataillonsrapport\nKR: Kompanierapport\nDR: Dienstrapport\nAR: Ausbildungsrapport",
      wochenzieleDefault: "",
    })
    .run();

  const unitIds: Record<string, string> = {};
  DEFAULT_UNITS.forEach((u, order) => {
    const id = crypto.randomUUID();
    unitIds[u.key] = id;
    tx.insert(s.unit).values({ id, wkId, order, ...u }).run();
  });

  const people: Array<{ name: string; rank: string; role: s.Personnel["role"]; unitKey?: string }> = [
    { name: "Isler, Rolf", rank: "Hptm", role: "kpKdt" },
    { name: "Sieber, Dario", rank: "Oblt", role: "kdtStv" },
    { name: "Coduri", rank: "Oblt", role: "hoehererKader" },
    { name: "Gemeinder", rank: "Lt", role: "zfhr", unitKey: "log" },
    { name: "Koç", rank: "Lt", role: "hoehererKader" },
    { name: "Lopez-Polo, Christophe", rank: "Lt", role: "zfhr", unitKey: "stabszBat" },
    { name: "Omura", rank: "Lt", role: "zfhr", unitKey: "kdo" },
    { name: "Lehner", rank: "Lt", role: "zfhr", unitKey: "log" },
    { name: "Köchli", rank: "Lt", role: "zfhr", unitKey: "stabszBat" },
    { name: "Heusser", rank: "Adj Uof", role: "zfhr", unitKey: "stabszGsVb" },
    { name: "Cattaneo", rank: "Fur", role: "einhFur", unitKey: "syst" },
    { name: "Ciarulli, Giovanni", rank: "Oberstlt i Gst", role: "batKdt" },
  ];
  const personIds: Record<string, string> = {};
  people.forEach((p, order) => {
    const id = crypto.randomUUID();
    personIds[p.name.split(",")[0]] = id;
    tx.insert(s.personnel)
      .values({ id, wkId, name: p.name, rank: p.rank, role: p.role, unitId: p.unitKey ? unitIds[p.unitKey] : null, order })
      .run();
  });

  const catIds: Record<string, string> = {};
  DEFAULT_CATEGORIES.forEach((c, order) => {
    const id = crypto.randomUUID();
    catIds[c.key] = id;
    tx.insert(s.category).values({ id, wkId, order, ...c }).run();
  });

  DEFAULT_TERMS.forEach((t, order) => {
    tx.insert(s.termTemplate).values({ wkId, order, ...t }).run();
  });

  // Tagesof-Rotation wie im Excel (WKW0)
  const tagesofRotation = ["Sieber", "Gemeinder", "Köchli", "Lehner", "Lopez-Polo", "Lopez-Polo", "Lopez-Polo"];

  const weekIds: string[] = [];
  for (let i = 0; i < 4; i++) {
    const startDate = addDaysIso(START, i * 7);
    const kind = i === 0 ? "kvk" : "normal";
    const { weekId, dayIds } = createWeekWithDays(tx, {
      wkId,
      index: i,
      label: `WKW${i}`,
      title: i === 0 ? "Wochenarbeitsplan KVK" : `Wochenarbeitsplan Woche ${i}`,
      startDate,
      kind,
      wachtofPersonnelId: personIds["Lopez-Polo"],
      wochenziele:
        i === 0
          ? "- Erfolgreiche Durchführung des zentralen KVK\n- Kader sind vorbereitet für den ADF\n- Ausbildungen und Vb Trainings sind geplant"
          : "",
    });
    weekIds.push(weekId);
    dayIds.forEach((dayId, di) => {
      tx.update(s.day).set({ tagesofPersonnelId: personIds[tagesofRotation[di]] }).where(eq(s.day.id, dayId)).run();
    });

    // Beispielblöcke: Essen und AV/ABV an allen Tagen, ein paar Aktivitäten am Montag
    dayIds.forEach((dayId, di) => {
      const date = addDaysIso(startDate, di);
      const wd = weekdayOfIso(date);
      const weekend = isWeekend(wd);
      const lanes = weekend ? LANE_PROFILES.weekend : LANE_PROFILES[kind];
      const unitCount = lanes.filter((l) => l.kind === "unit").length;
      const all = { laneStartOrder: 0, laneSpan: unitCount };
      const meals = [
        { title: "MoE", startMin: 360, endMin: 420 },
        { title: "MiE", startMin: 720, endMin: 780 },
        { title: "NaE", startMin: 1080, endMin: 1140 },
      ];
      for (const m of meals) {
        tx.insert(s.block).values({ dayId, categoryId: catIds.meal, location: "", ...all, ...m }).run();
      }
      if (!weekend) {
        tx.insert(s.block).values({ dayId, title: "AV", startMin: 435, endMin: 450, categoryId: catIds.av, ...all }).run();
        tx.insert(s.block).values({ dayId, title: "ABV", startMin: 1350, endMin: 1365, categoryId: catIds.av, ...all }).run();
        tx.insert(s.block).values({ dayId, title: "PD/ID", startMin: 1290, endMin: 1350, categoryId: catIds.dienst, ...all }).run();
        tx.insert(s.block)
          .values({ dayId, title: "DR", startMin: 450, endMin: 480, categoryId: catIds.rapportBlack, laneStartOrder: unitCount, laneSpan: 1, location: "Rapportraum", responsibility: "Kp Kdt / cdt cp" })
          .run();
      }
      if (i === 1 && di === 0) {
        tx.insert(s.block)
          .values({ dayId, title: "Dienstbetrieb", location: "Bonaduz", startMin: 450, endMin: 720, categoryId: catIds.dienst, laneStartOrder: 0, laneSpan: 1, responsibility: "Zfhr / caposez" })
          .run();
        tx.insert(s.block)
          .values({ dayId, title: "Log Betrieb", location: "Bonaduz", startMin: 450, endMin: 720, categoryId: catIds.dienst, laneStartOrder: 1, laneSpan: 1, responsibility: "Zfhr / caposez" })
          .run();
        tx.insert(s.block)
          .values({ dayId, title: "Betrieb Bat KP", location: "Alte Post", startMin: 450, endMin: 1080, categoryId: catIds.dienst, laneStartOrder: 2, laneSpan: 1, responsibility: "Zfhr / caposez" })
          .run();
        tx.insert(s.block)
          .values({ dayId, title: "KU gem Bf Bat", startMin: 780, endMin: 1080, categoryId: catIds.ku, laneStartOrder: 3, laneSpan: 2, responsibility: "Bat Kdt" })
          .run();
        tx.insert(s.block)
          .values({ dayId, title: "AR 1", startMin: 1140, endMin: 1200, categoryId: catIds.rapport, laneStartOrder: 4, laneSpan: 1, location: "Bat KP", responsibility: "Kdt Stv" })
          .run();
        const fnId = crypto.randomUUID();
        tx.insert(s.footnote)
          .values({ id: fnId, dayId, number: 10, text: "Synchro LVZ mit Zfhr Stabsz Bat, Bat KP (S1)", startMin: 1050, endMin: 1080 })
          .run();
      }
    });
  }
});

console.log(`Seed abgeschlossen. WK-ID: ${wkId}`);

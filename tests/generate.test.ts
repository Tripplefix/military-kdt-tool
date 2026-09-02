import { describe, expect, it } from "vitest";
import { generateTagesbefehl, tagesbefehlGroups, type GenerateInput } from "@/shared/tagesbefehl/generate";
import { block, categories, footnote, lanesFor, monday, personnel, saturday, settings, units, week } from "./fixtures";

function input(over: Partial<GenerateInput> = {}): GenerateInput {
  return { day: monday, week, lanes: lanesFor("normal"), blocks: [], footnotes: [], categories, settings, units, personnel, ...over };
}
const sec = (rows: ReturnType<typeof generateTagesbefehl>, s: string) => rows.filter((r) => r.section === s);

describe("tagesbefehlGroups", () => {
  it("liefert Alle plus Züge der Woche in Zug-Reihenfolge", () => {
    expect(tagesbefehlGroups(lanesFor("normal"), units).map((g) => g.key)).toEqual(["alle", "kdo", "log", "stabszBat", "stabszGsVb", "syst"]);
    expect(tagesbefehlGroups(lanesFor("normal"), units)[1].label).toBe("Kdo Z");
  });
  it("Wochenende hat nur Alle", () => {
    expect(tagesbefehlGroups(lanesFor("weekend"), units).map((g) => g.key)).toEqual(["alle"]);
  });
  it("KVK-Woche nutzt KVK-Lanes; unbekannte Zug-Schlüssel fallen auf das Lane-Label zurück", () => {
    const g = tagesbefehlGroups(lanesFor("kvk"), units);
    expect(g.map((x) => x.key)).toContain("wachDet");
    expect(g.find((x) => x.key === "wachDet")?.label).toBe("Wach Det");
  });
});

describe("generateTagesbefehl – Standardzeiten", () => {
  it("Werktag: Standardzeiten mit inTagesbefehl in Gruppe Alle, HV gross nicht", () => {
    const alle = sec(generateTagesbefehl(input()), "dienstbetrieb").filter((r) => r.groupKey === "alle");
    expect(alle.map((r) => r.activity)).toEqual(["Tagwache", "Morgenessen", "AV", "Mittagessen"]);
    expect(alle[1].timeText).toBe("0600-0700");
    expect(alle[0].timeText).toBe("0545");
    expect(alle[0].sourceKey).toBe("standard:tagwache");
  });
  it("Wochenende: kein AV, dafür HV Urlaub", () => {
    const alle = sec(generateTagesbefehl(input({ day: saturday, lanes: lanesFor("weekend") })), "dienstbetrieb");
    expect(alle.map((r) => r.activity)).toEqual(["Tagwache", "Morgenessen", "Mittagessen", "HV Urlaub"]);
  });
});

describe("generateTagesbefehl – Blöcke", () => {
  it("Block über alle Unit-Lanes -> Alle; Essen-Kategorie wird ausgeblendet", () => {
    const rows = generateTagesbefehl(
      input({
        blocks: [
          block({ id: "kaderabend", title: "Kaderabend", startMin: 1200, endMin: 1320, laneStartOrder: 0, laneSpan: 5, location: "MZG" }),
          block({ id: "mie", title: "MiE", startMin: 720, endMin: 780, laneStartOrder: 0, laneSpan: 7, categoryId: "c-meal" }),
        ],
      }),
    );
    const d = sec(rows, "dienstbetrieb");
    expect(d.find((r) => r.activity === "Kaderabend")?.groupKey).toBe("alle");
    expect(d.find((r) => r.activity === "Kaderabend")?.location).toBe("MZG");
    expect(d.find((r) => r.activity === "MiE")).toBeUndefined();
  });
  it("Block über zwei Lanes -> zwei Zeilen in den jeweiligen Zügen", () => {
    const rows = generateTagesbefehl(input({ blocks: [block({ id: "ku", title: "KU", startMin: 780, endMin: 1080, laneStartOrder: 1, laneSpan: 2, responsibility: "Bat Kdt" })] }));
    const ku = sec(rows, "dienstbetrieb").filter((r) => r.activity === "KU");
    expect(ku.map((r) => r.groupKey)).toEqual(["log", "stabszBat"]);
    expect(ku.map((r) => r.sourceKey)).toEqual(["block:ku:log", "block:ku:stabszBat"]);
    expect(ku[0].groupLabel).toBe("Log Z");
    expect(ku[0].timeText).toBe("1300-1800");
  });
  it("Block in Rap-Lane -> Abschnitt 3; Kategorie Besonderes -> Abschnitt 2; Beso-Lane wird ignoriert", () => {
    const rows = generateTagesbefehl(
      input({
        blocks: [
          block({ id: "dr", title: "DR", startMin: 450, endMin: 480, laneStartOrder: 5, laneSpan: 1, categoryId: "c-rapport" }),
          block({ id: "wat", title: "WAT 2", startMin: 570, endMin: 600, laneStartOrder: 0, laneSpan: 1, categoryId: "c-beso" }),
          block({ id: "x", title: "Marker", startMin: 570, endMin: 600, laneStartOrder: 6, laneSpan: 1 }),
        ],
      }),
    );
    expect(sec(rows, "rapporte").map((r) => r.activity)).toEqual(["DR", "Dienstrapport"]);
    expect(sec(rows, "besonderes").map((r) => r.activity)).toEqual(["WAT 2"]);
    expect(rows.find((r) => r.activity === "Marker")).toBeUndefined();
  });
  it("Wochenende: Kp-Lane ohne Zug -> Alle", () => {
    const rows = generateTagesbefehl(input({ day: saturday, lanes: lanesFor("weekend"), blocks: [block({ id: "sport", title: "Sport", startMin: 540, endMin: 660, laneStartOrder: 0, laneSpan: 1 })] }));
    expect(rows.find((r) => r.activity === "Sport")?.groupKey).toBe("alle");
  });
  it("sortiert je Gruppe nach Zeit und vergibt order je Abschnitt", () => {
    const rows = generateTagesbefehl(
      input({ blocks: [block({ id: "spaet", title: "Spät", startMin: 900, endMin: 960, laneStartOrder: 0, laneSpan: 1 }), block({ id: "frueh", title: "Früh", startMin: 480, endMin: 540, laneStartOrder: 0, laneSpan: 1 })] }),
    );
    const kdo = sec(rows, "dienstbetrieb").filter((r) => r.groupKey === "kdo");
    expect(kdo.map((r) => r.activity)).toEqual(["Früh", "Spät"]);
    const orders = sec(rows, "dienstbetrieb").map((r) => r.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(new Set(orders).size).toBe(orders.length);
  });
});

describe("generateTagesbefehl – Dubletten", () => {
  it("Block in Alle mit gleicher Zeit und Titel wie eine Standardzeit entfällt", () => {
    const rows = generateTagesbefehl(input({ blocks: [block({ id: "mie", title: "Mittagessen", startMin: 720, endMin: 780, laneStartOrder: 0, laneSpan: 5 })] }));
    expect(rows.filter((r) => r.activity.startsWith("Mittagessen"))).toHaveLength(1);
    expect(rows.find((r) => r.activity.startsWith("Mittagessen"))?.sourceKind).toBe("standardTime");
  });
});

describe("generateTagesbefehl – Termine/Info, Rapporte, Kontakte", () => {
  it("Termine/Info mit Text -> Besonderes", () => {
    const rows = generateTagesbefehl(input({ footnotes: [footnote({ id: "f1", number: 10, text: "Synchro LVZ" }), footnote({ id: "f2", number: 11, text: "" })] }));
    expect(sec(rows, "besonderes").map((r) => r.activity)).toEqual(["Synchro LVZ"]);
    expect(sec(rows, "besonderes")[0].sourceKey).toBe("footnote:f1");
  });
  it("Standardrapporte nur an Werktagen", () => {
    expect(sec(generateTagesbefehl(input()), "rapporte").map((r) => r.activity)).toEqual(["Dienstrapport"]);
    expect(sec(generateTagesbefehl(input({ day: saturday, lanes: lanesFor("weekend") })), "rapporte")).toEqual([]);
  });
  it("Kontakte: KP, LVZ/MCC, Wachtof der Woche, Tagesof des Tages", () => {
    const k = sec(generateTagesbefehl(input()), "kommandierungen");
    expect(k.map((r) => r.activity)).toEqual(["KP Stabskp 3", "LVZ / MCC", "Wachtof", "Tagesof"]);
    expect(k[2].responsibility).toBe("Lt Lopez-Polo");
    expect(k[2].location).toBe("Tel: 079 2");
    expect(k[3].responsibility).toBe("Oblt Sieber");
    expect(k[3].timeText).toBe("gz Tag");
  });
});

import { describe, expect, it } from "vitest";
import { generateTagesbefehl, tagesbefehlGroups } from "@/shared/tagesbefehl/generate";
import { mergeRows, snapshotOf } from "@/shared/tagesbefehl/merge";
import type { TagesbefehlRowDto } from "@/shared/types";
import { block, categories, lanesFor, monday, personnel, settings, units, week } from "./fixtures";

const lanes = lanesFor("normal");
const groups = tagesbefehlGroups(lanes, units);
const gen = (blocks = [block({ id: "b1", title: "Ausb Funk", startMin: 480, endMin: 600, laneStartOrder: 0, laneSpan: 1, location: "MZG" })]) =>
  generateTagesbefehl({ day: monday, week, lanes, blocks, footnotes: [], categories, settings, units, personnel });

function persisted(rows: ReturnType<typeof mergeRows>["rows"]): TagesbefehlRowDto[] {
  return rows.map((r, i) => ({ ...r, id: r.id ?? `row${i}`, tagesbefehlId: "tb" }));
}

describe("mergeRows", () => {
  it("erste Generierung erzeugt neue Zeilen ohne id", () => {
    const { rows, removeIds } = mergeRows([], gen(), groups);
    expect(removeIds).toEqual([]);
    expect(rows.every((r) => r.id === undefined && !r.overridden && !r.deleted)).toBe(true);
    expect(rows.find((r) => r.sourceKey === "block:b1:kdo")?.sourceSnapshot?.activity).toBe("Ausb Funk");
  });

  it("nicht überschriebene Zeilen werden aktualisiert und behalten ihre id", () => {
    const first = persisted(mergeRows([], gen(), groups).rows);
    const moved = gen([block({ id: "b1", title: "Ausb Funk", startMin: 540, endMin: 660, laneStartOrder: 0, laneSpan: 1, location: "Chur" })]);
    const { rows } = mergeRows(first, moved, groups);
    const row = rows.find((r) => r.sourceKey === "block:b1:kdo")!;
    expect(row.id).toBe(first.find((r) => r.sourceKey === "block:b1:kdo")!.id);
    expect(row.timeText).toBe("0900-1100");
    expect(row.location).toBe("Chur");
  });

  it("überschriebene Zeile behält Benutzerwerte und meldet geänderte Quelle", () => {
    const first = persisted(mergeRows([], gen(), groups).rows);
    const edited = first.map((r) => (r.sourceKey === "block:b1:kdo" ? { ...r, activity: "Ausb Funk (angepasst)", overridden: true } : r));
    // Quelle unverändert -> kein sourceChanged
    const same = mergeRows(edited, gen(), groups).rows.find((r) => r.sourceKey === "block:b1:kdo")!;
    expect(same.activity).toBe("Ausb Funk (angepasst)");
    expect(same.sourceChanged).toBe(false);
    // Quelle geändert -> sourceChanged, Benutzerwerte bleiben, Snapshot zeigt neue Quelle
    const changedGen = gen([block({ id: "b1", title: "Ausb Funk", startMin: 540, endMin: 660, laneStartOrder: 0, laneSpan: 1, location: "MZG" })]);
    const changed = mergeRows(edited, changedGen, groups).rows.find((r) => r.sourceKey === "block:b1:kdo")!;
    expect(changed.activity).toBe("Ausb Funk (angepasst)");
    expect(changed.timeText).toBe("0800-1000");
    expect(changed.sourceChanged).toBe(true);
    expect(changed.sourceSnapshot?.timeText).toBe("0900-1100");
  });

  it("gelöschte generierte Zeilen kehren nicht zurück", () => {
    const first = persisted(mergeRows([], gen(), groups).rows);
    const deleted = first.map((r) => (r.sourceKey === "standard:av" ? { ...r, deleted: true } : r));
    const { rows } = mergeRows(deleted, gen(), groups);
    expect(rows.find((r) => r.sourceKey === "standard:av")?.deleted).toBe(true);
  });

  it("Block gelöscht -> Zeile entfernt; überschriebene Zeile bleibt als orphan", () => {
    const first = persisted(mergeRows([], gen(), groups).rows);
    const withoutBlock = gen([]);
    const plain = mergeRows(first, withoutBlock, groups);
    expect(plain.rows.find((r) => r.sourceKey === "block:b1:kdo")).toBeUndefined();
    expect(plain.removeIds).toContain(first.find((r) => r.sourceKey === "block:b1:kdo")!.id);

    const edited = first.map((r) => (r.sourceKey === "block:b1:kdo" ? { ...r, activity: "Eigen", overridden: true } : r));
    const kept = mergeRows(edited, withoutBlock, groups);
    const orphan = kept.rows.find((r) => r.sourceKey === "block:b1:kdo")!;
    expect(orphan.orphan).toBe(true);
    expect(orphan.activity).toBe("Eigen");
  });

  it("manuelle Zeilen bleiben und werden nach Zeit einsortiert", () => {
    const first = persisted(mergeRows([], gen(), groups).rows);
    const manual: TagesbefehlRowDto = {
      id: "m1", tagesbefehlId: "tb", section: "dienstbetrieb", groupKey: "kdo", groupLabel: "Kdo Z", order: 99, timeText: "ab 0700", startMin: 420, endMin: null,
      activity: "Manuell", responsibility: "", location: "", sourceBlockId: null, sourceKind: "manual", sourceKey: null, sourceSnapshot: null,
      overridden: false, deleted: false, sourceChanged: false, orphan: false,
    };
    const { rows } = mergeRows([...first, manual], gen(), groups);
    const kdo = rows.filter((r) => r.section === "dienstbetrieb" && r.groupKey === "kdo");
    expect(kdo.map((r) => r.activity)).toEqual(["Manuell", "Ausb Funk"]);
  });

  it("snapshotOf enthält die Vergleichsfelder", () => {
    expect(snapshotOf({ timeText: "0800", activity: "A", responsibility: "B", location: "C", groupKey: "kdo" })).toEqual({ timeText: "0800", activity: "A", responsibility: "B", location: "C", groupKey: "kdo" });
  });
});

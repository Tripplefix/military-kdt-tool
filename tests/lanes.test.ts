import { describe, expect, it } from "vitest";
import { LANE_PROFILES, clampSpan, coveredLanes, isValidSpan, spansAllUnitLanes, unitLanes } from "@/shared/lanes";

const lanes = LANE_PROFILES.normal.map((l, order) => ({ ...l, order }));

describe("Lane-Profile", () => {
  it("normale Woche hat 5 Unit-Lanes plus Rap und Beso", () => {
    expect(unitLanes(lanes)).toHaveLength(5);
    expect(lanes.at(-2)?.kind).toBe("report");
    expect(lanes.at(-1)?.kind).toBe("info");
  });
  it("KVK-Woche hat 6 Unit-Lanes, Wochenende eine", () => {
    expect(unitLanes(LANE_PROFILES.kvk.map((l, order) => ({ ...l, order })))).toHaveLength(6);
    expect(unitLanes(LANE_PROFILES.weekend.map((l, order) => ({ ...l, order })))).toHaveLength(1);
  });
});

describe("coveredLanes / spansAllUnitLanes", () => {
  it("liefert die überdeckten Lanes in Reihenfolge", () => {
    const covered = coveredLanes({ laneStartOrder: 1, laneSpan: 2 }, lanes);
    expect(covered.map((l) => l.key)).toEqual(["log", "stabszBat"]);
  });
  it("erkennt Blöcke über alle Unit-Lanes", () => {
    expect(spansAllUnitLanes({ laneStartOrder: 0, laneSpan: 5 }, lanes)).toBe(true);
    expect(spansAllUnitLanes({ laneStartOrder: 0, laneSpan: 7 }, lanes)).toBe(true);
    expect(spansAllUnitLanes({ laneStartOrder: 0, laneSpan: 4 }, lanes)).toBe(false);
    expect(spansAllUnitLanes({ laneStartOrder: 1, laneSpan: 4 }, lanes)).toBe(false);
  });
});

describe("clampSpan / isValidSpan", () => {
  it("klemmt Spannweite und Start in die verfügbare Anzahl", () => {
    expect(clampSpan({ laneStartOrder: 0, laneSpan: 7 }, 3)).toEqual({ laneStartOrder: 0, laneSpan: 3 });
    expect(clampSpan({ laneStartOrder: 5, laneSpan: 2 }, 3)).toEqual({ laneStartOrder: 1, laneSpan: 2 });
    expect(clampSpan({ laneStartOrder: 2, laneSpan: 1 }, 7)).toEqual({ laneStartOrder: 2, laneSpan: 1 });
  });
  it("validiert Spannweiten", () => {
    expect(isValidSpan({ laneStartOrder: 0, laneSpan: 7 }, 7)).toBe(true);
    expect(isValidSpan({ laneStartOrder: 6, laneSpan: 2 }, 7)).toBe(false);
    expect(isValidSpan({ laneStartOrder: 0, laneSpan: 0 }, 7)).toBe(false);
    expect(isValidSpan({ laneStartOrder: -1, laneSpan: 1 }, 7)).toBe(false);
  });
});

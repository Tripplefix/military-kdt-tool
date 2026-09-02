import { describe, expect, it } from "vitest";
import { laneAtFraction, laneSlots, layoutOverlaps, spanSlot } from "@/shared/gridLayout";
import type { LaneDto } from "@/shared/types";

const lane = (key: string, widthWeight: number, order: number): LaneDto => ({
  id: key,
  weekId: "w",
  dayId: null,
  key,
  label: key,
  order,
  widthWeight,
  kind: "unit",
  zugKey: null,
});

describe("laneSlots / spanSlot / laneAtFraction", () => {
  const lanes = [lane("a", 1, 0), lane("b", 1, 1), lane("rap", 0.5, 2), lane("beso", 0.5, 3)];
  const slots = laneSlots(lanes);
  it("verteilt Breiten nach Gewicht", () => {
    expect(slots[0]).toEqual({ left: 0, width: 1 / 3 });
    expect(slots[2].left).toBeCloseTo(2 / 3);
    expect(slots[3].width).toBeCloseTo(1 / 6);
  });
  it("berechnet die Ausdehnung eines Blocks über mehrere Lanes", () => {
    const s = spanSlot(slots, 0, 2);
    expect(s.left).toBe(0);
    expect(s.width).toBeCloseTo(2 / 3);
  });
  it("findet die Lane an einer Position", () => {
    expect(laneAtFraction(slots, 0.1)).toBe(0);
    expect(laneAtFraction(slots, 0.5)).toBe(1);
    expect(laneAtFraction(slots, 0.7)).toBe(2);
    expect(laneAtFraction(slots, 0.99)).toBe(3);
  });
});

describe("layoutOverlaps", () => {
  it("lässt Blöcke in verschiedenen Lanes in Ruhe", () => {
    const r = layoutOverlaps([
      { id: "a", startMin: 480, endMin: 600, laneStartOrder: 0, laneSpan: 1 },
      { id: "b", startMin: 480, endMin: 600, laneStartOrder: 1, laneSpan: 1 },
    ]);
    expect(r.get("a")).toEqual({ column: 0, columns: 1 });
    expect(r.get("b")).toEqual({ column: 0, columns: 1 });
  });
  it("legt zeitlich überlappende Blöcke derselben Lane nebeneinander", () => {
    const r = layoutOverlaps([
      { id: "a", startMin: 480, endMin: 600, laneStartOrder: 0, laneSpan: 1 },
      { id: "b", startMin: 540, endMin: 660, laneStartOrder: 0, laneSpan: 1 },
      { id: "c", startMin: 700, endMin: 760, laneStartOrder: 0, laneSpan: 1 },
    ]);
    expect(r.get("a")).toEqual({ column: 0, columns: 2 });
    expect(r.get("b")).toEqual({ column: 1, columns: 2 });
    expect(r.get("c")).toEqual({ column: 0, columns: 1 });
  });
  it("berücksichtigt Mehrspalten-Blöcke", () => {
    const r = layoutOverlaps([
      { id: "wide", startMin: 480, endMin: 600, laneStartOrder: 0, laneSpan: 3 },
      { id: "x", startMin: 500, endMin: 560, laneStartOrder: 2, laneSpan: 1 },
    ]);
    expect(r.get("wide")?.columns).toBe(2);
    expect(r.get("x")?.column).toBe(1);
  });
});

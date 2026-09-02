import { describe, expect, it } from "vitest";
import {
  addDaysIso,
  clampToGrid,
  formatIsoDe,
  formatRange,
  minutesToHHMM,
  parseHHMM,
  parseTimeText,
  snap15,
  weekdayOfIso,
} from "@/shared/time";

describe("snap15 / clampToGrid", () => {
  it("rundet auf das 15-Minuten-Raster", () => {
    expect(snap15(452)).toBe(450);
    expect(snap15(458)).toBe(465);
    expect(snap15(0)).toBe(0);
  });
  it("begrenzt auf 0500–2300", () => {
    expect(clampToGrid(100)).toBe(300);
    expect(clampToGrid(1400)).toBe(1380);
    expect(clampToGrid(600)).toBe(600);
  });
});

describe("minutesToHHMM / parseHHMM", () => {
  it("formatiert vierstellig", () => {
    expect(minutesToHHMM(450)).toBe("0730");
    expect(minutesToHHMM(0)).toBe("0000");
    expect(minutesToHHMM(1380)).toBe("2300");
  });
  it("akzeptiert gängige Schreibweisen", () => {
    expect(parseHHMM("0730")).toBe(450);
    expect(parseHHMM("07:30")).toBe(450);
    expect(parseHHMM("7:30")).toBe(450);
    expect(parseHHMM("730")).toBe(450);
    expect(parseHHMM("7.30")).toBe(450);
  });
  it("lehnt Unsinn ab", () => {
    expect(parseHHMM("abc")).toBeNull();
    expect(parseHHMM("2560")).toBeNull();
    expect(parseHHMM("12")).toBeNull();
  });
});

describe("formatRange / parseTimeText", () => {
  it("bildet Bereiche", () => {
    expect(formatRange(450, 480)).toBe("0730-0800");
    expect(formatRange(450, null)).toBe("0730");
    expect(formatRange(450, 450)).toBe("0730");
  });
  it("parst Freitext-Zeiten", () => {
    expect(parseTimeText("0730-0800")).toEqual({ startMin: 450, endMin: 480 });
    expect(parseTimeText("07:30 – 08:00")).toEqual({ startMin: 450, endMin: 480 });
    expect(parseTimeText("ab 0930")).toEqual({ startMin: 570, endMin: null });
    expect(parseTimeText("bis 1200")).toEqual({ startMin: null, endMin: 720 });
    expect(parseTimeText("1030")).toEqual({ startMin: 630, endMin: null });
    expect(parseTimeText("gz Tag")).toEqual({ startMin: null, endMin: null });
    expect(parseTimeText("ständig")).toEqual({ startMin: null, endMin: null });
  });
});

describe("Datum", () => {
  it("addiert Tage über Monatsgrenzen", () => {
    expect(addDaysIso("2026-09-28", 7)).toBe("2026-10-05");
    expect(addDaysIso("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("kennt den Wochentag", () => {
    expect(weekdayOfIso("2026-09-21")).toBe(1); // Montag
    expect(weekdayOfIso("2026-09-27")).toBe(0); // Sonntag
  });
  it("formatiert deutsch", () => {
    expect(formatIsoDe("2026-09-21")).toBe("21.09.2026");
  });
});

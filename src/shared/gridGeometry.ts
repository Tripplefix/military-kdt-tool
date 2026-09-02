import { GRID_START_MIN, SLOT_MIN } from "./constants";
import { snap15, clampToGrid } from "./time";

/** Vertikale Position (in Einheiten, z. B. px oder mm) für eine Uhrzeit. */
export function minutesToOffset(min: number, rowSize: number): number {
  return ((min - GRID_START_MIN) / SLOT_MIN) * rowSize;
}

/** Uhrzeit (auf 15 min gerastert und ins Raster geklemmt) aus vertikaler Position. */
export function offsetToMinutes(offset: number, rowSize: number): number {
  return clampToGrid(snap15(GRID_START_MIN + (offset / rowSize) * SLOT_MIN));
}

/** Höhe eines Zeitbereichs. */
export function durationToSize(startMin: number, endMin: number, rowSize: number): number {
  return ((endMin - startMin) / SLOT_MIN) * rowSize;
}

/** Stundenbeschriftungen 0500 … 2300 */
export function hourLabels(): Array<{ min: number; label: string }> {
  const out: Array<{ min: number; label: string }> = [];
  for (let h = 5; h <= 23; h++) out.push({ min: h * 60, label: `${String(h).padStart(2, "0")}00` });
  return out;
}

import { GRID_END_MIN, GRID_START_MIN, SLOT_MIN } from "./constants";

/** Rundet Minuten auf das 15-Minuten-Raster. */
export function snap15(min: number): number {
  return Math.round(min / SLOT_MIN) * SLOT_MIN;
}

/** Begrenzt Minuten auf das sichtbare Raster 0500–2300. */
export function clampToGrid(min: number): number {
  return Math.min(GRID_END_MIN, Math.max(GRID_START_MIN, min));
}

/** 450 -> "0730" */
export function minutesToHHMM(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}${String(mm).padStart(2, "0")}`;
}

/** 450 -> "07:30" */
export function minutesToClock(min: number): string {
  const s = minutesToHHMM(min);
  return `${s.slice(0, 2)}:${s.slice(2)}`;
}

/** Akzeptiert "0730", "07:30", "7:30", "730", "7.30". Gibt null bei ungültiger Eingabe. */
export function parseHHMM(input: string): number | null {
  const s = input.trim().replace(/[.:h ]/g, "");
  if (!/^\d{3,4}$/.test(s)) return null;
  const padded = s.padStart(4, "0");
  const h = Number(padded.slice(0, 2));
  const m = Number(padded.slice(2));
  if (h > 24 || m > 59) return null;
  if (h === 24 && m > 0) return null;
  return h * 60 + m;
}

/** 450, 480 -> "0730-0800" */
export function formatRange(startMin: number, endMin: number | null | undefined): string {
  if (endMin == null || endMin === startMin) return minutesToHHMM(startMin);
  return `${minutesToHHMM(startMin)}-${minutesToHHMM(endMin)}`;
}

export interface ParsedTimeText {
  startMin: number | null;
  endMin: number | null;
}

/**
 * Zeit-Freitext des Tagesbefehls in Minuten übersetzen, soweit möglich.
 * "0730-0800" -> {450,480}; "0730" -> {450,null}; "ab 0930" -> {570,null};
 * "bis 1200" -> {null,720}; "gz Tag", "ständig", "gem MBK" -> {null,null}.
 */
export function parseTimeText(text: string): ParsedTimeText {
  const t = text.trim().toLowerCase();
  const T = "(\\d{1,2}[:.]\\d{2}|\\d{3,4})";
  const range = t.match(new RegExp(`^${T}\\s*[-–]\\s*${T}$`));
  if (range) {
    return { startMin: parseHHMM(range[1]), endMin: parseHHMM(range[2]) };
  }
  const ab = t.match(new RegExp(`^(?:ab|dès|da)\\s+${T}$`));
  if (ab) return { startMin: parseHHMM(ab[1]), endMin: null };
  const bis = t.match(new RegExp(`^(?:bis|jusqu'à|fino a)\\s+${T}$`));
  if (bis) return { startMin: null, endMin: parseHHMM(bis[1]) };
  const single = t.match(new RegExp(`^${T}$`));
  if (single) return { startMin: parseHHMM(single[1]), endMin: null };
  return { startMin: null, endMin: null };
}

/** ISO-Datum (YYYY-MM-DD) plus n Tage. */
export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** 0 = Sonntag … 6 = Samstag, wie JS getDay(). */
export function weekdayOfIso(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** "2026-09-21" -> "21.09.2026" */
export function formatIsoDe(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function isWeekend(weekday: number): boolean {
  return weekday === 0 || weekday === 6;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

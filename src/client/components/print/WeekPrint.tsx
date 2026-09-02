"use client";

import { useEffect, useMemo } from "react";
import { GRID_SLOTS, WEEKDAY_NAMES_DE, WEEKDAY_NAMES_IT } from "@/shared/constants";
import { hourLabels, minutesToOffset } from "@/shared/gridGeometry";
import { formatIsoDe } from "@/shared/time";
import type { BlockDto, FootnoteDto, LaneDto, WeekBundle } from "@/shared/types";
import { DayColumn } from "@/client/components/week-grid/DayColumn";
import { DayFooter } from "@/client/components/week-grid/DayFooter";
import "@/client/components/week-grid/grid.css";
import "./print.css";
import { PrintToolbar } from "./PrintToolbar";

const MM = 96 / 25.4; // CSS-px je mm
const PAGE_W = 404 * MM;
const TIME_COL = 11 * MM;
const SIDEBAR = 50 * MM;
const HEADER_H = 9 * MM;
const LANE_HEADER_H = 16 * MM;
const FOOTER_H = 36 * MM;
const BODY_H = 281 * MM - HEADER_H - LANE_HEADER_H - FOOTER_H - 10 * MM;
const ROW_PX = Math.floor((BODY_H / GRID_SLOTS) * 10) / 10;

function dayWeight(lanes: LaneDto[]): number {
  return lanes.reduce((s, l) => s + l.widthWeight, 0) || 1;
}

function TimeAxis() {
  return (
    <div className="relative border-r border-black/60" style={{ height: GRID_SLOTS * ROW_PX }}>
      {hourLabels().map((h) => (
        <div key={h.min} className="absolute right-0.5 -translate-y-1/2 font-mono text-[7pt] leading-none" style={{ top: minutesToOffset(h.min, ROW_PX) }}>
          {h.label}
        </div>
      ))}
    </div>
  );
}

export function WeekPrint({ bundle }: { bundle: WeekBundle }) {
  const { week, days, lanesByDay, blocks, footnotes, categories, personnel, settings } = bundle;
  useEffect(() => {
    document.title = `WAP ${week.label} ${formatIsoDe(days[0]?.date ?? week.startDate)}`;
  }, [week, days]);

  const blocksByDay = useMemo(() => {
    const m: Record<string, BlockDto[]> = {};
    for (const b of blocks) (m[b.dayId] ??= []).push(b);
    return m;
  }, [blocks]);
  const footnotesByDay = useMemo(() => {
    const m: Record<string, FootnoteDto[]> = {};
    for (const f of footnotes) (m[f.dayId] ??= []).push(f);
    return m;
  }, [footnotes]);
  const gridTemplateColumns = `${TIME_COL}px ${days.map((d) => `${dayWeight(lanesByDay[d.id] ?? [])}fr`).join(" ")} ${TIME_COL}px ${SIDEBAR}px`;
  const wachtof = personnel.find((p) => p.id === week.wachtofPersonnelId);
  const remarks = week.remarks || settings.remarksDefault;
  const wochenziele = week.wochenziele || settings.wochenzieleDefault;

  return (
    <div className="print-a3">
      <PrintToolbar hint="A3 quer. Im Druckdialog «Querformat» und «Hintergrundgrafiken» aktivieren." />
      <div className="print-page-a3 text-[7pt] leading-tight" style={{ width: PAGE_W }}>
        <div className="flex items-baseline justify-between px-1" style={{ height: HEADER_H }}>
          <div className="flex items-baseline gap-6">
            <span className="text-[16pt] font-bold">{week.title}</span>
            <span className="text-[13pt] font-bold">
              {formatIsoDe(days[0]?.date ?? week.startDate)} bis {formatIsoDe(days[6]?.date ?? week.startDate)}
            </span>
          </div>
          <span className="text-[9pt] font-bold">Einheit / unità: {settings.companyName}</span>
        </div>

        <div className="grid border border-black/70" style={{ gridTemplateColumns }}>
          {/* Tagesköpfe */}
          <div className="border-r border-b border-black/70 p-0.5 text-center">Zeit<br />heure</div>
          {days.map((d) => (
            <div key={d.id} className="border-r border-b border-black/70 p-0.5 text-center">
              <div className="font-bold">{WEEKDAY_NAMES_DE[d.weekday]} / {WEEKDAY_NAMES_IT[d.weekday]}</div>
              <div>{formatIsoDe(d.date)}</div>
            </div>
          ))}
          <div className="border-r border-b border-black/70 p-0.5 text-center">Zeit<br />heure</div>
          <div className="border-b border-black/70 p-0.5 text-center font-bold">Bemerkungen / Observations</div>

          {/* Lane-Köpfe */}
          <div className="border-r border-b border-black/70" />
          {days.map((d) => {
            const lanes = lanesByDay[d.id] ?? [];
            const total = dayWeight(lanes);
            return (
              <div key={d.id} className="flex border-r border-b border-black/70" style={{ height: LANE_HEADER_H }}>
                {lanes.map((l) => (
                  <div key={l.id} className="flex items-end justify-center overflow-hidden border-r border-black/20 pb-0.5 last:border-r-0" style={{ width: `${(l.widthWeight / total) * 100}%` }}>
                    <span className={lanes.length > 3 ? "wap-vertical-text" : ""}>{l.label}</span>
                  </div>
                ))}
              </div>
            );
          })}
          <div className="border-r border-b border-black/70" />
          <div className="border-b border-black/70 p-0.5 text-right">Stand: {week.standDate ? formatIsoDe(week.standDate) : "–"}</div>

          {/* Körper */}
          <TimeAxis />
          {days.map((d) => (
            <DayColumn key={d.id} day={d} lanes={lanesByDay[d.id] ?? []} blocks={blocksByDay[d.id] ?? []} footnotes={footnotesByDay[d.id] ?? []} categories={categories} rowPx={ROW_PX} printMode />
          ))}
          <TimeAxis />
          <div className="row-span-2 flex flex-col gap-2 border-l border-black/40 p-1">
            {remarks && <div className="whitespace-pre-line">{remarks}</div>}
            <div>
              <div className="font-bold">Telefonnummern</div>
              <div>KP: {settings.phoneKp}</div>
              <div>LVZ/MCC: {settings.phoneLvzMcc}</div>
              <div>Tagesof: {settings.phoneTagesof}</div>
              <div>Wachtof: {wachtof ? `${wachtof.rank} ${wachtof.name.split(",")[0]} ${wachtof.phone}`.trim() : settings.phoneWachtof}</div>
            </div>
            {wochenziele && (
              <div>
                <div className="font-bold">Wochenziele</div>
                <div className="whitespace-pre-line">{wochenziele}</div>
              </div>
            )}
            <div className="mt-auto border-t border-black/40 pt-1">
              <div>{settings.companyName}</div>
              <div className="mt-8">{settings.kpKdtName}</div>
              <div>Kdt</div>
            </div>
          </div>

          {/* Fusszeile */}
          <div className="flex flex-col items-center justify-center border-r border-t border-black/70 text-center">
            <span className="wap-vertical-text">Termine / Info</span>
            <span className="mt-1 border-t border-black/70 pt-0.5">Tagesof</span>
          </div>
          {days.map((d) => (
            <div key={d.id} className="border-t border-black/70" style={{ height: FOOTER_H }}>
              <DayFooter day={d} footnotes={footnotesByDay[d.id] ?? []} personnel={personnel} printMode />
            </div>
          ))}
          <div className="border-r border-t border-black/70" />
        </div>
      </div>
    </div>
  );
}
